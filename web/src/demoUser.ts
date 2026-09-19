/**
 * There is no users endpoint and auth is out of scope, so the demo user's id
 * (printed by `npm run db:seed`) is pasted once into the nav and kept in
 * localStorage. VITE_DEMO_USER_ID pre-fills it for local dev.
 */
const KEY = 'leetstrat.demoUserId';

export function getDemoUserId(): string {
  return localStorage.getItem(KEY) ?? import.meta.env.VITE_DEMO_USER_ID ?? '';
}

export function setDemoUserId(id: string): void {
  localStorage.setItem(KEY, id.trim());
}
