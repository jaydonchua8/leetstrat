import { useState } from 'react';
import { api } from '../api';
import { CATEGORY_KINDS, type CategoryKind } from '../generated/enums';
import { paths } from '../router';
import { Card, ErrorBox, Loading, labelFor } from '../ui';
import { useAsync } from '../useAsync';

const KIND_TITLE: Record<CategoryKind, string> = {
  TECHNIQUE: 'Techniques & patterns',
  DATA_STRUCTURE: 'Data structures',
};

export function CodexList() {
  const [kind, setKind] = useState<CategoryKind | ''>('');
  const state = useAsync(() => api.listCodex(kind || undefined), [kind]);

  return (
    <>
      <header className="page-header">
        <h1>Codex</h1>
        <label className="inline-field">
          Show
          <select value={kind} onChange={(e) => setKind(e.target.value as CategoryKind | '')}>
            <option value="">Everything</option>
            {CATEGORY_KINDS.map((k) => (
              <option key={k} value={k}>
                {KIND_TITLE[k]}
              </option>
            ))}
          </select>
        </label>
      </header>
      <p className="muted">
        Short definitions and the signals in a problem statement that should make you reach for each one.
      </p>

      {state.status === 'loading' && <Loading />}
      {state.status === 'error' && <ErrorBox error={state.error} />}
      {state.status === 'ready' &&
        // The API returns entries ordered by kind then title; group on the client.
        CATEGORY_KINDS.filter((k) => !kind || k === kind).map((k) => {
          const entries = state.data.filter((e) => e.kind === k);
          if (entries.length === 0) return null;
          return (
            <section key={k} className="codex-group">
              <h2>{KIND_TITLE[k]}</h2>
              <ul className="codex-grid">
                {entries.map((e) => (
                  <li key={e.id}>
                    <a href={paths.codexEntry(e.slug)}>{e.title}</a>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
    </>
  );
}

export function CodexEntry({ slug }: { slug: string }) {
  const state = useAsync(() => api.getCodexEntry(slug), [slug]);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <ErrorBox error={state.error} />;
  const e = state.data;

  return (
    <>
      <p className="crumbs">
        <a href={paths.codex()}>Codex</a> / {KIND_TITLE[e.kind]} / {e.title}
      </p>
      <header className="page-header">
        <h1>{e.title}</h1>
        <span className="badge">{labelFor(e.kind)}</span>
      </header>
      <Card>
        <p>{e.summary}</p>
      </Card>
      <Card>
        <h2>Reach for this when you see…</h2>
        <ul className="signal-list">
          {e.signals.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ul>
      </Card>
      <p>
        <a href={paths.codex()}>← All entries</a>
      </p>
    </>
  );
}
