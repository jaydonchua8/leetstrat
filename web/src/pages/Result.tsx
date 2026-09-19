import type {
  AttemptResult,
  ChoiceComparison,
  CodexLink,
  ComplexityComparison,
  EdgeCaseComparison,
  SubmitAttemptResponse,
  UserAccuracyStats,
} from '../../../src/types';
import { api } from '../api';
import { takeSubmit } from '../lastSubmit';
import { paths } from '../router';
import { Card, DifficultyBadge, ErrorBox, Loading, labelFor } from '../ui';
import { useAsync } from '../useAsync';

// ---------------------------------------------------------------------------
// Per-field verdicts
// ---------------------------------------------------------------------------

function Verdict({ c }: { c: ChoiceComparison<string> }) {
  if (!c.isCorrect) return <span className="badge badge-bad">Missed</span>;
  if (c.isAlternative) return <span className="badge badge-warn">Accepted alternative</span>;
  return <span className="badge badge-ok">Correct</span>;
}

/** Lists what would have been accepted, minus what the learner picked. */
function Accepted({ c, render }: { c: ChoiceComparison<string>; render: (v: string) => string }) {
  const others = c.accepted.filter((a) => a !== c.primary && a !== c.selected);
  return (
    <div className="field-answer">
      <div>
        <span className="muted">Intended: </span>
        <strong>{render(c.primary)}</strong>
      </div>
      {others.length > 0 && (
        <div className="muted small">Also accepted: {others.map(render).join(', ')}</div>
      )}
    </div>
  );
}

function ChoiceRow({
  label,
  c,
  render = labelFor,
}: {
  label: string;
  c: ChoiceComparison<string>;
  render?: (v: string) => string;
}) {
  return (
    <div className={`field-row ${c.isCorrect ? 'is-ok' : 'is-bad'}`}>
      <div className="field-label">{label}</div>
      <div className="field-pick">
        <span>You said </span>
        <strong>{render(c.selected)}</strong> <Verdict c={c} />
      </div>
      {(!c.isCorrect || c.isAlternative) && <Accepted c={c} render={render} />}
    </div>
  );
}

const DIRECTION_TEXT: Record<ComplexityComparison['direction'], string> = {
  EXACT: '',
  OVERESTIMATE: 'You were too pessimistic — the intended approach is faster/leaner than that.',
  UNDERESTIMATE: 'You were too optimistic — the intended approach cannot do better than this.',
  INCOMPARABLE: 'Different variables — your answer and the intended one are not on the same scale.',
};

function ComplexityRow({ label, c }: { label: string; c: ComplexityComparison }) {
  const render = (v: string) =>
    v === c.selected ? c.selectedLabel : v === c.primary ? c.primaryLabel : labelFor(v);
  return (
    <div className={`field-row ${c.isCorrect ? 'is-ok' : 'is-bad'}`}>
      <div className="field-label">{label}</div>
      <div className="field-pick">
        <span>You said </span>
        <strong>{c.selectedLabel}</strong> <Verdict c={c} />
        {c.direction !== 'EXACT' && (
          <span className={`badge ${c.isCorrect ? '' : 'badge-warn'}`}>{labelFor(c.direction)}</span>
        )}
      </div>
      {(!c.isCorrect || c.isAlternative) && (
        <>
          <Accepted c={c} render={render} />
          {!c.isCorrect && <p className="muted small">{DIRECTION_TEXT[c.direction]}</p>}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

function EdgeCases({ e }: { e: EdgeCaseComparison }) {
  const caught = e.matches.filter((m) => m.matched);
  const missed = e.matches.filter((m) => !m.matched);
  return (
    <Card>
      <h2>
        Edge cases{' '}
        <span className={`badge ${e.isCorrect ? 'badge-ok' : missed.length === e.total ? 'badge-bad' : 'badge-warn'}`}>
          {e.matchedCount} of {e.total}
        </span>
      </h2>
      {e.text.trim() ? (
        <blockquote className="your-text">{e.text}</blockquote>
      ) : (
        <p className="muted">You did not list any edge cases.</p>
      )}
      <div className="edge-cols">
        <div>
          <h3>Caught</h3>
          {caught.length === 0 && <p className="muted small">None.</p>}
          <ul className="edge-list">
            {caught.map((m) => (
              <li key={m.id} className="is-ok">
                {m.description}
                {m.matchedOn && <span className="muted small"> — matched on “{m.matchedOn}”</span>}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3>Missed</h3>
          {missed.length === 0 && <p className="muted small">None.</p>}
          <ul className="edge-list">
            {missed.map((m) => (
              <li key={m.id} className="is-bad">
                {m.description}
                {m.explanation && <div className="muted small">{m.explanation}</div>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="muted small">
        Edge cases are matched by phrase, so a miss may just be wording the grader didn’t recognise.
      </p>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Codex links + stats
// ---------------------------------------------------------------------------

function CodexLinks({ links }: { links: CodexLink[] }) {
  const intended = links.filter((l) => l.reason === 'INTENDED');
  const overApplied = links.filter((l) => l.reason === 'OVER_APPLIED');
  const List = ({ items }: { items: CodexLink[] }) => (
    <ul className="codex-links">
      {items.map((l) => (
        <li key={l.slug}>
          <a href={paths.codexEntry(l.slug)}>{l.title}</a>{' '}
          <span className="muted small">({labelFor(l.kind)})</span>
        </li>
      ))}
    </ul>
  );
  return (
    <Card>
      <h2>Read up</h2>
      <h3>The intended approach</h3>
      <List items={intended} />
      {overApplied.length > 0 && (
        <>
          <h3>What you reached for instead</h3>
          <p className="muted small">When these actually apply — and why the signals here didn’t point there.</p>
          <List items={overApplied} />
        </>
      )}
    </Card>
  );
}

function Stats({ s }: { s: UserAccuracyStats }) {
  return (
    <Card>
      <h2>Your running accuracy</h2>
      <p className="muted small">
        {s.totalFullyCorrect} of {s.totalAttempts} attempts fully correct. Per tag, counting both misses and
        over-applications:
      </p>
      <ul className="stat-list">
        {s.touchedCategories.map((c) => (
          <li key={`${c.kind}:${c.key}`}>
            <strong>{labelFor(c.key)}</strong>{' '}
            <span className="muted small">
              {c.timesCorrect}/{c.timesSeen} · {labelFor(c.mastery)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

type ResultData = AttemptResult & { stats?: UserAccuracyStats };

export function Result({ id }: { id: string }) {
  const state = useAsync<ResultData>(() => {
    // Right after a submit we already have the response, including stats.
    const fresh: SubmitAttemptResponse | null = takeSubmit(id);
    return fresh ? Promise.resolve(fresh) : api.getAttempt(id);
  }, [id]);

  if (state.status === 'loading') return <Loading />;
  if (state.status === 'error') return <ErrorBox error={state.error} />;
  const r = state.data;
  const b = r.breakdown;
  const fields = [b.dataStructure, b.technique, b.timeComplexity, b.spaceComplexity, b.edgeCases];
  const correctCount = fields.filter((f) => f.isCorrect).length;

  return (
    <>
      <p className="crumbs">
        <a href={paths.problems()}>Problems</a> / <a href={paths.problem(r.problem.slug)}>{r.problem.title}</a> / Result
      </p>
      <header className="page-header">
        <h1>
          {r.isFullyCorrect ? 'All five fields correct' : `${correctCount} of 5 fields correct`}
        </h1>
        <div className="score">
          <span className="score-value">{Math.round(r.score * 100)}%</span>
          <DifficultyBadge value={r.problem.difficulty} />
        </div>
      </header>

      <Card className="fields">
        <ChoiceRow label="Primary data structure" c={b.dataStructure} />
        <ChoiceRow label="Technique / pattern" c={b.technique} />
        <ComplexityRow label="Time complexity" c={b.timeComplexity} />
        <ComplexityRow label="Space complexity" c={b.spaceComplexity} />
      </Card>

      <EdgeCases e={b.edgeCases} />

      <Card className="why">
        <h2>Why {labelFor(b.technique.primary)} is the intended approach</h2>
        <p>{r.reference.explanation}</p>
        <h3>What to do</h3>
        <p>{r.reference.approachSummary}</p>
        {r.feedback && <p className="muted small">{r.feedback}</p>}
      </Card>

      <CodexLinks links={r.codexLinks} />
      {r.stats && <Stats s={r.stats} />}

      <div className="result-actions">
        <a href={paths.problem(r.problem.slug)}>Retry this problem</a>
        <a href={paths.problems()} className="button-link">
          Next problem
        </a>
      </div>
    </>
  );
}
