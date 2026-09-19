// DTO types come straight from the server's type module (type-only import, so
// nothing from @prisma/client reaches the bundle). Enum *values* for dropdowns
// come from the generated file.
import type {
  AttemptResult,
  CodexEntryDetail,
  CodexEntrySummary,
  ProblemDetail,
  ProblemSummary,
  SubmitAttemptResponse,
} from '../../src/types';
import type {
  AlgorithmicTechnique,
  CategoryKind,
  Complexity,
  DataStructure,
  Difficulty,
} from './generated/enums';

export type {
  AttemptResult,
  CodexEntryDetail,
  CodexEntrySummary,
  ProblemDetail,
  ProblemSummary,
  SubmitAttemptResponse,
};

export interface SubmitAttemptBody {
  userId: string;
  problemId: string;
  selectedDataStructure: DataStructure;
  selectedTechnique: AlgorithmicTechnique;
  selectedTimeComplexity: Complexity;
  selectedSpaceComplexity: Complexity;
  edgeCasesText: string;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type Envelope<T> =
  | { success: true; data: T }
  | { success: false; error: { code: string; message: string; details?: unknown } };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  });
  const body = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!body) throw new ApiError(`Bad response from ${path}`, res.status, 'BAD_RESPONSE');
  if (!body.success) {
    throw new ApiError(body.error.message, res.status, body.error.code, body.error.details);
  }
  return body.data;
}

const qs = (params: Record<string, string | undefined>) => {
  const entries = Object.entries(params).filter((e): e is [string, string] => !!e[1]);
  return entries.length ? `?${new URLSearchParams(entries)}` : '';
};

export const api = {
  listProblems: (difficulty?: Difficulty) =>
    request<ProblemSummary[]>(`/problems${qs({ difficulty })}`),
  getProblem: (idOrSlug: string) => request<ProblemDetail>(`/problems/${idOrSlug}`),
  submitAttempt: (body: SubmitAttemptBody) =>
    request<SubmitAttemptResponse>('/attempts/submit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),
  getAttempt: (id: string) => request<AttemptResult>(`/attempts/${id}`),
  listCodex: (kind?: CategoryKind) => request<CodexEntrySummary[]>(`/codex${qs({ kind })}`),
  getCodexEntry: (slug: string) => request<CodexEntryDetail>(`/codex/${slug}`),
};
