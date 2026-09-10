import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import {
  ProblemAnswerKey,
  SubmitAttemptInput,
  SubmitAttemptResponse,
} from '../types';
import { buildTagOutcomes, gradeAttempt } from './grading.service';
import {
  applyAttemptCounters,
  applyTagOutcomes,
  buildAccuracyStats,
} from './analytics.service';
import { FeedbackProvider } from './feedback.service';

/** Loads ground truth and flattens it into the shape the grader expects. */
async function loadAnswerKey(problemId: string): Promise<ProblemAnswerKey> {
  const problem = await prisma.problem.findUnique({
    where: { id: problemId },
    include: {
      edgeCases: { select: { id: true, description: true, isRequired: true } },
    },
  });

  if (!problem) throw new NotFoundError(`Problem ${problemId} not found`);

  return {
    id: problem.id,
    title: problem.title,
    difficulty: problem.difficulty,
    correctDataStructures: problem.correctDataStructures,
    correctTechniques: problem.correctTechniques,
    optimalTimeComplexity: problem.optimalTimeComplexity,
    optimalSpaceComplexity: problem.optimalSpaceComplexity,
    optimalApproachSummary: problem.optimalApproachSummary,
    requiredEdgeCaseIds: problem.edgeCases
      .filter((e) => e.isRequired)
      .map((e) => e.id),
    edgeCaseDescriptions: Object.fromEntries(
      problem.edgeCases.map((e) => [e.id, e.description]),
    ),
  };
}

/**
 * Orchestrates one submission:
 *   1. load answer key      (read, outside tx)
 *   2. grade                (pure)
 *   3. generate feedback    (network, outside tx — never hold a tx open on I/O)
 *   4. persist + analytics  (single tx)
 */
export async function submitAttempt(
  input: SubmitAttemptInput,
  feedbackProvider: FeedbackProvider,
): Promise<SubmitAttemptResponse> {
  const key = await loadAnswerKey(input.problemId);

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
        selectedDataStructures: graded.dataStructures.selected,
        selectedTechniques: graded.techniques.selected,
        selectedTimeComplexity: input.selectedTimeComplexity,
        selectedSpaceComplexity: input.selectedSpaceComplexity,
        selectedEdgeCaseIds: graded.edgeCases.selected,
        dataStructuresCorrect: graded.dataStructures.isCorrect,
        techniquesCorrect: graded.techniques.isCorrect,
        timeComplexityCorrect: graded.timeComplexity.isCorrect,
        spaceComplexityCorrect: graded.spaceComplexity.isCorrect,
        edgeCasesCorrect: graded.edgeCases.isCorrect,
        isFullyCorrect: graded.isFullyCorrect,
        score: graded.score,
        feedback,
        durationMs: input.durationMs,
      },
      select: { id: true },
    });

    await applyTagOutcomes(tx, input.userId, outcomes);
    const totals = await applyAttemptCounters(
      tx,
      input.userId,
      graded.isFullyCorrect,
    );
    const stats = await buildAccuracyStats(tx, input.userId, totals, outcomes);

    return { attemptId: attempt.id, stats };
  });

  return {
    attemptId: result.attemptId,
    problemId: key.id,
    breakdown: {
      dataStructures: graded.dataStructures,
      techniques: graded.techniques,
      timeComplexity: graded.timeComplexity,
      spaceComplexity: graded.spaceComplexity,
      edgeCases: { ...graded.edgeCases, descriptions: key.edgeCaseDescriptions },
    },
    isFullyCorrect: graded.isFullyCorrect,
    score: graded.score,
    stats: result.stats,
    feedback,
  };
}
