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
  selectedDataStructure: z.nativeEnum(DataStructure),
  selectedTechnique: z.nativeEnum(AlgorithmicTechnique),
  selectedTimeComplexity: z.nativeEnum(Complexity),
  selectedSpaceComplexity: z.nativeEnum(Complexity),
  edgeCasesText: z.string().max(2000, 'Keep edge cases under 2000 characters'),
  durationMs: z.number().int().positive().max(3_600_000).optional(),
});

export type SubmitAttemptBody = z.infer<typeof submitAttemptSchema>;
