import { z } from 'zod';
import { AlgorithmicTechnique, Complexity, DataStructure } from '../types';

/**
 * Note: userId is accepted from the body only because auth is out of scope for
 * this engine. In production, replace it with `req.user.id` from an auth
 * middleware — as written, any caller can submit attempts as any user.
 */
export const submitAttemptSchema = z.object({
  userId: z.string().cuid(),
  problemId: z.string().cuid(),
  selectedDataStructures: z
    .array(z.nativeEnum(DataStructure))
    .max(8, 'Select at most 8 data structures'),
  selectedTechniques: z
    .array(z.nativeEnum(AlgorithmicTechnique))
    .max(8, 'Select at most 8 techniques'),
  selectedTimeComplexity: z.nativeEnum(Complexity),
  selectedSpaceComplexity: z.nativeEnum(Complexity),
  selectedEdgeCaseIds: z.array(z.string().cuid()).max(20),
  durationMs: z.number().int().positive().max(3_600_000).optional(),
});

export type SubmitAttemptBody = z.infer<typeof submitAttemptSchema>;
