import { useState } from 'react';
import { api } from '../api';
import { DIFFICULTIES, type Difficulty } from '../generated/enums';
import { paths } from '../router';
import { DifficultyBadge, ErrorBox, Loading, labelFor } from '../ui';
import { useAsync } from '../useAsync';

/**
 * Title and difficulty only. The API never sends anything approach-related
 * on this path, and nothing here should either — the whole exercise is
 * reading the statement cold.
 */
export function ProblemList() {
  const [difficulty, setDifficulty] = useState<Difficulty | ''>('');
  const state = useAsync(() => api.listProblems(difficulty || undefined), [difficulty]);

  return (
    <>
      <header className="page-header">
        <h1>Problems</h1>
        <label className="inline-field">
          Difficulty
          <select value={difficulty} onChange={(e) => setDifficulty(e.target.value as Difficulty | '')}>
            <option value="">All</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {labelFor(d)}
              </option>
            ))}
          </select>
        </label>
      </header>

      {state.status === 'loading' && <Loading />}
      {state.status === 'error' && <ErrorBox error={state.error} />}
      {state.status === 'ready' && state.data.length === 0 && (
        <p className="muted">No problems at this difficulty.</p>
      )}
      {state.status === 'ready' && state.data.length > 0 && (
        <ul className="problem-list">
          {state.data.map((p) => (
            <li key={p.id}>
              <a href={paths.problem(p.slug)} className="problem-row">
                <span className="problem-title">{p.title}</span>
                <DifficultyBadge value={p.difficulty} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
