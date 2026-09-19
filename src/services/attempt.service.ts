import { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import {
  AttemptResult,
  GradedAttempt,
  ProblemAnswerKey,
  ProblemSummary,
  SubmitAttemptInput,
  SubmitAttemptResponse,
} from '../types';
import { buildCodexRefs, buildTagOutcomes, gradeAttempt } from './grading.service';
import {
  applyAttemptCounters,
  applyTagOutcomes,
  buildAccuracyStats,
} from './analytics.service';
import { resolveCodexLinks } from './codex.service';
import { FeedbackProvider } from './feedback.service';

const problemSummarySelect = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  leetcodeId: true,
} as const;

/**
 * Loads the problem plus its ground truth, returning the public summary and
 * the answer key flattened into the shape the grader expects.
 */
async function loadProblemForGrading(
  problemId: string,
): Promise<{ summary: ProblemSummary; key: ProblemAnswerKey }> {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      referenceAnswer: {
        include: {
          edgeCases: {
            select: { id: true, description: true, matchers: true, explanation: true },
          },
        },
      },
    },
  });

  if (!problem) throw new NotFoundError(`Problem ${problemId} not found`);
  // A problem without an answer key can't be graded; treat it as unpublished.
  if (!problem.referenceAnswer) {
    throw new NotFoundError(`Problem ${problemId} has no reference answer`);
  }

  const ref = problem.referenceAnswer;
  const summary: ProblemSummary = {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    leetcodeId: problem.leetcodeId,
  };
  const key: ProblemAnswerKey = {
    id: problem.id,
    slug: problem.slug,
    title: problem.title,
    difficulty: problem.difficulty,
    primaryDataStructure: ref.primaryDataStructure,
    acceptedDataStructures: ref.acceptedDataStructures,
    primaryTechnique: ref.primaryTechnique,
    acceptedTechniques: ref.acceptedTechniques,
    primaryTimeComplexity: ref.primaryTimeComplexity,
    acceptedTimeComplexities: ref.acceptedTimeComplexities,
    primarySpaceComplexity: ref.primarySpaceComplexity,
    acceptedSpaceComplexities: ref.acceptedSpaceComplexities,
    approachSummary: ref.approachSummary,
    explanation: ref.explanation,
    edgeCases: ref.edgeCases,
  };
  return { summary, key };
}

/**
 * Orchestrates one submission:
 *   1. load answer key      (read, outside tx)
 *   2. grade                (pure)
 *   3. generate feedback    (network, outside tx — never hold a tx open on I/O)
 *   4. persist + analytics  (single tx)
 *   5. resolve codex links  (read, outside tx)
 */
export async function submitAttempt(
  input: SubmitAttemptInput,
  feedbackProvider: FeedbackProvider,
): Promise<SubmitAttemptResponse> {
  const { summary, key } = await loadProblemForGrading(input.problemId);

  const userExists = await prisma.user.findUnique({
    where: { id: input.userId },
    select: { id: true },
  });
  if (!userExists) throw new NotFoundError(`User ${input.userId} not found`);

  const graded = gradeAttempt(input, key);
  const outcomes = buildTagOutcomes(graded);

  // Deliberately before the transaction: an LLM call can take seconds, and
  // holding a Postgres transaction open that long will exhaust the pool.
  const feedback = await feedbackProvider.generate(graded, key);

  const result = await prisma.$transaction(async (tx) => {
    const attempt = await tx.attempt.create({
      data: {
        userId: input.userId,
        problemId: input.problemId,
        selectedDataStructure: input.selectedDataStructure,
        selectedTechnique: input.selectedTechnique,
        selectedTimeComplexity: input.selectedTimeComplexity,
        selectedSpaceComplexity: input.selectedSpaceComplexity,
        edgeCasesText: input.edgeCasesText,
        dataStructureCorrect: graded.dataStructure.isCorrect,
        techniqueCorrect: graded.technique.isCorrect,
        timeComplexityCorrect: graded.timeComplexity.isCorrect,
        spaceComplexityCorrect: graded.spaceComplexity.isCorrect,
        edgeCasesCorrect: graded.edgeCases.isCorrect,
        isFullyCorrect: graded.isFullyCorrect,
        score: graded.score,
        breakdown: graded as unknown as Prisma.InputJsonValue,
        feedback,
        durationMs: input.durationMs ?? null,
      },
      select: { id: true, createdAt: true },
    });

    await applyTagOutcomes(tx, input.userId, outcomes);
    const totals = await applyAttemptCounters(
      tx,
      input.userId,
      graded.isFullyCorrect,
    );
    const stats = await buildAccuracyStats(tx, input.userId, totals, outcomes);

    return { attemptId: attempt.id, createdAt: attempt.createdAt, stats };
  });

  const codexLinks = await resolveCodexLinks(buildCodexRefs(graded));

  return {
    attemptId: result.attemptId,
    problem: summary,
    breakdown: graded,
    isFullyCorrect: graded.isFullyCorrect,
    score: graded.score,
    reference: { approachSummary: key.approachSummary, explanation: key.explanation },
    codexLinks,
    feedback,
    createdAt: result.createdAt.toISOString(),
    stats: result.stats,
  };
}

/**
 * Re-hydrates a scored result from the stored breakdown snapshot. The
 * reference explanation is read live (an improved explanation should reach
 * old attempts), but the grading itself is never recomputed.
 */
export async function getAttempt(attemptId: string): Promise<AttemptResult> {
  const attempt = await prisma.attempt.findUnique({
    where: { id: attemptId },
    include: {
      problem: {
        select: {
          ...problemSummarySelect,
          referenceAnswer: { select: { approachSummary: true, explanation: true } },
        },
      },
    },
  });
  if (!attempt) throw new NotFoundError(`Attempt ${attemptId} not found`);

  const graded = attempt.breakdown as unknown as GradedAttempt;
  const { referenceAnswer, ...problem } = attempt.problem;
  const codexLinks = await resolveCodexLinks(buildCodexRefs(graded));

  return {
    attemptId: attempt.id,
    problem,
    breakdown: graded,
    isFullyCorrect: attempt.isFullyCorrect,
    score: attempt.score,
    reference: referenceAnswer ?? { approachSummary: '', explanation: '' },
    codexLinks,
    feedback: attempt.feedback,
    createdAt: attempt.createdAt.toISOString(),
  };
}
