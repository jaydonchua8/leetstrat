import { describe, expect, it } from 'vitest';
import { compareComplexity, compareSets, gradeAttempt } from '../grading.service';
import { ProblemAnswerKey, SubmitAttemptInput } from '../../types';

const key: ProblemAnswerKey = {
  id: 'p1',
  title: 'Test Problem',
  difficulty: 'MEDIUM',
  correctDataStructures: ['STRING', 'HASH_SET'],
  correctTechniques: ['SLIDING_WINDOW', 'TWO_POINTERS'],
  optimalTimeComplexity: 'O_N',
  optimalSpaceComplexity: 'O_N',
  optimalApproachSummary: 'Expand and shrink a window.',
  requiredEdgeCaseIds: ['e1', 'e2'],
  edgeCaseDescriptions: { e1: 'Empty string', e2: 'All identical' },
};

const perfect: SubmitAttemptInput = {
  userId: 'u1',
  problemId: 'p1',
  selectedDataStructures: ['STRING', 'HASH_SET'],
  selectedTechniques: ['SLIDING_WINDOW', 'TWO_POINTERS'],
  selectedTimeComplexity: 'O_N',
  selectedSpaceComplexity: 'O_N',
  selectedEdgeCaseIds: ['e1', 'e2'],
};

describe('compareSets', () => {
  it('splits into matched, missing, and extra', () => {
    const r = compareSets(['A', 'B'], ['B', 'C']);
    expect(r.matched).toEqual(['B']);
    expect(r.missing).toEqual(['C']);
    expect(r.extra).toEqual(['A']);
    expect(r.isCorrect).toBe(false);
    expect(r.jaccard).toBeCloseTo(1 / 3);
  });

  it('treats two empty sets as correct', () => {
    const r = compareSets([], []);
    expect(r.isCorrect).toBe(true);
    expect(r.jaccard).toBe(1);
  });

  it('de-duplicates selections', () => {
    const r = compareSets(['A', 'A'], ['A']);
    expect(r.isCorrect).toBe(true);
    expect(r.selected).toEqual(['A']);
  });
});

describe('compareComplexity', () => {
  it('flags an overestimate', () => {
    expect(compareComplexity('O_N_SQUARED', 'O_N').direction).toBe('OVERESTIMATE');
  });

  it('flags an underestimate', () => {
    expect(compareComplexity('O_LOG_N', 'O_N').direction).toBe('UNDERESTIMATE');
  });

  it('marks multi-variable classes incomparable', () => {
    expect(compareComplexity('O_N_TIMES_M', 'O_N').direction).toBe('INCOMPARABLE');
  });
});

describe('gradeAttempt', () => {
  it('scores a perfect attempt at 1', () => {
    const g = gradeAttempt(perfect, key);
    expect(g.isFullyCorrect).toBe(true);
    expect(g.score).toBe(1);
  });

  it('awards partial credit for a partial technique match', () => {
    const g = gradeAttempt(
      { ...perfect, selectedTechniques: ['SLIDING_WINDOW'] },
      key,
    );
    expect(g.isFullyCorrect).toBe(false);
    expect(g.techniques.missing).toEqual(['TWO_POINTERS']);
    expect(g.score).toBeGreaterThan(0.8);
    expect(g.score).toBeLessThan(1);
  });

  it('penalises a decoy edge case', () => {
    const g = gradeAttempt(
      { ...perfect, selectedEdgeCaseIds: ['e1', 'e2', 'decoy'] },
      key,
    );
    expect(g.edgeCases.extra).toEqual(['decoy']);
    expect(g.isFullyCorrect).toBe(false);
  });
});
