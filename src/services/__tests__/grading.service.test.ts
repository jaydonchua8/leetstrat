import { describe, expect, it } from 'vitest';
import {
  buildCodexRefs,
  buildTagOutcomes,
  codexSlugFor,
  compareChoice,
  compareComplexity,
  gradeAttempt,
  GRADING_WEIGHTS,
  matchEdgeCases,
  normalizeEdgeCaseText,
} from '../grading.service';
import { ProblemAnswerKey, SubmitAttemptInput } from '../../types';

const key: ProblemAnswerKey = {
  id: 'p1',
  slug: 'test-problem',
  title: 'Test Problem',
  difficulty: 'MEDIUM',
  primaryDataStructure: 'HASH_SET',
  acceptedDataStructures: ['HASH_SET', 'HASH_MAP'],
  primaryTechnique: 'SLIDING_WINDOW',
  acceptedTechniques: ['SLIDING_WINDOW', 'TWO_POINTERS'],
  primaryTimeComplexity: 'O_N',
  acceptedTimeComplexities: ['O_N'],
  primarySpaceComplexity: 'O_1',
  acceptedSpaceComplexities: ['O_1', 'O_N'],
  approachSummary: 'Expand and shrink a window.',
  explanation: 'Contiguous substring + a constraint that breaks = window.',
  edgeCases: [
    {
      id: 'e1',
      description: 'Empty string',
      matchers: ['empty', 'length 0', 'n == 0', 'no characters'],
      explanation: null,
    },
    {
      id: 'e2',
      description: 'All characters identical',
      matchers: ['all same', 'identical', 'repeated character', 'aaaa'],
      explanation: 'Window never grows past 1.',
    },
  ],
};

const perfect: SubmitAttemptInput = {
  userId: 'u1',
  problemId: 'p1',
  selectedDataStructure: 'HASH_SET',
  selectedTechnique: 'SLIDING_WINDOW',
  selectedTimeComplexity: 'O_N',
  selectedSpaceComplexity: 'O_1',
  edgeCasesText: 'Empty string; all characters identical like "aaaa".',
};

describe('GRADING_WEIGHTS', () => {
  it('sums to 1', () => {
    const sum = Object.values(GRADING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(sum).toBeCloseTo(1);
  });

  it('weights edge cases below every categorical field', () => {
    const { edgeCases, ...categorical } = GRADING_WEIGHTS;
    for (const w of Object.values(categorical)) expect(w).toBeGreaterThan(edgeCases);
  });
});

describe('compareChoice', () => {
  it('accepts the primary answer', () => {
    const r = compareChoice('A', 'A', ['A', 'B']);
    expect(r.isCorrect).toBe(true);
    expect(r.isAlternative).toBe(false);
  });

  it('accepts an alternative and flags it as such', () => {
    const r = compareChoice('B', 'A', ['A', 'B']);
    expect(r.isCorrect).toBe(true);
    expect(r.isAlternative).toBe(true);
  });

  it('rejects anything outside the accepted set', () => {
    const r = compareChoice('C', 'A', ['A', 'B']);
    expect(r.isCorrect).toBe(false);
    expect(r.primary).toBe('A');
  });

  it('treats primary as accepted even if the key omitted it', () => {
    const r = compareChoice('A', 'A', ['B']);
    expect(r.isCorrect).toBe(true);
    expect(r.accepted).toContain('A');
  });
});

describe('compareComplexity', () => {
  it('flags an overestimate', () => {
    const r = compareComplexity('O_N_SQUARED', 'O_N');
    expect(r.direction).toBe('OVERESTIMATE');
    expect(r.isCorrect).toBe(false);
  });

  it('flags an underestimate', () => {
    expect(compareComplexity('O_LOG_N', 'O_N').direction).toBe('UNDERESTIMATE');
  });

  it('marks multi-variable classes incomparable', () => {
    expect(compareComplexity('O_N_TIMES_M', 'O_N').direction).toBe('INCOMPARABLE');
  });

  it('accepts an alternative but still reports direction against primary', () => {
    const r = compareComplexity('O_N', 'O_1', ['O_N']);
    expect(r.isCorrect).toBe(true);
    expect(r.isAlternative).toBe(true);
    expect(r.direction).toBe('OVERESTIMATE');
  });

  it('exposes human-readable labels', () => {
    const r = compareComplexity('O_N_LOG_N', 'O_N');
    expect(r.selectedLabel).toBe('O(n log n)');
    expect(r.primaryLabel).toBe('O(n)');
  });
});

describe('normalizeEdgeCaseText', () => {
  it('lowercases, strips punctuation, collapses whitespace', () => {
    expect(normalizeEdgeCaseText('  Empty   ARRAY, (n=0)!! ')).toBe('empty array n=0 !!');
  });

  it('keeps comparison operators so shorthand survives', () => {
    expect(normalizeEdgeCaseText('n == 0, k > n')).toBe('n == 0 k > n');
  });
});

describe('matchEdgeCases', () => {
  it('matches any variant, case-insensitively', () => {
    const r = matchEdgeCases('What if N == 0? Also ALL SAME chars.', key.edgeCases);
    expect(r.matchedCount).toBe(2);
    expect(r.isCorrect).toBe(true);
    expect(r.matches[0]?.matchedOn).toBe('n == 0');
    expect(r.matches[1]?.matchedOn).toBe('all same');
  });

  it('matches substrings so plurals and inflections count', () => {
    const r = matchEdgeCases('repeated characters everywhere', key.edgeCases);
    expect(r.matches[1]?.matched).toBe(true);
  });

  it('reports misses with descriptions and explanations', () => {
    const r = matchEdgeCases('empty input', key.edgeCases);
    expect(r.matchedCount).toBe(1);
    expect(r.isCorrect).toBe(false);
    expect(r.recall).toBe(0.5);
    const miss = r.matches.find((m) => !m.matched);
    expect(miss?.description).toBe('All characters identical');
    expect(miss?.explanation).toBe('Window never grows past 1.');
  });

  it('never penalises unrecognised text', () => {
    const r = matchEdgeCases('empty, identical, plus unicode and negative numbers', key.edgeCases);
    expect(r.isCorrect).toBe(true);
    expect(r.recall).toBe(1);
  });

  it('matches nothing on empty text', () => {
    const r = matchEdgeCases('   ', key.edgeCases);
    expect(r.matchedCount).toBe(0);
    expect(r.recall).toBe(0);
  });

  it('is vacuously correct when the key has no edge cases', () => {
    const r = matchEdgeCases('whatever', []);
    expect(r.isCorrect).toBe(true);
    expect(r.recall).toBe(1);
  });

  it('ignores blank matchers', () => {
    const r = matchEdgeCases('anything', [
      { id: 'x', description: 'x', matchers: ['', '   '], explanation: null },
    ]);
    expect(r.matchedCount).toBe(0);
  });
});

describe('gradeAttempt', () => {
  it('scores a perfect attempt at 1', () => {
    const g = gradeAttempt(perfect, key);
    expect(g.isFullyCorrect).toBe(true);
    expect(g.score).toBe(1);
  });

  it('still scores 1 via accepted alternatives', () => {
    const g = gradeAttempt(
      { ...perfect, selectedTechnique: 'TWO_POINTERS', selectedSpaceComplexity: 'O_N' },
      key,
    );
    expect(g.isFullyCorrect).toBe(true);
    expect(g.score).toBe(1);
    expect(g.technique.isAlternative).toBe(true);
  });

  it('deducts the technique weight for a wrong technique', () => {
    const g = gradeAttempt({ ...perfect, selectedTechnique: 'DYNAMIC_PROGRAMMING' }, key);
    expect(g.isFullyCorrect).toBe(false);
    expect(g.technique.primary).toBe('SLIDING_WINDOW');
    expect(g.score).toBeCloseTo(1 - GRADING_WEIGHTS.technique);
  });

  it('gives partial credit for partial edge-case recall', () => {
    const g = gradeAttempt({ ...perfect, edgeCasesText: 'empty' }, key);
    expect(g.isFullyCorrect).toBe(false);
    expect(g.edgeCases.recall).toBe(0.5);
    expect(g.score).toBeCloseTo(1 - GRADING_WEIGHTS.edgeCases / 2);
  });

  it('scores an all-wrong attempt at 0', () => {
    const g = gradeAttempt(
      {
        ...perfect,
        selectedDataStructure: 'HEAP',
        selectedTechnique: 'GREEDY',
        selectedTimeComplexity: 'O_N_SQUARED',
        selectedSpaceComplexity: 'O_N_SQUARED',
        edgeCasesText: '',
      },
      key,
    );
    expect(g.score).toBe(0);
  });
});

describe('buildTagOutcomes', () => {
  it('credits the selected tag on a correct pick', () => {
    const out = buildTagOutcomes(gradeAttempt(perfect, key));
    expect(out).toEqual([
      { kind: 'DATA_STRUCTURE', key: 'HASH_SET', wasCorrect: true },
      { kind: 'TECHNIQUE', key: 'SLIDING_WINDOW', wasCorrect: true },
    ]);
  });

  it('debits both the missed primary and the over-applied pick', () => {
    const out = buildTagOutcomes(
      gradeAttempt({ ...perfect, selectedTechnique: 'DYNAMIC_PROGRAMMING' }, key),
    );
    expect(out).toContainEqual({ kind: 'TECHNIQUE', key: 'SLIDING_WINDOW', wasCorrect: false });
    expect(out).toContainEqual({ kind: 'TECHNIQUE', key: 'DYNAMIC_PROGRAMMING', wasCorrect: false });
  });
});

describe('codex links', () => {
  it('derives slugs deterministically from kind and key', () => {
    expect(codexSlugFor('TECHNIQUE', 'SLIDING_WINDOW')).toBe('technique-sliding-window');
    expect(codexSlugFor('DATA_STRUCTURE', 'HASH_MAP')).toBe('data-structure-hash-map');
  });

  it('links only the intended entries on a correct attempt', () => {
    const refs = buildCodexRefs(gradeAttempt(perfect, key));
    expect(refs.map((r) => r.slug)).toEqual([
      'technique-sliding-window',
      'data-structure-hash-set',
    ]);
    expect(refs.every((r) => r.reason === 'INTENDED')).toBe(true);
  });

  it('adds the over-applied entry on a miss', () => {
    const refs = buildCodexRefs(
      gradeAttempt(
        { ...perfect, selectedTechnique: 'DYNAMIC_PROGRAMMING', selectedDataStructure: 'HEAP' },
        key,
      ),
    );
    expect(refs).toContainEqual({
      kind: 'TECHNIQUE',
      key: 'DYNAMIC_PROGRAMMING',
      slug: 'technique-dynamic-programming',
      reason: 'OVER_APPLIED',
    });
    expect(refs).toContainEqual({
      kind: 'DATA_STRUCTURE',
      key: 'HEAP',
      slug: 'data-structure-heap',
      reason: 'OVER_APPLIED',
    });
  });

  it('does not link an accepted alternative as over-applied', () => {
    const refs = buildCodexRefs(gradeAttempt({ ...perfect, selectedTechnique: 'TWO_POINTERS' }, key));
    expect(refs.some((r) => r.reason === 'OVER_APPLIED')).toBe(false);
  });
});
