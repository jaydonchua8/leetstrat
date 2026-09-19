import { z } from 'zod';
import { CategoryKind, Difficulty } from '../types';

/**
 * Problems can be filtered by difficulty only. Filtering by technique or data
 * structure would hand the learner the answer before they read the statement.
 */
export const listProblemsQuerySchema = z.object({
  difficulty: z.nativeEnum(Difficulty).optional(),
});

export const listCodexQuerySchema = z.object({
  kind: z.nativeEnum(CategoryKind).optional(),
});
