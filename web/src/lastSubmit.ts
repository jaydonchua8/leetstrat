import type { SubmitAttemptResponse } from './api';

/**
 * The submit response carries `stats` (running per-tag accuracy) that
 * GET /attempts/:id does not. Keep the most recent submit in memory so the
 * result screen can show stats right after grading; on reload it falls back
 * to the GET shape without them.
 */
let last: SubmitAttemptResponse | null = null;

export function rememberSubmit(r: SubmitAttemptResponse): void {
  last = r;
}

export function takeSubmit(attemptId: string): SubmitAttemptResponse | null {
  return last?.attemptId === attemptId ? last : null;
}
