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
  [Complexity.O_SQRT_N]: 'O(\u221An)',
  [Complexity.O_N]: 'O(n)',
  [Complexity.O_N_LOG_N]: 'O(n log n)',
  [Complexity.O_N_SQUARED]: 'O(n\u00B2)',
  [Complexity.O_N_CUBED]: 'O(n\u00B3)',
  [Complexity.O_2_POW_N]: 'O(2\u207F)',
  [Complexity.O_N_FACTORIAL]: 'O(n!)',
  [Complexity.O_N_TIMES_M]: 'O(n \u00B7 m)',
};

// ---------------------------------------------------------------------------
// Request DTOs
// ---------------------------------------------------------------------------

export interface SubmitAttemptInput {
  userId: string;
  problemId: string;
  selectedDataStructures: DataStructure[];
  selectedTechniques: AlgorithmicTechnique[];
  selectedTimeComplexity: Complexity;
  selectedSpaceComplexity: Complexity;
  /** EdgeCase row IDs the user checked, including any decoys. */
  selectedEdgeCaseIds: string[];
  durationMs?: number;
}

// ---------------------------------------------------------------------------
// Grading result types
// ---------------------------------------------------------------------------

export interface SetComparison<T extends string> {
  isCorrect: boolean;
  selected: T[];
  expected: T[];
  /** Selected ∩ expected. */
  matched: T[];
  /** Expected \ selected — the user failed to recall these. */
  missing: T[];
  /** Selected \ expected — the user over-applied these. */
  extra: T[];
  /** |intersection| / |union|, 1 when both sets are empty. */
  jaccard: number;
}

export type ComplexityDirection =
  | 'EXACT'
  | 'OVERESTIMATE'
  | 'UNDERESTIMATE'
  | 'INCOMPARABLE';

export interface ComplexityComparison {
  isCorrect: boolean;
  selected: Complexity;
  expected: Complexity;
  selectedLabel: string;
  expectedLabel: string;
  direction: ComplexityDirection;
}

export interface GradedAttempt {
  dataStructures: SetComparison<DataStructure>;
  techniques: SetComparison<AlgorithmicTechnique>;
  timeComplexity: ComplexityComparison;
  spaceComplexity: ComplexityComparison;
  edgeCases: SetComparison<string>;
  isFullyCorrect: boolean;
  /** Weighted partial credit in [0, 1]. */
  score: number;
}

/** Ground truth pulled from the DB, decoupled from the Prisma row shape. */
export interface ProblemAnswerKey {
  id: string;
  title: string;
  difficulty: Difficulty;
  correctDataStructures: DataStructure[];
  correctTechniques: AlgorithmicTechnique[];
  optimalTimeComplexity: Complexity;
  optimalSpaceComplexity: Complexity;
  optimalApproachSummary: string;
  requiredEdgeCaseIds: string[];
  edgeCaseDescriptions: Record<string, string>;
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
// API response
// ---------------------------------------------------------------------------

export interface SubmitAttemptResponse {
  attemptId: string;
  problemId: string;
  breakdown: {
    dataStructures: SetComparison<DataStructure>;
    techniques: SetComparison<AlgorithmicTechnique>;
    timeComplexity: ComplexityComparison;
    spaceComplexity: ComplexityComparison;
    edgeCases: SetComparison<string> & { descriptions: Record<string, string> };
  };
  isFullyCorrect: boolean;
  score: number;
  stats: UserAccuracyStats;
  /** Null if the LLM call failed or is disabled; the client should degrade. */
  feedback: string | null;
}
