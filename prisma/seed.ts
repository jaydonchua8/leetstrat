import { CategoryKind, PrismaClient } from '@prisma/client';
import { codexSlugFor } from '../src/services/grading.service';
import { dataStructures, techniques } from './seed-data/codex';
import { problems, sourceUrlFor } from './seed-data/problems';

const prisma = new PrismaClient();

/**
 * Idempotent: problems and codex entries are upserted by slug, reference
 * answers by problemId. Edge cases are replaced wholesale on each run because
 * they have no natural key — attempts store their own snapshot, so nothing
 * references EdgeCase rows after grading.
 */
async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@leetstrat.dev' },
    update: {},
    create: { email: 'demo@leetstrat.dev', username: 'demo' },
  });

  for (const p of problems) {
    const { edgeCases, ...answer } = p.answer;
    const problem = await prisma.problem.upsert({
      where: { slug: p.slug },
      update: {
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        leetcodeId: p.leetcodeId,
        sourceUrl: sourceUrlFor(p),
      },
      create: {
        slug: p.slug,
        title: p.title,
        description: p.description,
        difficulty: p.difficulty,
        leetcodeId: p.leetcodeId,
        sourceUrl: sourceUrlFor(p),
      },
    });

    const ref = await prisma.referenceAnswer.upsert({
      where: { problemId: problem.id },
      update: answer,
      create: { problemId: problem.id, ...answer },
    });

    await prisma.edgeCase.deleteMany({ where: { referenceAnswerId: ref.id } });
    await prisma.edgeCase.createMany({
      data: edgeCases.map((ec) => ({
        referenceAnswerId: ref.id,
        description: ec.description,
        matchers: ec.matchers,
        explanation: ec.explanation ?? null,
      })),
    });
  }

  const codexRows = [
    ...Object.entries(techniques).map(([key, e]) => ({ kind: CategoryKind.TECHNIQUE, key, ...e })),
    ...Object.entries(dataStructures).map(([key, e]) => ({ kind: CategoryKind.DATA_STRUCTURE, key, ...e })),
  ];
  for (const row of codexRows) {
    const slug = codexSlugFor(row.kind, row.key);
    await prisma.codexEntry.upsert({
      where: { slug },
      update: { title: row.title, summary: row.summary, signals: row.signals },
      create: { slug, ...row },
    });
  }

  const counts = {
    userId: user.id,
    problems: await prisma.problem.count(),
    referenceAnswers: await prisma.referenceAnswer.count(),
    edgeCases: await prisma.edgeCase.count(),
    codexEntries: await prisma.codexEntry.count(),
  };
  // eslint-disable-next-line no-console
  console.log(counts);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
