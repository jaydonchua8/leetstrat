import { useState, type FormEvent } from 'react';
import { api, ApiError, type SubmitAttemptBody } from '../api';
import { getDemoUserId } from '../demoUser';
import {
  COMPLEXITIES,
  COMPLEXITY_LABEL,
  DATA_STRUCTURES,
  TECHNIQUES,
  type AlgorithmicTechnique,
  type Complexity,
  type DataStructure,
} from '../generated/enums';
import { rememberSubmit } from '../lastSubmit';
import { navigate, paths } from '../router';
import { Statement } from '../Statement';
import { Card, DifficultyBadge, ErrorBox, Loading, labelFor } from '../ui';
import { useAsync } from '../useAsync';

type Draft = {
  selectedDataStructure: DataStructure | '';
  selectedTechnique: AlgorithmicTechnique | '';
  selectedTimeComplexity: Complexity | '';
  selectedSpaceComplexity: Complexity | '';
  edgeCasesText: string;
};

const EMPTY: Draft = {
  selectedDataStructure: '',
  selectedTechnique: '',
  selectedTimeComplexity: '',
  selectedSpaceComplexity: '',
  edgeCasesText: '',
};

function Select<T extends string>({
  label,
  value,
  options,
  render,
  onChange,
}: {
  label: string;
  value: T | '';
  options: readonly T[];
  render: (v: T) => string;
  onChange: (v: T | '') => void;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value as T | '')} required>
        <option value="">Choose…</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {render(o)}
          </option>
        ))}
      </select>
    </label>
  );
}

export function AttemptForm({ slug }: { slug: string }) {
  const problem = useAsync(() => api.getProblem(slug), [slug]);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const set = <K extends keyof Draft>(key: K) => (value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (problem.status !== 'ready') return;
    const userId = getDemoUserId();
    if (!userId) {
      setError(new Error('Paste the demo user id (printed by `npm run db:seed`) into the field in the top bar first.'));
      return;
    }
    // `required` on the selects guarantees these are non-empty by now.
    const body: SubmitAttemptBody = {
      userId,
      problemId: problem.data.id,
      selectedDataStructure: draft.selectedDataStructure as DataStructure,
      selectedTechnique: draft.selectedTechnique as AlgorithmicTechnique,
      selectedTimeComplexity: draft.selectedTimeComplexity as Complexity,
      selectedSpaceComplexity: draft.selectedSpaceComplexity as Complexity,
      edgeCasesText: draft.edgeCasesText,
    };
    setSubmitting(true);
    setError(null);
    try {
      const result = await api.submitAttempt(body);
      rememberSubmit(result);
      navigate(paths.attempt(result.attemptId));
    } catch (err) {
      setError(
        err instanceof ApiError && err.code === 'NOT_FOUND' && /User/.test(err.message)
          ? new Error(`${err.message}. Check the demo user id in the top bar.`)
          : (err as Error),
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (problem.status === 'loading') return <Loading />;
  if (problem.status === 'error') return <ErrorBox error={problem.error} />;
  const p = problem.data;

  return (
    <>
      <p className="crumbs">
        <a href={paths.problems()}>Problems</a> / {p.title}
      </p>
      <header className="page-header">
        <h1>
          {p.leetcodeId !== null && <span className="muted">#{p.leetcodeId} </span>}
          {p.title}
        </h1>
        <DifficultyBadge value={p.difficulty} />
      </header>

      <Card>
        <Statement text={p.description} />
        {p.sourceUrl && (
          <p className="muted small">
            <a href={p.sourceUrl} target="_blank" rel="noreferrer">
              Original on LeetCode ↗
            </a>
          </p>
        )}
      </Card>

      <Card>
        <h2>Before you write any code</h2>
        <p className="muted">Commit to an approach. You will be graded on each field separately.</p>
        <form onSubmit={onSubmit} className="attempt-form">
          <div className="field-grid">
            <Select
              label="Primary data structure"
              value={draft.selectedDataStructure}
              options={DATA_STRUCTURES}
              render={labelFor}
              onChange={set('selectedDataStructure')}
            />
            <Select
              label="Technique / pattern"
              value={draft.selectedTechnique}
              options={TECHNIQUES}
              render={labelFor}
              onChange={set('selectedTechnique')}
            />
            <Select
              label="Time complexity"
              value={draft.selectedTimeComplexity}
              options={COMPLEXITIES}
              render={(c) => COMPLEXITY_LABEL[c]}
              onChange={set('selectedTimeComplexity')}
            />
            <Select
              label="Space complexity"
              value={draft.selectedSpaceComplexity}
              options={COMPLEXITIES}
              render={(c) => COMPLEXITY_LABEL[c]}
              onChange={set('selectedSpaceComplexity')}
            />
          </div>
          <label className="field">
            <span>Edge cases you would watch for</span>
            <textarea
              value={draft.edgeCasesText}
              maxLength={2000}
              placeholder="Free text — e.g. empty input, a single element, duplicates, negative numbers…"
              onChange={(e) => set('edgeCasesText')(e.target.value)}
            />
          </label>
          {error && <ErrorBox error={error} />}
          <div className="form-actions">
            <button type="submit" disabled={submitting}>
              {submitting ? 'Grading…' : 'Submit approach'}
            </button>
          </div>
        </form>
      </Card>
    </>
  );
}
