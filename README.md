# LeetStrat — Core Engine

Backend for practicing the *conceptual strategy* of LeetCode problems: pick the
data structure, technique, complexity, and edge cases before writing any code.

## Stack

Node.js · TypeScript · Express · Prisma · PostgreSQL · Zod · Vitest

## Layout

```
prisma/
  schema.prisma          Models + enums (single source of truth for the taxonomy)
  seed.ts                One demo user, two problems with ground truth
src/
  types/index.ts         Re-exported enums, DTOs, grading + analytics types
  lib/                   Prisma singleton, typed AppError classes
  validation/            Zod schema for the submit payload
  services/
    grading.service.ts   Pure grading — no I/O, unit tested
    analytics.service.ts Per-tag stat upserts and accuracy rollups
    feedback.service.ts  FeedbackProvider interface + LLM placeholder
    attempt.service.ts   Orchestration (load key -> grade -> feedback -> persist)
  controllers/           Thin HTTP adapters
  routes/                Router wiring
  middleware/            Central error handler
  app.ts / server.ts     Express app + lifecycle
```

## Setup

```bash
npm install
cp .env.example .env          # point DATABASE_URL at your Postgres
npx prisma migrate dev --name init
npm run db:seed               # prints a userId and problemIds to test with
npm run dev
```

## Try it

```bash
curl -X POST http://localhost:3000/api/attempts/submit \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "<userId from seed>",
    "problemId": "<problemId from seed>",
    "selectedDataStructures": ["STRING", "HASH_SET"],
    "selectedTechniques": ["SLIDING_WINDOW"],
    "selectedTimeComplexity": "O_N",
    "selectedSpaceComplexity": "O_N",
    "selectedEdgeCaseIds": []
  }'
```

## Design notes

**Enums live in `schema.prisma` and are re-exported by `src/types`.** Writing
them twice guarantees drift.

**Grading is a pure function.** `gradeAttempt` takes an input and an answer key
and returns a result — no database, so it's unit-testable without Postgres.

**Analytics is scored per tag, not per attempt.** Every ground-truth tag the
user missed counts against that tag, and every tag they selected that wasn't in
the answer counts as a false positive for *that* tag. This is what surfaces
"you over-apply Sliding Window," which a pass/fail-per-attempt metric can't see.

**The LLM call happens outside the transaction.** Holding a Postgres
transaction open across a multi-second network call will exhaust the pool.
Feedback failures degrade to `null`, never a 500.

## Known gaps

1. **No auth.** `userId` comes from the request body, so anyone can submit as
   anyone. Fix before you have more than one user.
2. **`buildAccuracyStats` reads every stat row per submission.** Fine at small
   scale; move the weakest/strongest ranking to a cached read or materialized
   view under real traffic.
3. **Exact-set matching on techniques is harsh.** Two Pointers vs Fast/Slow
   Pointers is genuinely arguable on some problems. Consider an
   `acceptableAlternatives` mapping on `Problem`.
4. **Feedback is generated even when the attempt is perfect**, burning tokens
   for little value. Gate it on `!isFullyCorrect`.
