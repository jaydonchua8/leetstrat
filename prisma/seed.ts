import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Minimal seed: one user and two problems with ground truth + edge cases
 * (including one decoy each) so /api/attempts/submit can be exercised
 * end-to-end immediately after `npm run db:migrate`.
 */
async function main() {
  const user = await prisma.user.upsert({
    where: { email: 'demo@leetstrat.dev' },
    update: {},
    create: { email: 'demo@leetstrat.dev', username: 'demo' },
  });

  const twoSum = await prisma.problem.upsert({
    where: { slug: 'two-sum' },
    update: {},
    create: {
      slug: 'two-sum',
      title: 'Two Sum',
      leetcodeId: 1,
      difficulty: 'EASY',
      description:
        'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      correctDataStructures: ['ARRAY', 'HASH_MAP'],
      correctTechniques: ['SIMULATION'],
      optimalTimeComplexity: 'O_N',
      optimalSpaceComplexity: 'O_N',
      optimalApproachSummary:
        'Store each value-to-index mapping as you scan once, checking for the complement before inserting.',
      edgeCases: {
        create: [
          { description: 'Duplicate values in the array', isRequired: true },
          { description: 'Negative numbers', isRequired: true },
          { description: 'Array is already sorted', isRequired: false }, // decoy
        ],
      },
    },
  });

  const longestSubstring = await prisma.problem.upsert({
    where: { slug: 'longest-substring-without-repeating-characters' },
    update: {},
    create: {
      slug: 'longest-substring-without-repeating-characters',
      title: 'Longest Substring Without Repeating Characters',
      leetcodeId: 3,
      difficulty: 'MEDIUM',
      description:
        'Given a string s, find the length of the longest substring without repeating characters.',
      correctDataStructures: ['STRING', 'HASH_SET'],
      correctTechniques: ['SLIDING_WINDOW', 'TWO_POINTERS'],
      optimalTimeComplexity: 'O_N',
      optimalSpaceComplexity: 'O_N',
      optimalApproachSummary:
        'Expand a window to the right and shrink from the left whenever a duplicate enters, so each character is visited at most twice.',
      edgeCases: {
        create: [
          { description: 'Empty string', isRequired: true },
          { description: 'All characters identical', isRequired: true },
          { description: 'String contains only digits', isRequired: false }, // decoy
        ],
      },
    },
  });

  // eslint-disable-next-line no-console
  console.log({
    userId: user.id,
    problems: [twoSum.id, longestSubstring.id],
  });
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
