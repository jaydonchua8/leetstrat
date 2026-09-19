# LeetStrat — Training Ground

LeetStrat trains the step most DSA practice skips: reading a problem and
knowing which approach to reach for, *before* writing any code. You are shown a
LeetCode-style statement, you commit to a data structure, a technique, time and
space complexity, and the edge cases you would watch for — then you are graded
against a reference answer and pointed at the Codex entry for whatever you
missed.

## Stack

Node.js · TypeScript · Express · Prisma · PostgreSQL · Zod · Vitest

## Running it

Prerequisites: Node 20+, a PostgreSQL server you can create a database on.

```bash
npm install
cp .env.example .env            # set DATABASE_URL to your Postgres
npm run db:migrate              # creates the DB if needed and applies prisma/migrations
npm run db:seed                 # 12 problems, 36 codex entries, one demo user
npm run dev                     # http://localhost:3000
```

`db:seed` prints the demo `userId` — you need it to submit attempts (auth is
out of scope; see Known gaps). The seed is idempotent, so re-run it freely
after editing `prisma/seed-data/`.

Tests (pure grading module, no database needed):

```bash
npm test
```

Other scripts: `npm run build` (tsc → `dist/`), `npm start`, `npm run db:studio`.

## The loop, as HTTP

```bash
# 1. Browse problems (statement only — the answer key is never on this path)
curl 'localhost:3000/api/problems?difficulty=MEDIUM'
curl  localhost:3000/api/problems/koko-eating-bananas        # by slug or id

# 2. Commit to an approach before coding
curl -X POST localhost:3000/api/attempts/submit \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "<userId from seed>",
    "problemId": "<id from the problem response>",
    "selectedDataStructure": "HASH_SET",
    "selectedTechnique": "SLIDING_WINDOW",
    "selectedTimeComplexity": "O_N",
    "selectedSpaceComplexity": "O_1",
    "edgeCasesText": "empty string, all the same character, symbols and spaces"
  }'

# 3. Revisit a scored result later
curl localhost:3000/api/attempts/<attemptId>

# 4. Read up on what you missed
curl 'localhost:3000/api/codex?kind=TECHNIQUE'
curl  localhost:3000/api/codex/technique-sliding-window
```

Valid enum values for the submit body are in `prisma/schema.prisma`
(`DataStructure`, `AlgorithmicTechnique`, `Complexity`).

### What a result contains

- `breakdown` — per field: what you picked, the primary answer, the accepted
  alternatives, and whether you were right. Complexity misses say whether you
  over- or under-estimated. Edge cases list each reference case, whether your
  text mentioned it, and the phrase that matched.
- `score` — weighted partial credit in [0, 1] (weights in
  `src/services/grading.service.ts`).
- `reference.explanation` — *why* the intended approach is the intended one:
  the signals in the statement you should have keyed on.
- `codexLinks` — the Codex entries for the intended technique and data
  structure, plus whatever you wrongly reached for (`reason: "OVER_APPLIED"`).
- `stats` (submit only) — your running per-tag accuracy, so "you over-apply
  DP" shows up as data.

## Layout

```
prisma/
  schema.prisma          Models + enums (single source of truth for the taxonomy)
  migrations/            Prisma migrations
  seed.ts                Idempotent loader
  seed-data/problems.ts  12 problems with reference answers + edge cases
  seed-data/codex.ts     One codex entry per technique / data structure
src/
  types/index.ts         Re-exported enums, DTOs, grading + analytics types
  lib/                   Prisma singleton, typed AppError classes
  validation/            Zod schemas for request bodies and query strings
  services/
    grading.service.ts   Pure grading — no I/O, unit tested
    analytics.service.ts Per-tag stat upserts and accuracy rollups
    feedback.service.ts  FeedbackProvider interface + deterministic stub
    attempt.service.ts   Orchestration (load key -> grade -> feedback -> persist)
    problem.service.ts   Statement reads (never joins the answer)
    codex.service.ts     Codex reads + link resolution
  controllers/           Thin HTTP adapters (parse -> service -> envelope)
  routes/                Router wiring
  middleware/            Central error handler
  app.ts / server.ts     Express app + lifecycle
```

## Design notes

**Enums live in `schema.prisma` and are re-exported by `src/types`.** Writing
them twice guarantees drift.

**The answer key is a separate table.** `Problem` holds the statement;
`ReferenceAnswer` holds the truth. The problem endpoints cannot leak the
answer without an explicit `include`, rather than relying on every query to
remember a `select`.

**Every categorical field is `primary` + `accepted[]`.** Two Pointers on a
Sliding Window problem is defensible; so is O(n) space for a set bounded by
the ASCII alphabet. The grader accepts alternatives but reports misses and
directions against the canonical answer, and flags `isAlternative` so the UI
can say "correct, though the usual name for this is X".

**Edge cases are free text.** Each reference edge case carries a list of
lowercase matcher phrases; the learner's text is normalised and checked for
any substring hit. Only recall is scored — unrecognised text is never
penalised. This is the weakest part of the grader (see `NOTES.md`), which is
why it carries the lowest weight.

**Grading is a pure function.** `gradeAttempt(input, key)` has no I/O, so the
tests need no Postgres.

**Attempts snapshot their breakdown.** `GET /attempts/:id` returns what the
learner saw at the time, even if the reference answer is edited later.

**Analytics is scored per tag, not per attempt.** A wrong pick counts against
both the tag you missed and the tag you over-applied.

**The LLM call happens outside the transaction.** Feedback is currently a
deterministic stub; a real provider plugs into `FeedbackProvider` and must
degrade to `null` on failure, never a 500.

## Known gaps

1. **No auth.** `userId` comes from the request body. Fix before you have more
   than one user.
2. **Edge-case matching is substring-based.** Synonyms the seed didn't
   anticipate are misses. See `NOTES.md`.
3. **`buildAccuracyStats` reads every stat row per submission.** Fine at small
   scale.
4. **Feedback is generated even when the attempt is perfect.**
