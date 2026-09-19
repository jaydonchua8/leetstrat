import { paths, useRoute } from './router';
import { ProblemList } from './pages/ProblemList';

function Placeholder({ name }: { name: string }) {
  return <p className="muted">{name} — coming next.</p>;
}

export function App() {
  const route = useRoute();

  return (
    <div className="shell">
      <nav className="topnav">
        <a href={paths.problems()} className="brand">
          LeetStrat
        </a>
        <a href={paths.problems()} className={route.name === 'problems' || route.name === 'problem' ? 'active' : ''}>
          Problems
        </a>
        <a href={paths.codex()} className={route.name.startsWith('codex') ? 'active' : ''}>
          Codex
        </a>
      </nav>
      <main className="content">
        {route.name === 'problems' && <ProblemList />}
        {route.name === 'problem' && <Placeholder name={`Attempt ${route.slug}`} />}
        {route.name === 'attempt' && <Placeholder name={`Result ${route.id}`} />}
        {route.name === 'codex' && <Placeholder name="Codex" />}
        {route.name === 'codexEntry' && <Placeholder name={`Codex ${route.slug}`} />}
      </main>
    </div>
  );
}
