import {
  AlgorithmicTechnique,
  Complexity,
  DataStructure,
  Difficulty,
} from '@prisma/client';

export interface EdgeCaseSeed {
  description: string;
  /** Generous lowercase variants — see NOTES.md on why this is brittle. */
  matchers: string[];
  explanation?: string;
}

export interface ProblemSeed {
  slug: string;
  title: string;
  leetcodeId: number;
  difficulty: Difficulty;
  description: string;
  answer: {
    primaryDataStructure: DataStructure;
    acceptedDataStructures: DataStructure[];
    primaryTechnique: AlgorithmicTechnique;
    acceptedTechniques: AlgorithmicTechnique[];
    primaryTimeComplexity: Complexity;
    acceptedTimeComplexities: Complexity[];
    primarySpaceComplexity: Complexity;
    acceptedSpaceComplexities: Complexity[];
    approachSummary: string;
    explanation: string;
    edgeCases: EdgeCaseSeed[];
  };
}

const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;
export const sourceUrlFor = (p: ProblemSeed) => lc(p.slug);

// Shared matcher pools for edge cases that recur across problems.
const EMPTY_INPUT = ['empty', 'length 0', 'length zero', 'n == 0', 'n=0', 'n = 0', 'no elements', 'nothing in', 'zero elements', 'size 0', 'size zero', 'null'];
const SINGLE_ELEMENT = ['single', 'one element', 'only one', 'length 1', 'length one', 'n == 1', 'n=1', 'n = 1', 'size 1', 'just one', '1 element', 'one item', 'one node'];
const DUPLICATES = ['duplicate', 'repeated', 'same value', 'same number', 'equal values', 'equal elements', 'identical', 'repeat'];
const NEGATIVES = ['negative', 'below zero', 'less than zero', '< 0', 'minus'];

export const problems: ProblemSeed[] = [
  // -------------------------------------------------------------------------
  // TWO POINTERS
  // -------------------------------------------------------------------------
  {
    slug: 'two-sum-ii-input-array-is-sorted',
    title: 'Two Sum II - Input Array Is Sorted',
    leetcodeId: 167,
    difficulty: 'MEDIUM',
    description: `Given a 1-indexed array of integers \`numbers\` that is already sorted in non-decreasing order, find two numbers such that they add up to a specific \`target\` number. Return the indices of the two numbers, \`index1\` and \`index2\`, added by one, as an integer array \`[index1, index2]\` of length 2.

The tests are generated such that there is exactly one solution. You may not use the same element twice.

Your solution must use only constant extra space.

Constraints:
- 2 <= numbers.length <= 3 * 10^4
- -1000 <= numbers[i] <= 1000
- numbers is sorted in non-decreasing order
- -1000 <= target <= 1000`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: [],
      primaryTechnique: 'TWO_POINTERS',
      acceptedTechniques: ['BINARY_SEARCH'],
      primaryTimeComplexity: 'O_N',
      acceptedTimeComplexities: ['O_N_LOG_N'],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Put one pointer at each end. If the sum is too small move the left pointer right; if too big move the right pointer left; stop when they hit the target.',
      explanation:
        'Two signals: the input is SORTED and you are told to use O(1) extra space. Sorted means moving a pointer changes the sum monotonically, so every step provably discards a candidate. The space limit rules out the hash-map trick from Two Sum I. Binary search for each complement also works but costs O(n log n).',
      edgeCases: [
        {
          description: 'Array of exactly two elements',
          matchers: ['two element', '2 element', 'length 2', 'length two', 'n == 2', 'n=2', 'n = 2', 'only two', 'minimum length', 'smallest input', 'size 2'],
        },
        {
          description: 'Negative numbers and a negative target',
          matchers: NEGATIVES,
        },
        {
          description: 'Duplicate values (e.g. [3,3] with target 6)',
          matchers: DUPLICATES,
          explanation: 'Two pointers handles this naturally, but a hash map keyed by value would overwrite the first index.',
        },
      ],
    },
  },
  {
    slug: 'container-with-most-water',
    title: 'Container With Most Water',
    leetcodeId: 11,
    difficulty: 'MEDIUM',
    description: `You are given an integer array \`height\` of length \`n\`. There are \`n\` vertical lines drawn such that the two endpoints of the i-th line are \`(i, 0)\` and \`(i, height[i])\`.

Find two lines that together with the x-axis form a container, such that the container contains the most water. Return the maximum amount of water a container can store.

Notice that you may not slant the container.

Constraints:
- n == height.length
- 2 <= n <= 10^5
- 0 <= height[i] <= 10^4`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: [],
      primaryTechnique: 'TWO_POINTERS',
      acceptedTechniques: ['GREEDY'],
      primaryTimeComplexity: 'O_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Start with pointers at both ends (widest container). Record the area, then move whichever pointer has the shorter line inward, because the shorter side is the bottleneck.',
      explanation:
        'n up to 10^5 rules out the O(n²) pair scan. The key insight is that area = width × min(height), and width only shrinks as you move inward, so the only way to do better is to raise the minimum — which means abandoning the shorter line. That exchange argument is what makes two pointers correct here even though the array is not sorted.',
      edgeCases: [
        {
          description: 'Only two lines',
          matchers: ['two element', '2 element', 'two line', '2 line', 'length 2', 'length two', 'n == 2', 'n=2', 'n = 2', 'only two', 'minimum length', 'smallest input', 'size 2'],
        },
        {
          description: 'All heights equal',
          matchers: ['all equal', 'all the same', 'same height', 'equal height', 'identical height', 'all same', 'uniform'],
          explanation: 'The answer is then just the widest span; make sure the pointer-move rule still terminates.',
        },
        {
          description: 'Lines with zero height',
          matchers: ['zero height', 'height 0', 'height of 0', 'height zero', 'height[i] == 0', 'height[i] = 0', 'is 0', 'zero'],
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // SLIDING WINDOW
  // -------------------------------------------------------------------------
  {
    slug: 'longest-substring-without-repeating-characters',
    title: 'Longest Substring Without Repeating Characters',
    leetcodeId: 3,
    difficulty: 'MEDIUM',
    description: `Given a string \`s\`, find the length of the longest substring without duplicate characters.

Constraints:
- 0 <= s.length <= 5 * 10^4
- s consists of English letters, digits, symbols and spaces.`,
    answer: {
      primaryDataStructure: 'HASH_SET',
      acceptedDataStructures: ['HASH_MAP', 'ARRAY'],
      primaryTechnique: 'SLIDING_WINDOW',
      acceptedTechniques: ['TWO_POINTERS'],
      primaryTimeComplexity: 'O_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: ['O_N'],
      approachSummary:
        'Grow a window to the right, tracking the characters inside it in a set. When the next character is already present, shrink from the left until it is not. Track the max window length.',
      explanation:
        'You want the longest CONTIGUOUS run satisfying a property (no repeats), and the property is broken by adding a character and repaired by removing from the left — that pairing is the sliding window signature. Each character enters and leaves the window at most once, so it is O(n). The set is bounded by the ASCII alphabet, so O(1) space; O(n) is also accepted if you count it as "up to n distinct characters".',
      edgeCases: [
        {
          description: 'Empty string',
          matchers: [...EMPTY_INPUT, 'empty string', '""', "''"],
        },
        {
          description: 'All characters identical (e.g. "aaaa")',
          matchers: ['all same', 'all identical', 'same character', 'same char', 'the same', 'every char', 'every character', 'aaaa', 'aaa', 'one repeated', 'only one character', 'single character', 'one letter', 'same letter', 'one distinct', 'all the same', 'identical', 'no unique'],
          explanation: 'The window never grows past 1; make sure the shrink step is not an off-by-one.',
        },
        {
          description: 'All characters unique (answer is the full length)',
          matchers: ['all unique', 'all distinct', 'no repeat', 'no duplicate', 'never repeat', 'entire string', 'whole string', 'full length', 'abcdef'],
        },
        {
          description: 'Spaces and symbols count as characters',
          matchers: ['space', 'symbol', 'punctuation', 'non-letter', 'non letter', 'special char', 'digit', 'not just letters', 'unicode'],
          explanation: 'If you use a fixed 26-slot array you will index out of bounds; use 128/256 slots or a set.',
        },
      ],
    },
  },
  {
    slug: 'minimum-window-substring',
    title: 'Minimum Window Substring',
    leetcodeId: 76,
    difficulty: 'HARD',
    description: `Given two strings \`s\` and \`t\` of lengths \`m\` and \`n\` respectively, return the minimum window substring of \`s\` such that every character in \`t\` (including duplicates) is included in the window. If there is no such substring, return the empty string "".

The testcases will be generated such that the answer is unique.

Constraints:
- m == s.length
- n == t.length
- 1 <= m, n <= 10^5
- s and t consist of uppercase and lowercase English letters.

Follow up: Could you find an algorithm that runs in O(m + n) time?`,
    answer: {
      primaryDataStructure: 'HASH_MAP',
      acceptedDataStructures: ['ARRAY'],
      primaryTechnique: 'SLIDING_WINDOW',
      acceptedTechniques: ['TWO_POINTERS'],
      primaryTimeComplexity: 'O_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: ['O_N'],
      approachSummary:
        'Count the characters needed from t. Expand the right edge until the window satisfies every count, then shrink the left edge as far as possible while it still does, recording the best. Keep a "how many distinct chars are still unsatisfied" counter so the check is O(1).',
      explanation:
        'Minimum contiguous substring satisfying a count constraint is the canonical "shrinkable window": once a window is valid, moving the left edge can only make it smaller, so you always try shrinking before expanding. The O(m + n) follow-up hint confirms each pointer must move monotonically. The map is bounded by 52 letters, hence O(1) space (O(n) accepted).',
      edgeCases: [
        {
          description: 't is longer than s (impossible)',
          matchers: ['t longer', 't is longer', 'longer than s', 't.length > s.length', 'n > m', 'len(t) > len(s)', 'bigger than s', 'larger than s', 'impossible', 'no window', 'no valid', 'not possible', 'return ""', 'return empty', 'empty string'],
        },
        {
          description: 't contains duplicate characters (counts matter, not presence)',
          matchers: ['duplicate', 'repeated', 'count', 'multiple of the same', 'aab', 'aa', 'frequency', 'more than once', 'twice', 'same letter'],
          explanation: 'A set of required characters is wrong; you need a multiset / count map.',
        },
        {
          description: 's equals t, or the answer is the whole string',
          matchers: ['s == t', 's = t', 's equals t', 'same string', 'whole string', 'entire string', 'whole of s', 'all of s', 'identical'],
        },
        {
          description: 'Upper and lower case are distinct characters',
          matchers: ['case', 'uppercase', 'upper case', 'lowercase', 'lower case', 'capital'],
          explanation: 'A 26-slot array silently merges them; use 128 slots or a map.',
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // BFS / DFS
  // -------------------------------------------------------------------------
  {
    slug: 'number-of-islands',
    title: 'Number of Islands',
    leetcodeId: 200,
    difficulty: 'MEDIUM',
    description: `Given an \`m x n\` 2D binary grid \`grid\` which represents a map of '1's (land) and '0's (water), return the number of islands.

An island is surrounded by water and is formed by connecting adjacent lands horizontally or vertically. You may assume all four edges of the grid are all surrounded by water.

Constraints:
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 300
- grid[i][j] is '0' or '1'.`,
    answer: {
      primaryDataStructure: 'MATRIX',
      acceptedDataStructures: ['GRAPH', 'UNION_FIND', 'QUEUE', 'STACK'],
      primaryTechnique: 'DFS',
      acceptedTechniques: ['BFS'],
      primaryTimeComplexity: 'O_N_TIMES_M',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_N_TIMES_M',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Scan every cell. Each time you find unvisited land, increment the count and flood-fill from it (DFS or BFS), marking every reachable land cell visited so it is never counted again.',
      explanation:
        '"Count connected regions in a grid" is a connected-components question, and the grid IS the graph: cells are nodes, 4-directional adjacency is the edges. Any traversal that fully explores a component works; DFS is the shortest to write. Union-Find also solves it and is the better choice if the grid changes over time. Every cell is visited a constant number of times → O(m·n); the recursion stack or queue can hold O(m·n) cells in the worst case.',
      edgeCases: [
        {
          description: 'All water (zero islands)',
          matchers: ['all water', 'all 0', "all '0'", 'all zero', 'no land', 'no island', 'zero island', 'only water', 'no 1', "no '1'", 'return 0'],
        },
        {
          description: 'All land (one big island)',
          matchers: ['all land', 'all 1', "all '1'", 'all one', 'one island', 'single island', 'one big', 'entire grid is land', 'only land', 'full grid'],
          explanation: 'Recursive DFS on a 300×300 all-land grid recurses 90,000 deep — a stack overflow risk in some runtimes; iterative DFS or BFS avoids it.',
        },
        {
          description: '1x1 grid',
          matchers: ['1x1', '1 x 1', 'single cell', 'one cell', 'single row', 'single column', 'one row', 'one column', 'm == 1', 'n == 1', 'm=1', 'n=1', '1 by 1'],
        },
        {
          description: 'Diagonal cells are not connected',
          matchers: ['diagonal', 'corner', '4-direction', '4 direction', 'four direction', 'only up down left right', 'not adjacent', 'touching at a corner', 'four neighbours', 'four neighbors', '8-direction'],
        },
      ],
    },
  },
  {
    slug: 'rotting-oranges',
    title: 'Rotting Oranges',
    leetcodeId: 994,
    difficulty: 'MEDIUM',
    description: `You are given an \`m x n\` grid where each cell can have one of three values:
- 0 representing an empty cell,
- 1 representing a fresh orange, or
- 2 representing a rotten orange.

Every minute, any fresh orange that is 4-directionally adjacent to a rotten orange becomes rotten.

Return the minimum number of minutes that must elapse until no cell has a fresh orange. If this is impossible, return -1.

Constraints:
- m == grid.length
- n == grid[i].length
- 1 <= m, n <= 10
- grid[i][j] is 0, 1, or 2.`,
    answer: {
      primaryDataStructure: 'QUEUE',
      acceptedDataStructures: ['MATRIX'],
      primaryTechnique: 'BFS',
      acceptedTechniques: [],
      primaryTimeComplexity: 'O_N_TIMES_M',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_N_TIMES_M',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Seed a queue with every rotten orange at time 0 and count the fresh ones. BFS level by level; each level is one minute. When the queue empties, if any fresh orange remains return -1, else return the number of levels.',
      explanation:
        'Two signals: "minimum number of minutes" (shortest distance, unweighted) and rot spreading simultaneously from EVERY rotten orange (multiple sources). Shortest paths on an unweighted graph is BFS, and multi-source BFS is just BFS with all sources enqueued up front. DFS cannot give you the minimum here because it explores one path deeply rather than all frontiers in lockstep.',
      edgeCases: [
        {
          description: 'Fresh oranges exist but no rotten orange (return -1)',
          matchers: ['no rotten', 'no 2', 'zero rotten', 'without rotten', 'never rot', 'return -1', '-1', 'unreachable', 'cannot rot', "can't rot", 'impossible'],
        },
        {
          description: 'No fresh oranges at all (return 0)',
          matchers: ['no fresh', 'no 1', 'zero fresh', 'all rotten', 'all empty', 'return 0', 'already rotten', 'nothing to rot', 'nothing fresh', 'only rotten', 'only empty', 'all 0', 'all 2'],
          explanation: 'A naive "levels − 1" answer gives −1 here instead of 0.',
        },
        {
          description: 'A fresh orange isolated by empty cells (unreachable)',
          matchers: ['isolated', 'unreachable', 'cut off', 'surrounded by 0', 'surrounded by empty', 'blocked', 'walled off', 'cannot reach', "can't reach", 'not connected', 'disconnected', 'separated'],
        },
        {
          description: 'Multiple rotten oranges spreading at the same time (multi-source)',
          matchers: ['multiple rotten', 'many rotten', 'several rotten', 'multi-source', 'multi source', 'multiple source', 'more than one rotten', 'two rotten', 'simultaneous', 'at the same time', 'all sources'],
        },
      ],
    },
  },
  {
    slug: 'binary-tree-level-order-traversal',
    title: 'Binary Tree Level Order Traversal',
    leetcodeId: 102,
    difficulty: 'MEDIUM',
    description: `Given the \`root\` of a binary tree, return the level order traversal of its nodes' values. (i.e., from left to right, level by level).

Constraints:
- The number of nodes in the tree is in the range [0, 2000].
- -1000 <= Node.val <= 1000`,
    answer: {
      primaryDataStructure: 'QUEUE',
      acceptedDataStructures: ['BINARY_TREE'],
      primaryTechnique: 'BFS',
      acceptedTechniques: ['DFS'],
      primaryTimeComplexity: 'O_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_N',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Push the root into a queue. While the queue is non-empty, take a snapshot of its size, pop exactly that many nodes into one level list (enqueueing their children), and append the list to the result.',
      explanation:
        '"Level by level" is BFS by definition: a queue processes nodes in order of depth. The trick that beats most people is recording the queue length at the start of each iteration so you know where one level ends. DFS also works if you pass the depth down and index into result[depth] — accepted, but it is the less natural fit.',
      edgeCases: [
        {
          description: 'Empty tree (null root)',
          matchers: [...EMPTY_INPUT, 'null root', 'root is null', 'root == null', 'no nodes', 'empty tree', 'none', 'nil'],
        },
        {
          description: 'Single node',
          matchers: [...SINGLE_ELEMENT, 'only the root', 'just the root', 'root only', 'leaf only'],
        },
        {
          description: 'Skewed tree (every node has one child)',
          matchers: ['skew', 'linked list', 'one child', 'only left', 'only right', 'chain', 'unbalanced', 'degenerate', 'linear', 'deep tree', 'depth 2000', 'every level has one'],
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // DYNAMIC PROGRAMMING
  // -------------------------------------------------------------------------
  {
    slug: 'climbing-stairs',
    title: 'Climbing Stairs',
    leetcodeId: 70,
    difficulty: 'EASY',
    description: `You are climbing a staircase. It takes \`n\` steps to reach the top.

Each time you can either climb 1 or 2 steps. In how many distinct ways can you climb to the top?

Constraints:
- 1 <= n <= 45`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: [],
      primaryTechnique: 'DYNAMIC_PROGRAMMING',
      acceptedTechniques: ['MEMOIZATION'],
      primaryTimeComplexity: 'O_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: ['O_N'],
      approachSummary:
        'ways(i) = ways(i−1) + ways(i−2), with ways(1)=1 and ways(2)=2. Iterate up from the bottom keeping only the last two values.',
      explanation:
        '"How many distinct ways" plus choices that reduce the problem to a strictly smaller instance of itself (n−1 or n−2) is the DP signature. The naive recursion is exponential because it recomputes the same sub-problems; either memoize top-down or tabulate bottom-up. Since each state depends only on the previous two, the table collapses to two variables → O(1) space (O(n) for a full table is also accepted).',
      edgeCases: [
        {
          description: 'n = 1 (exactly one way)',
          matchers: ['n == 1', 'n=1', 'n = 1', 'one step', 'single step', '1 step', 'base case', 'smallest n', 'n is 1'],
        },
        {
          description: 'n = 2 (two ways: 1+1 or 2)',
          matchers: ['n == 2', 'n=2', 'n = 2', 'two step', '2 step', 'n is 2', 'base case'],
          explanation: 'Off-by-one in the base cases is the usual bug: ways(2) is 2, not 1.',
        },
        {
          description: 'Large n (45) — result fits in a 32-bit int but naive recursion times out',
          matchers: ['large n', 'n = 45', 'n == 45', '45', 'overflow', 'big n', 'time out', 'timeout', 'tle', 'exponential', 'too slow', 'max n', 'upper bound', 'fibonacci'],
        },
      ],
    },
  },
  {
    slug: 'coin-change',
    title: 'Coin Change',
    leetcodeId: 322,
    difficulty: 'MEDIUM',
    description: `You are given an integer array \`coins\` representing coins of different denominations and an integer \`amount\` representing a total amount of money.

Return the fewest number of coins that you need to make up that amount. If that amount of money cannot be made up by any combination of the coins, return -1.

You may assume that you have an infinite number of each kind of coin.

Constraints:
- 1 <= coins.length <= 12
- 1 <= coins[i] <= 2^31 - 1
- 0 <= amount <= 10^4`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: ['HASH_MAP'],
      primaryTechnique: 'DYNAMIC_PROGRAMMING',
      acceptedTechniques: ['MEMOIZATION', 'BFS'],
      primaryTimeComplexity: 'O_N_TIMES_M',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_N',
      acceptedSpaceComplexities: [],
      approachSummary:
        'dp[a] = minimum coins to make amount a. Initialise dp[0]=0 and everything else to infinity; for each amount from 1..amount and each coin, dp[a] = min(dp[a], dp[a−coin]+1). Answer dp[amount] or −1 if still infinite.',
      explanation:
        '"Fewest coins" is an optimisation over unbounded choices, and the greedy pick-the-biggest-coin approach fails (coins [1,3,4], amount 6). When greedy fails on an optimisation with overlapping sub-problems, reach for DP. amount ≤ 10^4 and ≤ 12 coins makes O(amount × coins) trivially fast. BFS over amounts (each coin is an edge) is accepted since "fewest coins" is a shortest path in an unweighted graph.',
      edgeCases: [
        {
          description: 'amount = 0 (answer 0)',
          matchers: ['amount 0', 'amount = 0', 'amount == 0', 'amount is 0', 'amount of 0', 'zero amount', 'amount zero', 'return 0', 'target 0', 'target is 0', 'nothing to make'],
        },
        {
          description: 'Amount cannot be made (return -1)',
          matchers: ['-1', 'impossible', 'cannot be made', "can't be made", 'no solution', 'not possible', 'unreachable', 'no combination', 'cannot make', "can't make", 'infinite', 'infinity', 'no way'],
        },
        {
          description: 'A coin larger than the amount (must be skipped, not crash)',
          matchers: ['larger than amount', 'bigger than amount', 'greater than amount', 'coin > amount', 'exceeds amount', 'coin too big', 'coin too large', 'negative index', 'out of bounds', 'skip coin', 'huge coin', '2^31'],
          explanation: 'dp[a − coin] with a negative index is the classic crash; guard coin <= a.',
        },
        {
          description: 'Single coin denomination',
          matchers: ['single coin', 'one coin', 'only one coin', 'one denomination', 'single denomination', 'coins.length == 1', 'one type of coin', 'just one coin', 'only 1 coin'],
        },
      ],
    },
  },
  {
    slug: 'longest-increasing-subsequence',
    title: 'Longest Increasing Subsequence',
    leetcodeId: 300,
    difficulty: 'MEDIUM',
    description: `Given an integer array \`nums\`, return the length of the longest strictly increasing subsequence.

Constraints:
- 1 <= nums.length <= 2500
- -10^4 <= nums[i] <= 10^4

Follow up: Can you come up with an algorithm that runs in O(n log(n)) time complexity?`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: [],
      primaryTechnique: 'DYNAMIC_PROGRAMMING',
      acceptedTechniques: ['BINARY_SEARCH'],
      primaryTimeComplexity: 'O_N_SQUARED',
      acceptedTimeComplexities: ['O_N_LOG_N'],
      primarySpaceComplexity: 'O_N',
      acceptedSpaceComplexities: [],
      approachSummary:
        'dp[i] = length of the longest increasing subsequence ending at i. For each i, look at every j < i with nums[j] < nums[i] and take max(dp[j]) + 1. Answer is max(dp). The O(n log n) version keeps a "tails" array and binary-searches the insertion point for each number.',
      explanation:
        '"Longest SUBSEQUENCE" (not substring — elements need not be contiguous) with an ordering constraint is textbook DP: the best answer ending at i depends only on best answers ending earlier. n ≤ 2500 tells you O(n²) is fine, which is why that is the primary answer; the O(n log n) patience-sorting variant with binary search is accepted because the statement asks for it as a follow-up.',
      edgeCases: [
        {
          description: 'Single element (answer 1)',
          matchers: [...SINGLE_ELEMENT, 'return 1', 'answer is 1', 'answer 1', 'length is 1'],
        },
        {
          description: 'Strictly decreasing array (answer 1)',
          matchers: ['decreasing', 'descending', 'reverse sorted', 'sorted in reverse', 'reversed', 'all decreasing', 'going down', '5 4 3 2 1', '[5,4,3,2,1]', 'answer 1', 'return 1'],
        },
        {
          description: 'Duplicates — equal values do not extend a strictly increasing subsequence',
          matchers: [...DUPLICATES, 'strictly', 'equal', 'non-decreasing', 'not strictly', '<= vs <', '< vs <=', 'less than or equal', '[2,2,2]', '2 2 2'],
          explanation: 'Using <= instead of < turns the problem into longest non-decreasing subsequence.',
        },
        {
          description: 'Already sorted ascending (answer is n)',
          matchers: ['already sorted', 'already increasing', 'ascending', 'sorted ascending', 'fully increasing', 'whole array', 'entire array', 'answer is n', 'answer n', 'return n', 'all increasing', 'strictly increasing input', '1 2 3 4'],
        },
      ],
    },
  },

  // -------------------------------------------------------------------------
  // BINARY SEARCH
  // -------------------------------------------------------------------------
  {
    slug: 'search-in-rotated-sorted-array',
    title: 'Search in Rotated Sorted Array',
    leetcodeId: 33,
    difficulty: 'MEDIUM',
    description: `There is an integer array \`nums\` sorted in ascending order (with distinct values).

Prior to being passed to your function, \`nums\` is possibly rotated at an unknown pivot index \`k\` (1 <= k < nums.length) such that the resulting array is \`[nums[k], nums[k+1], ..., nums[n-1], nums[0], nums[1], ..., nums[k-1]]\` (0-indexed). For example, \`[0,1,2,4,5,6,7]\` might be rotated at pivot index 3 and become \`[4,5,6,7,0,1,2]\`.

Given the array \`nums\` after the possible rotation and an integer \`target\`, return the index of \`target\` if it is in \`nums\`, or -1 if it is not in \`nums\`.

You must write an algorithm with O(log n) runtime complexity.

Constraints:
- 1 <= nums.length <= 5000
- -10^4 <= nums[i] <= 10^4
- All values of nums are unique.
- nums is an ascending array that is possibly rotated.
- -10^4 <= target <= 10^4`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: [],
      primaryTechnique: 'BINARY_SEARCH',
      acceptedTechniques: [],
      primaryTimeComplexity: 'O_LOG_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Binary search, but at each step decide which half is properly sorted (compare nums[lo] with nums[mid]). If the target lies inside the sorted half, search there; otherwise search the other half.',
      explanation:
        'The statement demands O(log n) on an array that is "sorted... possibly rotated" — that phrase, plus the log requirement, means binary search with a twist. The twist: at least one half of any rotated-sorted range is itself sorted, and you can check whether the target is inside that half in O(1). The requirement that values are unique is what makes that check unambiguous.',
      edgeCases: [
        {
          description: 'Not rotated at all (k = 0, plain sorted array)',
          matchers: ['not rotated', 'no rotation', 'unrotated', 'k = 0', 'k == 0', 'k=0', 'rotation of 0', 'already sorted', 'fully sorted', 'plain sorted', 'zero rotation', 'pivot at 0', 'rotated by n'],
        },
        {
          description: 'Single element',
          matchers: SINGLE_ELEMENT,
        },
        {
          description: 'Target not present (return -1)',
          matchers: ['not present', 'not in', 'not found', 'missing', 'absent', 'return -1', '-1', 'does not exist', "doesn't exist", 'no match', 'not exist'],
        },
        {
          description: 'Pivot lands exactly on mid, or a two-element array',
          matchers: ['pivot at mid', 'mid is the pivot', 'mid == pivot', 'pivot == mid', 'two element', '2 element', 'length 2', 'n == 2', 'n=2', 'n = 2', 'lo == mid', 'mid equals', 'boundary', 'equal to mid', 'nums[lo] == nums[mid]', 'nums[mid] == nums[lo]'],
          explanation: 'With two elements mid == lo; make sure your "is the left half sorted" test uses <= not <.',
        },
      ],
    },
  },
  {
    slug: 'koko-eating-bananas',
    title: 'Koko Eating Bananas',
    leetcodeId: 875,
    difficulty: 'MEDIUM',
    description: `Koko loves to eat bananas. There are \`n\` piles of bananas, the i-th pile has \`piles[i]\` bananas. The guards have gone and will come back in \`h\` hours.

Koko can decide her bananas-per-hour eating speed of \`k\`. Each hour, she chooses some pile of bananas and eats \`k\` bananas from that pile. If the pile has less than \`k\` bananas, she eats all of them instead and will not eat any more bananas during this hour.

Koko likes to eat slowly but still wants to finish eating all the bananas before the guards return.

Return the minimum integer \`k\` such that she can eat all the bananas within \`h\` hours.

Constraints:
- 1 <= piles.length <= 10^4
- piles.length <= h <= 10^9
- 1 <= piles[i] <= 10^9`,
    answer: {
      primaryDataStructure: 'ARRAY',
      acceptedDataStructures: [],
      primaryTechnique: 'BINARY_SEARCH',
      acceptedTechniques: [],
      primaryTimeComplexity: 'O_N_LOG_N',
      acceptedTimeComplexities: [],
      primarySpaceComplexity: 'O_1',
      acceptedSpaceComplexities: [],
      approachSummary:
        'Binary search on the answer k in [1, max(piles)]. For a candidate k, compute hours needed = Σ ceil(pile / k); if that is ≤ h, k is feasible so try smaller, otherwise try larger. Return the smallest feasible k.',
      explanation:
        'This is "binary search on the answer": there is no sorted array, but feasibility is MONOTONIC in k (if speed k works, every faster speed works too) and you want the minimum feasible value. Whenever you see "minimum X such that condition holds" with a monotonic condition, binary search the value space and write a feasibility checker. Time is O(n log M) where M = max pile — closest enum here is O(n log n).',
      edgeCases: [
        {
          description: 'h equals the number of piles (must eat the largest pile in one hour → k = max)',
          matchers: ['h == n', 'h = n', 'h == piles.length', 'h = piles.length', 'h equals', 'one hour per pile', 'one pile per hour', 'exactly n hours', 'k = max', 'k == max', 'max pile', 'largest pile', 'biggest pile', 'upper bound', 'tightest'],
        },
        {
          description: 'Single pile',
          matchers: [...SINGLE_ELEMENT, 'one pile', 'single pile', '1 pile', 'only one pile'],
        },
        {
          description: 'Huge pile values (10^9) — integer overflow / ceiling division',
          matchers: ['overflow', '10^9', '1e9', 'large', 'huge', 'big number', 'ceil', 'ceiling', 'round up', 'integer division', '(pile + k - 1) / k', 'long', '64-bit', 'sum overflow'],
          explanation: 'Σ ceil(pile / k) with k = 1 can reach 10^13, overflowing a 32-bit int.',
        },
        {
          description: 'Lower bound k = 1 (h is huge, Koko can eat as slowly as possible)',
          matchers: ['k = 1', 'k == 1', 'k=1', 'lower bound', 'minimum speed', 'slowest', 'h is huge', 'h very large', 'h = 10^9', 'lots of time', 'plenty of time', 'lo = 1', 'start at 1', 'start from 1', 'answer is 1'],
        },
      ],
    },
  },
];
