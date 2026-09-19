import { useEffect, useState } from 'react';

/**
 * Hash routing: no server fallback needed, and the Express app only has to
 * serve index.html at "/". Routes are matched in order; params are the
 * captured groups.
 */
export type Route =
  | { name: 'problems' }
  | { name: 'problem'; slug: string }
  | { name: 'attempt'; id: string }
  | { name: 'codex' }
  | { name: 'codexEntry'; slug: string };

const ROUTES: Array<[RegExp, (m: RegExpMatchArray) => Route]> = [
  [/^#\/problems\/([^/]+)$/, (m) => ({ name: 'problem', slug: m[1]! })],
  [/^#\/attempts\/([^/]+)$/, (m) => ({ name: 'attempt', id: m[1]! })],
  [/^#\/codex\/([^/]+)$/, (m) => ({ name: 'codexEntry', slug: m[1]! })],
  [/^#\/codex$/, () => ({ name: 'codex' })],
];

export function parseHash(hash: string): Route {
  for (const [re, build] of ROUTES) {
    const m = hash.match(re);
    if (m) return build(m);
  }
  return { name: 'problems' };
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);
  return route;
}

export function navigate(hash: string): void {
  window.location.hash = hash;
}

export const paths = {
  problems: () => '#/problems',
  problem: (slug: string) => `#/problems/${slug}`,
  attempt: (id: string) => `#/attempts/${id}`,
  codex: () => '#/codex',
  codexEntry: (slug: string) => `#/codex/${slug}`,
};
