import {
  AlgorithmicTechnique,
  CategoryKind,
  ChoiceComparison,
  CodexRef,
  Complexity,
  COMPLEXITY_LABEL,
  COMPLEXITY_RANK,
  ComplexityComparison,
  DataStructure,
  EdgeCaseComparison,
  EdgeCaseKey,
  GradedAttempt,
  ProblemAnswerKey,
  SubmitAttemptInput,
  TagOutcome,
} from '../types';

/**
 * Partial-credit weights. Techniques are weighted highest because naming the
 * technique is the actual skill the app trains; complexity often follows from
 * it. Edge cases are lowest because free-text matching is the least reliable
 * signal (see NOTES.md). Must sum to 1.
 */
export const GRADING_WEIGHTS = {
  dataStructure: 0.25,
  technique: 0.3,
  timeComplexity: 0.2,
  spaceComplexity: 0.15,
  edgeCases: 0.1,
} as const;

/**
 * Grades one categorical pick. Correct if it is the primary answer or any
 * accepted alternative; `primary` is always treated as accepted even if the
 * key's `accepted` list forgot to include it.
 */
export function compareChoice<T extends string>(
  selected: T,
  primary: T,
  accepted: T[],
): ChoiceComparison<T> {
  const acceptedSet = new Set<T>([primary, ...accepted]);
  const isCorrect = acceptedSet.has(selected);
  return {
    isCorrect,
    selected,
    primary,
    accepted: [...acceptedSet],
    isAlternative: isCorrect && selected !== primary,
  };
}

/**
 * Complexity is graded like any other choice, but we also report the
 * direction relative to the primary answer so the UI can say "you were too
 * pessimistic" rather than just "wrong".
 */
export function compareComplexity(
  selected: Complexity,
  primary: Complexity,
  accepted: Complexity[] = [],
): ComplexityComparison {
  const choice = compareChoice(selected, primary, accepted);
  const selectedRank = COMPLEXITY_RANK[selected];
  const primaryRank = COMPLEXITY_RANK[primary];

  let direction: ComplexityComparison['direction'];
  if (selected === primary) {
    direction = 'EXACT';
  } else if (selectedRank === null || primaryRank === null) {
    direction = 'INCOMPARABLE';
  } else {
    direction = selectedRank > primaryRank ? 'OVERESTIMATE' : 'UNDERESTIMATE';
  }

  return {
    ...choice,
    selectedLabel: COMPLEXITY_LABEL[selected],
    primaryLabel: COMPLEXITY_LABEL[primary],
    direction,
  };
}

/**
 * Lowercases, strips punctuation (keeping comparison operators so "n == 0"
 * survives), and collapses whitespace. Applied to both the learner's text and
 * every matcher so the two sides are compared in the same form.
 */
export function normalizeEdgeCaseText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9=<>!\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Free-text edge case matching. An edge case is "mentioned" if any of its
 * matcher phrases appears as a substring of the normalized text. Substring
 * (not word-boundary) on purpose: "duplicate" should catch "duplicates".
 * Only recall is measured — we cannot tell what an unrecognised sentence
 * was about, so extra text is never penalised.
 */
export function matchEdgeCases(
  text: string,
  edgeCases: EdgeCaseKey[],
): EdgeCaseComparison {
  const normalized = normalizeEdgeCaseText(text);

  const matches = edgeCases.map((ec) => {
    const hit =
      normalized.length === 0
        ? undefined
        : ec.matchers
            .map(normalizeEdgeCaseText)
            .find((m) => m.length > 0 && normalized.includes(m));
    return {
      id: ec.id,
      description: ec.description,
      matched: hit !== undefined,
      matchedOn: hit ?? null,
      explanation: ec.explanation,
    };
  });

  const matchedCount = matches.filter((m) => m.matched).length;
  const total = edgeCases.length;

  return {
    isCorrect: matchedCount === total,
    text,
    matches,
    matchedCount,
    total,
    recall: total === 0 ? 1 : matchedCount / total,
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
  const dataStructure = compareChoice<DataStructure>(
    input.selectedDataStructure,
    key.primaryDataStructure,
    key.acceptedDataStructures,
  );
  const technique = compareChoice<AlgorithmicTechnique>(
    input.selectedTechnique,
    key.primaryTechnique,
    key.acceptedTechniques,
  );
  const timeComplexity = compareComplexity(
    input.selectedTimeComplexity,
    key.primaryTimeComplexity,
    key.acceptedTimeComplexities,
  );
  const spaceComplexity = compareComplexity(
    input.selectedSpaceComplexity,
    key.primarySpaceComplexity,
    key.acceptedSpaceComplexities,
  );
  const edgeCases = matchEdgeCases(input.edgeCasesText, key.edgeCases);

  // Categorical fields contribute 1 or 0; edge cases contribute their recall.
  const score =
    (dataStructure.isCorrect ? 1 : 0) * GRADING_WEIGHTS.dataStructure +
    (technique.isCorrect ? 1 : 0) * GRADING_WEIGHTS.technique +
    (timeComplexity.isCorrect ? 1 : 0) * GRADING_WEIGHTS.timeComplexity +
    (spaceComplexity.isCorrect ? 1 : 0) * GRADING_WEIGHTS.spaceComplexity +
    edgeCases.recall * GRADING_WEIGHTS.edgeCases;

  const isFullyCorrect =
    dataStructure.isCorrect &&
    technique.isCorrect &&
    timeComplexity.isCorrect &&
    spaceComplexity.isCorrect &&
    edgeCases.isCorrect;

  return {
    dataStructure,
    technique,
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
 * - correct pick -> that tag seen + correct
 * - wrong pick   -> primary seen + incorrect (failed to recall it)
 *                   selected seen + incorrect (over-applies it)
 *
 * Counting the wrong pick against *its own* tag is what surfaces the
 * "reaches for DP on everything" pattern, which a recall-only metric misses.
 */
export function buildTagOutcomes(graded: GradedAttempt): TagOutcome[] {
  const outcomes: TagOutcome[] = [];

  const project = (kind: CategoryKind, c: ChoiceComparison<string>) => {
    if (c.isCorrect) {
      outcomes.push({ kind, key: c.selected, wasCorrect: true });
    } else {
      outcomes.push({ kind, key: c.primary, wasCorrect: false });
      outcomes.push({ kind, key: c.selected, wasCorrect: false });
    }
  };

  project(CategoryKind.DATA_STRUCTURE, graded.dataStructure);
  project(CategoryKind.TECHNIQUE, graded.technique);

  return outcomes;
}

/**
 * Codex slugs are derived from (kind, key) rather than stored, so the grader
 * can emit links without a DB round-trip and the seed can never drift from
 * the grader. "TECHNIQUE" + "SLIDING_WINDOW" -> "technique-sliding-window".
 */
export function codexSlugFor(kind: CategoryKind, key: string): string {
  const kindPart = kind === CategoryKind.TECHNIQUE ? 'technique' : 'data-structure';
  return `${kindPart}-${key.toLowerCase().replace(/_/g, '-')}`;
}

/**
 * Which codex entries a result screen should point at. Always the intended
 * technique and data structure; additionally, whatever the learner wrongly
 * reached for, so a miss leads straight to "when you should actually use X".
 */
export function buildCodexRefs(graded: GradedAttempt): CodexRef[] {
  const refs: CodexRef[] = [];
  const seen = new Set<string>();

  const push = (kind: CategoryKind, key: string, reason: CodexRef['reason']) => {
    const slug = codexSlugFor(kind, key);
    if (seen.has(slug)) return;
    seen.add(slug);
    refs.push({ kind, key, slug, reason });
  };

  push(CategoryKind.TECHNIQUE, graded.technique.primary, 'INTENDED');
  push(CategoryKind.DATA_STRUCTURE, graded.dataStructure.primary, 'INTENDED');

  if (!graded.technique.isCorrect) {
    push(CategoryKind.TECHNIQUE, graded.technique.selected, 'OVER_APPLIED');
  }
  if (!graded.dataStructure.isCorrect) {
    push(CategoryKind.DATA_STRUCTURE, graded.dataStructure.selected, 'OVER_APPLIED');
  }

  return refs;
}
