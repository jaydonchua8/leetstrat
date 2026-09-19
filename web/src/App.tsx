import { paths, useRoute } from './router';
import { AttemptForm } from './pages/AttemptForm';
import { CodexEntry, CodexList } from './pages/Codex';
import { ProblemList } from './pages/ProblemList';
import { Result } from './pages/Result';
import { DemoUserField } from './DemoUserField';

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
        <DemoUserField />
      </nav>
      <main className="content">
        {route.name === 'problems' && <ProblemList />}
        {route.name === 'problem' && <AttemptForm slug={route.slug} />}
        {route.name === 'attempt' && <Result id={route.id} />}
        {route.name === 'codex' && <CodexList />}
        {route.name === 'codexEntry' && <CodexEntry slug={route.slug} />}
      </main>
    </div>
  );
}
