import {
  AlgorithmicTechnique,
  CategoryKind,
  Complexity,
  COMPLEXITY_LABEL,
  COMPLEXITY_RANK,
  ComplexityComparison,
  DataStructure,
  GradedAttempt,
  ProblemAnswerKey,
  SetComparison,
  SubmitAttemptInput,
  TagOutcome,
} from '../types';

/**
 * Partial-credit weights. Techniques are weighted highest because naming the
 * technique is the actual skill the app trains; complexity often follows from
 * it. Must sum to 1.
 */
export const GRADING_WEIGHTS = {
  dataStructures: 0.25,
  techniques: 0.3,
  timeComplexity: 0.2,
  spaceComplexity: 0.15,
  edgeCases: 0.1,
} as const;

/**
 * Exact-set comparison with per-element diffs. Input is de-duplicated so a
 * client sending the same tag twice can't skew the Jaccard score.
 */
export function compareSets<T extends string>(
  selected: T[],
  expected: T[],
): SetComparison<T> {
  const selectedSet = new Set(selected);
  const expectedSet = new Set(expected);

  const matched = [...selectedSet].filter((v) => expectedSet.has(v));
  const missing = [...expectedSet].filter((v) => !selectedSet.has(v));
  const extra = [...selectedSet].filter((v) => !expectedSet.has(v));

  const unionSize = new Set([...selectedSet, ...expectedSet]).size;

  return {
    // Exact match: nothing missing and nothing extra.
    isCorrect: missing.length === 0 && extra.length === 0,
    selected: [...selectedSet],
    expected: [...expectedSet],
    matched,
    missing,
    extra,
    jaccard: unionSize === 0 ? 1 : matched.length / unionSize,
  };
}

/**
 * Complexity is graded on exact match, but we report the direction of the miss
 * so the UI can say "you were too pessimistic" rather than just "wrong".
 */
export function compareComplexity(
  selected: Complexity,
  expected: Complexity,
): ComplexityComparison {
  const selectedRank = COMPLEXITY_RANK[selected];
  const expectedRank = COMPLEXITY_RANK[expected];

  let direction: ComplexityComparison['direction'];
  if (selected === expected) {
    direction = 'EXACT';
  } else if (selectedRank === null || expectedRank === null) {
    direction = 'INCOMPARABLE';
  } else {
    direction = selectedRank > expectedRank ? 'OVERESTIMATE' : 'UNDERESTIMATE';
  }

  return {
    isCorrect: selected === expected,
    selected,
    expected,
    selectedLabel: COMPLEXITY_LABEL[selected],
    expectedLabel: COMPLEXITY_LABEL[expected],
    direction,
  };
}

/**
 * Pure grading. No I/O, no side effects — call this from tests directly with a
 * hand-built answer key.
 */
export function gradeAttempt(
  input: SubmitAttemptInput,
  key: ProblemAnswerKey,
): GradedAttempt {
  const dataStructures = compareSets<DataStructure>(
    input.selectedDataStructures,
    key.correctDataStructures,
  );
  const techniques = compareSets<AlgorithmicTechnique>(
    input.selectedTechniques,
    key.correctTechniques,
  );
  const timeComplexity = compareComplexity(
    input.selectedTimeComplexity,
    key.optimalTimeComplexity,
  );
  const spaceComplexity = compareComplexity(
    input.selectedSpaceComplexity,
    key.optimalSpaceComplexity,
  );
  const edgeCases = compareSets<string>(
    input.selectedEdgeCaseIds,
    key.requiredEdgeCaseIds,
  );

  // Set categories contribute their Jaccard overlap; booleans contribute 1 or 0.
  const score =
    dataStructures.jaccard * GRADING_WEIGHTS.dataStructures +
    techniques.jaccard * GRADING_WEIGHTS.techniques +
    (timeComplexity.isCorrect ? 1 : 0) * GRADING_WEIGHTS.timeComplexity +
    (spaceComplexity.isCorrect ? 1 : 0) * GRADING_WEIGHTS.spaceComplexity +
    edgeCases.jaccard * GRADING_WEIGHTS.edgeCases;

  const isFullyCorrect =
    dataStructures.isCorrect &&
    techniques.isCorrect &&
    timeComplexity.isCorrect &&
    spaceComplexity.isCorrect &&
    edgeCases.isCorrect;

  return {
    dataStructures,
    techniques,
    timeComplexity,
    spaceComplexity,
    edgeCases,
    isFullyCorrect,
    score: Number(score.toFixed(4)),
  };
}

/**
 * Projects a graded attempt onto per-tag outcomes.
 *
 * - matched -> seen + correct (user recalled it)
 * - missing -> seen + incorrect (user failed to recall it)
 * - extra   -> seen + incorrect (user over-applies it)
 *
 * Counting `extra` is what surfaces the "reaches for DP on everything" pattern,
 * which a purely recall-based metric would never catch.
 */
export function buildTagOutcomes(graded: GradedAttempt): TagOutcome[] {
  const outcomes: TagOutcome[] = [];

  const push = (kind: CategoryKind, keys: string[], wasCorrect: boolean) => {
    for (const key of keys) outcomes.push({ kind, key, wasCorrect });
  };

  push(CategoryKind.DATA_STRUCTURE, graded.dataStructures.matched, true);
  push(CategoryKind.DATA_STRUCTURE, graded.dataStructures.missing, false);
  push(CategoryKind.DATA_STRUCTURE, graded.dataStructures.extra, false);

  push(CategoryKind.TECHNIQUE, graded.techniques.matched, true);
  push(CategoryKind.TECHNIQUE, graded.techniques.missing, false);
  push(CategoryKind.TECHNIQUE, graded.techniques.extra, false);

  return outcomes;
}
