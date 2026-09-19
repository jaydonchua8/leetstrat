import type { ReactNode } from 'react';
import type { Difficulty } from './generated/enums';

/** "SLIDING_WINDOW" -> "Sliding Window". */
export function labelFor(enumMember: string): string {
  return enumMember
    .toLowerCase()
    .split('_')
    .map((w) => (w === 'dfs' || w === 'bfs' ? w.toUpperCase() : w[0]!.toUpperCase() + w.slice(1)))
    .join(' ');
}

export function DifficultyBadge({ value }: { value: Difficulty }) {
  return <span className={`badge badge-${value.toLowerCase()}`}>{labelFor(value)}</span>;
}

export function Loading() {
  return <p className="muted">Loading…</p>;
}

export function ErrorBox({ error }: { error: Error }) {
  return (
    <div className="error-box" role="alert">
      <strong>Something went wrong.</strong> {error.message}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className ?? ''}`}>{children}</section>;
}
