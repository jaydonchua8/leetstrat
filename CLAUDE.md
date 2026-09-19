# CLAUDE.md — conventions for working in this repo

LeetStrat backend: TypeScript, Express 4, Prisma 5, PostgreSQL, Zod, Vitest.
Read `README.md` for what it does and `NOTES.md` for deferred ideas and
judgement calls already made. Keep both current.

## Scope

This session built the **Training Ground** (problems → structured attempt →
scored result → codex). No dungeon, boss fights, gamification, code editor or
judge. If an idea in that direction comes up, add it to `NOTES.md` and move on.

## Layering (do not skip layers)

`routes/` → `controllers/` → `services/` → `lib/prisma`

- **Controllers** only parse (Zod), call one service, and write the
  `{ success: true, data }` envelope. Errors go to `next(err)`; Zod errors are
  wrapped in `ValidationError` there.
- **Services** own all Prisma access and throw `AppError` subclasses from
  `src/lib/errors.ts`. Never `res` in a service.
- **`grading.service.ts` is pure.** No imports from `lib/prisma`, no async.
  Every scoring rule lives here and gets a test.
- Response envelope is always `{ success, data }` or `{ success: false, error:
  { code, message, details? } }` — the error middleware produces the latter.

## Schema rules

- Enums in `prisma/schema.prisma` are the single source of truth for the
  taxonomy; `src/types/index.ts` re-exports them. Never redeclare them.
- `Problem` is the statement only. Ground truth lives on `ReferenceAnswer`.
  Problem read endpoints must never `include: { referenceAnswer }`.
- Every categorical field on `ReferenceAnswer` is a `primary` + `accepted[]`
  pair. When adding a field, follow that shape.
- `Attempt.breakdown` is a JSON snapshot of `GradedAttempt`. Add new grading
  output there, not as more columns, unless it needs to be queried.
- `CodexEntry` is keyed by `(kind, key)` = enum member; its slug is derived by
  `codexSlugFor()` in the grading service. Never hand-write a codex slug.
- Schema change → `npm run db:migrate -- --name <what-changed>` → commit the
  generated folder under `prisma/migrations/`. Do not hand-edit migrations
  after they have been applied.

## Seed data

- `prisma/seed-data/problems.ts` and `codex.ts` are data; `prisma/seed.ts` is
  the idempotent loader (upsert by slug / problemId, replace edge cases).
- Every problem needs a full reference answer: primary + accepted for all four
  categorical fields, `approachSummary` (what), `explanation` (why — name the
  signals in the statement), and 3–4 edge cases with **generous** lowercase
  `matchers` (synonyms, shorthand like `n == 0`, example inputs like `aaaa`).
- Every `AlgorithmicTechnique` and `DataStructure` member must have a codex
  entry so `codexLinks` never point at a 404. Adding an enum member means
  adding a codex entry.
- Re-run `npm run db:seed` after editing; it must stay safe to run twice.

## TypeScript

- `strict` + `exactOptionalPropertyTypes` + `noUncheckedIndexedAccess`. Optional
  DTO fields are typed `?: T | undefined`; convert `undefined` to `null` at the
  Prisma boundary.
- `noEmit` typecheck before committing: `npx tsc --noEmit -p tsconfig.json`.
- Comments explain *why*, in the style already present (short block comments
  above functions, `///` doc comments in the schema).

## Testing and verification

- `npm test` runs Vitest against the pure grader; no DB needed. Keep it that
  way — DB-dependent tests would need a separate setup.
- For endpoint changes, verify against a real Postgres: migrate, seed, start
  the server, curl. Report what you actually ran.

## Workflow

- Build in the order: schema → migration → scoring + tests → endpoints → seed.
  Commit at each milestone with a `feat(scope): summary` message and a body
  explaining the why.
- Genuinely ambiguous decisions: pick the simpler option, record it in
  `NOTES.md`, keep going.
- Push to `origin/main` only when tests pass and the typecheck is clean.
