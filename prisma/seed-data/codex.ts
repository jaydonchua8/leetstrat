import { AlgorithmicTechnique, DataStructure } from '@prisma/client';

export interface CodexSeed {
  title: string;
  summary: string;
  /** "Reach for this when you see..." cues. */
  signals: string[];
}

/**
 * One entry per enum member so a result screen can always link a miss —
 * including whatever the learner wrongly reached for.
 */
export const techniques: Record<AlgorithmicTechnique, CodexSeed> = {
  TWO_POINTERS: {
    title: 'Two Pointers',
    summary:
      'Walk two indices through a sequence — usually from opposite ends or at different speeds — so that each step provably discards a candidate. Turns an O(n²) pair search into O(n) when the data has an ordering you can exploit.',
    signals: [
      'The input is sorted, or you are allowed to sort it',
      'You need a pair (or triple) of elements satisfying a condition',
      'You are asked for O(1) extra space, ruling out a hash map',
      'Moving one end changes the answer monotonically (sum grows, width shrinks)',
      'Partitioning or de-duplicating an array in place',
    ],
  },
  SLIDING_WINDOW: {
    title: 'Sliding Window',
    summary:
      'Maintain a contiguous range [left, right] and move the edges so that every element enters and leaves at most once. Fixed-size windows slide; variable-size windows grow until a constraint breaks, then shrink until it holds again.',
    signals: [
      'The word "substring", "subarray", or "contiguous"',
      '"Longest", "shortest", or "maximum sum" over a contiguous range',
      'A constraint that becomes true/false as you add or remove one element (distinct count, sum, character counts)',
      'A follow-up asking for O(n) on a problem you first solved in O(n²)',
    ],
  },
  BINARY_SEARCH: {
    title: 'Binary Search',
    summary:
      'Halve the search space each step by testing the middle. Works on any monotonic predicate, not just sorted arrays: if "is k feasible?" is false-false-true-true, you can binary search for the boundary.',
    signals: [
      'The input is sorted (or rotated-sorted)',
      'The statement demands O(log n)',
      '"Minimum value such that…" or "maximum value such that…" with a condition that stays true once it becomes true',
      'You can write a cheap yes/no check for a candidate answer',
    ],
  },
  DFS: {
    title: 'Depth-First Search',
    summary:
      'Go as deep as you can along one branch before backing up. Natural fit for exhaustive exploration, connected components, and anything where the answer for a node is built from the answers of its children.',
    signals: [
      'Counting or labelling connected regions in a grid or graph',
      'Trees where a node\'s answer depends on its subtrees (height, sum, validity)',
      '"Does a path exist?" without caring which path is shortest',
      'Cycle detection, topological ordering, or exploring all configurations',
    ],
  },
  BFS: {
    title: 'Breadth-First Search',
    summary:
      'Explore in expanding rings using a queue so nodes are visited in order of distance from the start. The first time you reach a node is via a shortest path — as long as every edge costs the same.',
    signals: [
      '"Minimum number of steps / moves / minutes"',
      '"Level by level" or "by depth"',
      'Multiple starting points spreading simultaneously (multi-source)',
      'Shortest path where every edge has equal weight',
      'You would otherwise recurse very deep and risk a stack overflow',
    ],
  },
  TOPOLOGICAL_SORT: {
    title: 'Topological Sort',
    summary:
      'Order the nodes of a directed acyclic graph so every edge points forward. Kahn\'s algorithm repeatedly removes nodes with zero in-degree; if you cannot remove them all, there is a cycle.',
    signals: [
      'Prerequisites, dependencies, or "task A must finish before task B"',
      '"Is it possible to finish all…" on a directed graph',
      'You need a valid ordering, or to detect that none exists',
    ],
  },
  BACKTRACKING: {
    title: 'Backtracking',
    summary:
      'Build a candidate one choice at a time, recurse, and undo the choice on the way back. Prune branches as soon as they cannot lead to a valid answer. Exponential by nature — reach for it when the constraints are tiny.',
    signals: [
      '"All combinations", "all permutations", "all subsets", "all valid…"',
      'n is small (≤ ~20) so an exponential search is acceptable',
      'Constraint satisfaction: N-Queens, Sudoku, word search',
      'You must enumerate every solution, not just count or optimise',
    ],
  },
  DYNAMIC_PROGRAMMING: {
    title: 'Dynamic Programming',
    summary:
      'Solve a problem by combining solutions to smaller instances of the same problem, storing each sub-result once. Bottom-up fills a table in dependency order; top-down is recursion plus a memo. Identify the state, the transition, and the base case.',
    signals: [
      '"Number of ways", "minimum cost", "maximum value", "longest / shortest subsequence"',
      'Choices that reduce to a strictly smaller version of the same problem',
      'A greedy approach that feels right but fails on a small counter-example',
      'Naive recursion recomputes the same sub-problems (overlapping sub-problems)',
      'Constraints like n ≤ 1000 or n·m ≤ 10^6 that allow a table',
    ],
  },
  GREEDY: {
    title: 'Greedy',
    summary:
      'Make the locally best choice at each step and never revisit it. Only correct when you can argue an exchange property: any optimal solution can be transformed into the greedy one without getting worse. If you cannot make that argument, it is probably DP.',
    signals: [
      'Interval scheduling, "maximum number of non-overlapping…"',
      'Sorting the input makes the right choice obvious at each step',
      'Jump / reach problems where you always extend the furthest frontier',
      'A proof sketch that a local choice never hurts the global answer',
    ],
  },
  DIVIDE_AND_CONQUER: {
    title: 'Divide and Conquer',
    summary:
      'Split the input into independent halves, solve each recursively, and merge. Merge sort, quickselect, and the counting-inversions trick are the canonical forms. Differs from DP in that the halves do not overlap.',
    signals: [
      'The problem on the whole input can be built from the problem on two halves plus a merge step',
      'Counting pairs across a split (inversions, "count of smaller after self")',
      'Finding the k-th element without fully sorting',
    ],
  },
  RECURSION: {
    title: 'Recursion',
    summary:
      'Define the answer for an input in terms of the answer for a smaller input. On its own it is a tool, not a strategy: pair it with memoization, backtracking, or divide and conquer, or use it directly on naturally recursive structures like trees and linked lists.',
    signals: [
      'Trees, nested structures, or linked lists',
      'The problem statement is itself recursive ("a valid expression contains valid expressions")',
      'Small depth, so the call stack is not a concern',
    ],
  },
  SORTING: {
    title: 'Sorting',
    summary:
      'Order the input first so that structure becomes visible: duplicates become adjacent, ranges become contiguous, and two pointers or binary search become available. Costs O(n log n) up front, which is often the whole budget.',
    signals: [
      'You need pairs, duplicates, or ranges and the input is unordered',
      'Intervals: sort by start (or end) before merging or scheduling',
      'The allowed complexity is O(n log n) and no obvious O(n) trick exists',
      'Custom comparison, e.g. sorting strings to form the largest number',
    ],
  },
  PREFIX_SUM: {
    title: 'Prefix Sum',
    summary:
      'Precompute cumulative sums so any range sum is one subtraction. Combine with a hash map of prefix values to count subarrays with a given sum in O(n).',
    signals: [
      'Many range-sum queries on an array that does not change',
      '"Number of subarrays with sum equal to k"',
      '2D grids with rectangle-sum queries',
      'A running total where you need "sum from i to j" repeatedly',
    ],
  },
  MONOTONIC_STACK: {
    title: 'Monotonic Stack',
    summary:
      'A stack kept in sorted order by popping anything that would break the order before pushing. Each pop resolves a "next greater / next smaller" question for the popped element in amortised O(1).',
    signals: [
      '"Next greater element", "next smaller element", "previous warmer day"',
      'Largest rectangle in a histogram, trapping rain water',
      'For each element, find the nearest element to the left/right satisfying a comparison',
    ],
  },
  FAST_SLOW_POINTERS: {
    title: 'Fast & Slow Pointers',
    summary:
      'Two pointers moving through a linked structure at different speeds. If there is a cycle they meet; if there is not, the slow pointer ends at the middle when the fast one hits the end.',
    signals: [
      'Linked list cycle detection or finding where the cycle starts',
      'Middle of a linked list in one pass without knowing its length',
      'Sequences defined by "apply f repeatedly" (happy number, duplicate number as a functional graph)',
    ],
  },
  INTERVALS: {
    title: 'Intervals',
    summary:
      'Problems on [start, end] ranges. Almost always: sort by start, then sweep, merging or counting overlaps as you go. A min-heap on end times handles "how many overlap at once".',
    signals: [
      'Input is a list of [start, end] pairs',
      '"Merge", "insert", "overlap", "minimum rooms", "can attend all meetings"',
      'Timeline or scheduling language',
    ],
  },
  MEMOIZATION: {
    title: 'Memoization',
    summary:
      'Top-down dynamic programming: write the natural recursion, then cache results keyed by the arguments so each sub-problem is computed once. Easier to derive than a bottom-up table; same complexity, more stack usage.',
    signals: [
      'You can write the recursive solution but it times out',
      'The same (arguments) are hit many times in the recursion tree',
      'The state space is sparse, so filling a full table would waste work',
    ],
  },
  SIMULATION: {
    title: 'Simulation',
    summary:
      'Do exactly what the statement says, step by step, with no algorithmic shortcut. The skill is in clean bookkeeping and choosing data structures that make each step cheap. Correct when the constraints are small enough that the literal process fits the time budget.',
    signals: [
      'The statement describes a process ("each minute…", "rotate…", "spiral order")',
      'Constraints are small and no pattern above obviously applies',
      'Matrix traversal, game-of-life style updates, robot movement',
    ],
  },
};

export const dataStructures: Record<DataStructure, CodexSeed> = {
  ARRAY: {
    title: 'Array',
    summary:
      'Contiguous, index-addressable storage. O(1) random access, O(n) insert/delete in the middle. Almost every other pattern — two pointers, sliding window, binary search, DP tables — lives on top of one.',
    signals: [
      'The input is already an array and you can answer by indexing into it',
      'You need a DP table indexed by position or amount',
      'A fixed, small alphabet (26 letters, 128 ASCII) can replace a hash map',
    ],
  },
  STRING: {
    title: 'String',
    summary:
      'An immutable (in most languages) array of characters. Treat it as an array for indexing; convert to a mutable builder when you need to edit it repeatedly.',
    signals: [
      'The problem is about characters, substrings, or palindromes',
      'You will index by position or compare slices',
    ],
  },
  HASH_MAP: {
    title: 'Hash Map',
    summary:
      'Key → value lookup in expected O(1). The go-to for counting, grouping, memoization, and "have I seen this before, and where?". Costs O(n) space.',
    signals: [
      'Counting frequencies of anything',
      '"Find the complement / pair that sums to target" on unsorted data',
      'Grouping by a computed key (anagrams, remainders)',
      'Caching results keyed by arbitrary arguments',
    ],
  },
  HASH_SET: {
    title: 'Hash Set',
    summary:
      'A hash map without values: O(1) membership tests and de-duplication. Use it when you only need to know whether something is present, not how many or where.',
    signals: [
      '"Contains duplicate", "distinct", "unique"',
      'Tracking visited nodes or cells',
      'The characters currently inside a sliding window',
    ],
  },
  LINKED_LIST: {
    title: 'Linked List',
    summary:
      'Nodes joined by pointers. O(1) insertion and deletion at a known node, O(n) to find anything. Most linked-list problems are pointer-rewiring exercises; a dummy head node removes edge cases.',
    signals: [
      'The input is given as a ListNode',
      'Reversal, merging, cycle detection, removing the n-th from the end',
      'You need O(1) splice operations (LRU cache)',
    ],
  },
  STACK: {
    title: 'Stack',
    summary:
      'Last-in, first-out. Models nesting, matching, and "most recent unresolved thing". Also the explicit replacement for recursion when the depth would overflow the call stack.',
    signals: [
      'Matching brackets or tags',
      'Evaluating expressions, undo operations, path simplification',
      'Iterative DFS or tree traversal',
      'Next-greater-element style questions (see Monotonic Stack)',
    ],
  },
  QUEUE: {
    title: 'Queue',
    summary:
      'First-in, first-out. The engine behind BFS: whatever was discovered first is expanded first, which is exactly what makes BFS find shortest paths.',
    signals: [
      'Breadth-first traversal of a tree, graph, or grid',
      'Level-order processing',
      'Anything that spreads outward in rounds (rotting oranges, word ladder)',
    ],
  },
  DEQUE: {
    title: 'Deque',
    summary:
      'Double-ended queue with O(1) push/pop on both ends. Powers the sliding-window maximum trick: keep indices in decreasing order of value so the front is always the current max.',
    signals: [
      '"Maximum / minimum in every window of size k"',
      '0-1 BFS (edges of weight 0 go to the front, weight 1 to the back)',
      'You need both stack and queue behaviour at once',
    ],
  },
  HEAP: {
    title: 'Heap / Priority Queue',
    summary:
      'Gives the minimum (or maximum) element in O(log n) per insert/remove. Reach for it when you repeatedly need "the smallest thing right now" out of a changing set — not when you just need one sort.',
    signals: [
      '"K largest / smallest / most frequent"',
      'Merging k sorted lists',
      'Dijkstra, scheduling by earliest end time, running median',
      'You would otherwise re-sort after every change',
    ],
  },
  BINARY_TREE: {
    title: 'Binary Tree',
    summary:
      'Each node has up to two children. Almost every problem is a traversal (pre/in/post-order or level-order) plus a small amount of work per node, usually expressed recursively.',
    signals: [
      'The input is a TreeNode root',
      '"Depth", "diameter", "path sum", "symmetric", "invert"',
      'Level-by-level output (BFS) or subtree-derived answers (DFS)',
    ],
  },
  BINARY_SEARCH_TREE: {
    title: 'Binary Search Tree',
    summary:
      'A binary tree where left < node < right. In-order traversal yields sorted order; that single fact solves most BST questions (k-th smallest, validate, two-sum in BST).',
    signals: [
      'The statement says the tree is a BST',
      '"k-th smallest", "validate", "lowest common ancestor" with ordered values',
      'You can prune a whole subtree by comparing with the node value',
    ],
  },
  TRIE: {
    title: 'Trie',
    summary:
      'A prefix tree: each node is one character, each root-to-node path is a prefix. O(L) insert and lookup for a word of length L regardless of dictionary size.',
    signals: [
      '"Prefix", "starts with", "autocomplete"',
      'A dictionary of words queried many times',
      'Word search on a board with many words to find at once',
    ],
  },
  GRAPH: {
    title: 'Graph',
    summary:
      'Nodes and edges. Build an adjacency list first, then apply BFS, DFS, topological sort, union-find, or Dijkstra depending on the question. Grids are graphs too — cells are nodes, neighbours are edges.',
    signals: [
      'Input is an edge list or adjacency structure',
      '"Connected", "reachable", "path", "cycle", "components"',
      'Relationships between entities (courses, cities, friends)',
      'A grid where movement between cells matters',
    ],
  },
  MATRIX: {
    title: 'Matrix / Grid',
    summary:
      'A 2D array. Treat it as a graph with 4- or 8-directional adjacency for traversal problems, as a 2D DP table for path-counting problems, or index it directly for simulation.',
    signals: [
      'Input is grid[m][n]',
      'Islands, flood fill, shortest path through cells',
      '"Number of paths from top-left to bottom-right"',
      'Rotation, spiral order, transposition',
    ],
  },
  UNION_FIND: {
    title: 'Union-Find (Disjoint Set)',
    summary:
      'Tracks which elements are in the same group with near-O(1) union and find operations. Better than DFS when edges arrive over time or you need to answer connectivity queries repeatedly.',
    signals: [
      '"Are these two connected?" asked many times',
      'Edges added incrementally (dynamic connectivity)',
      'Counting components while processing a stream of unions',
      'Detecting the redundant edge that creates a cycle',
    ],
  },
  SEGMENT_TREE: {
    title: 'Segment Tree',
    summary:
      'A tree over array ranges supporting O(log n) range queries (sum, min, max) and O(log n) point updates. Overkill unless the array changes between queries.',
    signals: [
      'Range queries AND updates interleaved',
      'Prefix sums would need O(n) rebuilds after each change',
    ],
  },
  FENWICK_TREE: {
    title: 'Fenwick Tree (Binary Indexed Tree)',
    summary:
      'A compact structure for prefix sums with O(log n) updates and queries. Less flexible than a segment tree but far shorter to write.',
    signals: [
      'Prefix-sum queries with point updates',
      'Counting inversions or "smaller elements to the right" in O(n log n)',
    ],
  },
  BIT_MANIPULATION: {
    title: 'Bit Manipulation',
    summary:
      'Treat integers as arrays of bits. XOR cancels pairs, AND/shift isolate bits, and a bitmask can represent a subset in one integer.',
    signals: [
      '"Single number" among pairs, "missing number"',
      'Subsets of a small set (n ≤ 20) as bitmasks',
      'Power of two checks, counting set bits',
      'O(1) space demanded where a set seems necessary',
    ],
  },
};
