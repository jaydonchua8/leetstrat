# NOTES

Deferred ideas and judgement calls. Read before changing the grader or schema.

## Needs revisiting

### Edge-case matching is brittle (highest priority)

Free-text edge cases are graded by normalised substring match against
hand-written `matchers` per edge case (`matchEdgeCases` in
`src/services/grading.service.ts`). Observed during verification: "what if
every char is the same?" missed "All characters identical" until "every char"
was added as a matcher. Any phrasing the seed author didn't anticipate is a
silent miss, and overly generous matchers ("zero", "same") will produce false
hits.

Mitigations in place: generous matcher lists, recall-only scoring (extra text
never penalised), and the lowest weight of any field (0.10 vs ≥ 0.15).

Options, roughly in order of effort:
1. Log every `edgeCasesText` that scored < 1 and mine them for missing
   matchers. Cheap and would fix most of it.
2. Stem/lemmatise both sides before matching (plurals, tenses).
3. Embedding similarity between each learner sentence and each edge case
   description, with a threshold. Removes the matcher lists entirely.
4. LLM grading of the edge-case field via `FeedbackProvider`-style interface.

### Complexity enum can't express O(n log m)

Koko Eating Bananas is O(n log M) where M = max pile; the closest enum member
is `O_N_LOG_N`. Coin Change is O(amount × coins) → `O_N_TIMES_M`. Either
extend `Complexity` (e.g. `O_N_LOG_M`) or accept the approximation and lean
on `explanation` to say so, as the seed currently does.

## Decisions made without asking (simpler option chosen)

- **Kept `User` + `UserCategoryStat` analytics** from the existing engine even
  though the brief lists only Problem/ReferenceAnswer/Attempt/CodexEntry. It
  was already built and tested, and per-tag accuracy is the "you over-apply
  DP" signal the product is about. `userId` stays in the request body; auth
  is still out of scope.
- **`accepted[]` on complexity too, not just DS/technique.** LC 3's space is
  O(1) if you count the bounded alphabet and O(n) if you don't; exact match
  would punish a defensible answer. Same shape for all four fields.
- **Single choice per field**, not multi-select. The brief says "primary data
  structure"; one door to open is the skill being trained. Alternatives are
  handled by `accepted[]`, not by letting the learner list several.
- **No filtering problems by technique.** `GET /problems` filters by
  difficulty only — filtering by pattern hands over the answer.
- **Edge cases replaced wholesale on re-seed** rather than upserted, because
  they have no natural key and nothing references them after grading
  (attempts snapshot their breakdown).
- **Kept `POST /api/attempts/submit`** (existing path) rather than moving to
  `POST /api/attempts`.
- **Codex slugs are derived, not stored as data**, so the grader can emit
  links without a DB call and the seed can't drift.
- **One codex entry per enum member** (36 total) rather than just the five
  brief patterns, so an over-applied link always resolves.

### Frontend session

- **Demo user id lives in the nav + localStorage.** There is no users
  endpoint and adding one was out of scope. `VITE_DEMO_USER_ID` pre-fills it.
- **Stats only show right after a submit.** `POST /attempts/submit` returns
  `stats`; `GET /attempts/:id` doesn't. The submit response is kept in memory
  (`web/src/lastSubmit.ts`) so the fresh result page shows stats; a reload
  loses them. A `GET /users/:id/stats` endpoint would fix this properly.
- **Hash routing, not history routing.** Avoids a server-side SPA fallback;
  Express only serves `/`.
- **Statement renderer is ~30 lines, not a markdown library.** The seed's
  format (paragraphs, `- ` bullets, backticks) is ours to control.
- **Vite pinned to 5, `@vitejs/plugin-react` to 4** because vitest 2 peers on
  Vite 5. Upgrade both together with vitest.
- **Edge-case rendering says "matched on …"** so learners can see the phrase
  matching is literal. Pairs with the brittleness note above.

## Out of scope this session (noted, not built)

- Dungeon / boss fights / any gamification layer. Natural hook if built later:
  `UserCategoryStat.mastery` is already computed per tag.
- Code editor or judge. The whole point is to stop before code.
- Real LLM feedback. `FeedbackProvider` interface is ready; wire the Anthropic
  SDK there and gate it on `!isFullyCorrect` to save tokens.
- Auth. `userId` in the body is a placeholder for `req.user.id`.
- Pagination on list endpoints (12 problems / 36 entries don't need it yet).
- Spaced repetition / "next problem for you" — would use `weakestCategories`.
- Problem-level hints before submitting (e.g. reveal only the technique).
