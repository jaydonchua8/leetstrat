import {
  AlgorithmicTechnique,
  CategoryKind,
  Complexity,
  DataStructure,
  Difficulty,
} from '@prisma/client';

// Re-export the generated enums so application code never imports @prisma/client
// directly for domain vocabulary. Defining these a second time by hand would
// only create a drift surface between the DB and the type layer.
export {
  AlgorithmicTechnique,
  CategoryKind,
  Complexity,
  DataStructure,
  Difficulty,
};

export const ALL_DATA_STRUCTURES = Object.values(DataStructure);
export const ALL_TECHNIQUES = Object.values(AlgorithmicTechnique);
export const ALL_COMPLEXITIES = Object.values(Complexity);

/**
 * Monotonic ordering used to tell an over-estimate from an under-estimate.
 * O_N_TIMES_M is deliberately unranked (null): it is incomparable to the
 * single-variable classes without knowing the relationship between n and m.
 */
export const COMPLEXITY_RANK: Record<Complexity, number | null> = {
  [Complexity.O_1]: 0,
  [Complexity.O_LOG_N]: 1,
  [Complexity.O_SQRT_N]: 2,
  [Complexity.O_N]: 3,
  [Complexity.O_N_LOG_N]: 4,
  [Complexity.O_N_SQUARED]: 5,
  [Complexity.O_N_CUBED]: 6,
  [Complexity.O_2_POW_N]: 7,
  [Complexity.O_N_FACTORIAL]: 8,
  [Complexity.O_N_TIMES_M]: null,
};

/** Human-readable labels for API responses and LLM prompts. */
export const COMPLEXITY_LABEL: Record<Complexity, string> = {
  [Complexity.O_1]: 'O(1)',
  [Complexity.O_LOG_N]: 'O(log n)',
  [Complexity.O_SQRT_N]: 'O(√n)',
  [Complexity.O_N]: 'O(n)',
  [Complexity.O_N_LOG_N]: 'O(n log n)',
  [Complexity.O_N_SQUARED]: 'O(n²)',
  [Complexity.O_N_CUBED]: 'O(n³)',
  [Complexity.O_2_POW_N]: 'O(2ⁿ)',
  [Complexity.O_N_FACTORIAL]: 'O(n!)',
  [Complexity.O_N_TIMES_M]: 'O(n · m)',
};

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface SubmitAttemptInput {
  userId: string;
  problemId: string;
  selectedDataStructure: DataStructure;
  selectedTechnique: AlgorithmicTechnique;
  selectedTimeComplexity: Complexity;
  selectedSpaceComplexity: Complexity;
  /** Free text: the edge cases the learner says they would watch for. */
  edgeCasesText: string;
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Answer key — ground truth pulled from the DB, decoupled from the Prisma row
// ---------------------------------------------------------------------------

export interface EdgeCaseKey {
  id: string;
  description: string;
  /** Lowercase phrases; any substring hit in the learner's text counts. */
  matchers: string[];
  explanation: string | null;
}

export interface ProblemAnswerKey {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
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
  edgeCases: EdgeCaseKey[];
}

// ---------------------------------------------------------------------------
// Grading result types
// ---------------------------------------------------------------------------

/**
 * One categorical pick graded against a primary answer plus accepted
 * alternatives. `primary` is always a member of `accepted`.
 */
export interface ChoiceComparison<T extends string> {
  isCorrect: boolean;
  selected: T;
  primary: T;
  accepted: T[];
  /** Correct, but via an alternative rather than the canonical answer. */
  isAlternative: boolean;
}

export type ComplexityDirection =
  | 'EXACT'
  | 'OVERESTIMATE'
  | 'UNDERESTIMATE'
  | 'INCOMPARABLE';

export interface ComplexityComparison extends ChoiceComparison<Complexity> {
  selectedLabel: string;
  primaryLabel: string;
  /** Selected relative to primary; EXACT only when selected === primary. */
  direction: ComplexityDirection;
}

export interface EdgeCaseMatch {
  id: string;
  description: string;
  matched: boolean;
  /** The matcher phrase that hit, for transparency in the UI. */
  matchedOn: string | null;
  explanation: string | null;
}

export interface EdgeCaseComparison {
  /** Every reference edge case was mentioned. */
  isCorrect: boolean;
  text: string;
  matches: EdgeCaseMatch[];
  matchedCount: number;
  total: number;
  /** matchedCount / total, 1 when there are no reference edge cases. */
  recall: number;
}

export interface GradedAttempt {
  dataStructure: ChoiceComparison<DataStructure>;
  technique: ChoiceComparison<AlgorithmicTechnique>;
  timeComplexity: ComplexityComparison;
  spaceComplexity: ComplexityComparison;
  edgeCases: EdgeCaseComparison;
  isFullyCorrect: boolean;
  /** Weighted partial credit in [0, 1]. */
  score: number;
}

/** Why a codex entry is being surfaced on a result screen. */
export type CodexLinkReason = 'INTENDED' | 'OVER_APPLIED';

export interface CodexRef {
  kind: CategoryKind;
  key: string;
  slug: string;
  reason: CodexLinkReason;
}

/** A CodexRef resolved against the codex table. */
export interface CodexLink extends CodexRef {
  title: string;
}

// ---------------------------------------------------------------------------
// Analytics types
// ---------------------------------------------------------------------------

/** One (tag, outcome) pair derived from a graded attempt. */
export interface TagOutcome {
  kind: CategoryKind;
  key: string;
  wasCorrect: boolean;
}

export type MasteryLevel = 'UNSEEN' | 'WEAK' | 'DEVELOPING' | 'STRONG';

export interface CategoryAccuracy {
  kind: CategoryKind;
  key: string;
  timesSeen: number;
  timesCorrect: number;
  /** timesCorrect / timesSeen, in [0, 1]. */
  accuracy: number;
  mastery: MasteryLevel;
}

export interface UserAccuracyStats {
  totalAttempts: number;
  totalFullyCorrect: number;
  /** totalFullyCorrect / totalAttempts, in [0, 1]. */
  overallAccuracy: number;
  /** Lowest-accuracy tags with enough samples to be meaningful. */
  weakestCategories: CategoryAccuracy[];
  strongestCategories: CategoryAccuracy[];
  /** Only the tags touched by this specific attempt. */
  touchedCategories: CategoryAccuracy[];
}

// ---------------------------------------------------------------------------
// API responses
// ---------------------------------------------------------------------------

/** Statement only — never carries the reference answer. */
export interface ProblemSummary {
  id: string;
  slug: string;
  title: string;
  difficulty: Difficulty;
  leetcodeId: number | null;
}

export interface ProblemDetail extends ProblemSummary {
  description: string;
  sourceUrl: string | null;
}

export interface CodexEntrySummary {
  id: string;
  slug: string;
  kind: CategoryKind;
  key: string;
  title: string;
}

export interface CodexEntryDetail extends CodexEntrySummary {
  summary: string;
  signals: string[];
}

/** The scored result, returned by both submit and GET /attempts/:id. */
export interface AttemptResult {
  attemptId: string;
  problem: ProblemSummary;
  breakdown: GradedAttempt;
  isFullyCorrect: boolean;
  score: number;
  /** What to do and why it is the intended approach. */
  reference: { approachSummary: string; explanation: string };
  /** Codex entries for the intended answer and anything over-applied. */
  codexLinks: CodexLink[];
  /** Null if the LLM call failed or is disabled; the client should degrade. */
  feedback: string | null;
  createdAt: string;
}

export interface SubmitAttemptResponse extends AttemptResult {
  stats: UserAccuracyStats;
}
