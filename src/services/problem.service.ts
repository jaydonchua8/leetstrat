import { prisma } from '../lib/prisma';
import { NotFoundError } from '../lib/errors';
import { Difficulty, ProblemDetail, ProblemSummary } from '../types';

// These selects are the whole reason ReferenceAnswer is a separate table:
// nothing here can reach the answer key without an explicit include.
const summarySelect = {
  id: true,
  slug: true,
  title: true,
  difficulty: true,
  leetcodeId: true,
} as const;

const detailSelect = {
  ...summarySelect,
  description: true,
  sourceUrl: true,
} as const;

export async function listProblems(filter: {
  difficulty?: Difficulty | undefined;
}): Promise<ProblemSummary[]> {
  return prisma.problem.findMany({
    where: filter.difficulty ? { difficulty: filter.difficulty } : {},
    select: summarySelect,
    orderBy: [{ difficulty: 'asc' }, { title: 'asc' }],
  });
}

/** Accepts either the cuid or the slug so clients can deep-link by name. */
export async function getProblem(idOrSlug: string): Promise<ProblemDetail> {
  const problem = await prisma.problem.findFirst({
    where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
    select: detailSelect,
  });
  if (!problem) throw new NotFoundError(`Problem ${idOrSlug} not found`);
  return problem;
}
