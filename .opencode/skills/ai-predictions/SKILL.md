---
name: ai-predictions
description: KCMPICKS prediction engine, ensemble model, ML weights, Jev/OpenRouter AI, and prediction-service API. Use when working on AI predictions, recommendation logic, model weights, confidence/value ratings, or the AI assistant.
---

# KCMPICKS — Prediction & AI

There are two distinct prediction stacks in the repo — know which one a page/hook uses before changing behavior.

## 1. Ensemble engine — `src/lib/api/prediction-service.ts` (used by `usePredictions.ts`, `useGamePrediction`)

`generatePrediction(game, homeStats?, awayStats?, h2h?, historical?)` → `PredictionResult` with three sub-models + ensemble + best pick:

- **Odds model** (`predictFromOdds`): removes vig via `removeVig`, computes home fair odds + edge.
- **Stats model** (`predictFromStats`): blend of win%, last-5 form, rest-days bonus, home record advantage, H2H — each with fixed weights, +50% base, normalized.
- **ML model** (`predictML`): simplified feature vector (`impliedProb`, seeded "team name" feature, `paceFactor`, `recentForm`, `playoffPressure`) multiplied by hardcoded `weights`; labels itself `'GradientBoost'` — **it is not a trained model**.
- **Ensemble** (`createEnsemble`): dynamic weights (default 0.4/0.3/0.3; re-balances if one model shows >30 form rating or >70 confidence). Consensus = majority vote of model picks when confidence > 20.
- **Best pick** (`selectBestPick`): EV comparison (moneyline first, then spread) → `RecommendedPick { type, selection, odds, probability, expectedValue, riskLevel }`.
- `formatPredictionForUI(...)` → shape used by cards (pickString, confidenceStars, analyses).

## 2. Legacy engine — `src/lib/api/predictions.ts`

`PredictionEngine` class (odds→implied, removeVig, value rating 1–5, `.predict()` / `.predictBatch()`) + `fetchPredictions(sport)` that reads ESPN scores with default `-110` odds. **Not wired to the main UI** — exported from `lib/api/index.ts`, kept for reference/back-compat. Don't extend it unless asked; prefer the ensemble service.

## Heuristic helper — `useLiveData.ts` `generatePrediction`

Local, odds-only probability with +3% home advantage and a valueRating derived from `|prob − 50|` thresholds. Used by dashboard "AI Predictions" section. Different from both engines above.

## Weights & config

`PREDICTION_WEIGHTS` (in `src/lib/api/config.ts`): homeAdvantage 0.03, recentForm 0.25, headToHead 0.15, oddsMovement 0.20, injuries 0.15, restDays 0.05, travelDistance 0.03, weather 0.04, motivation 0.10. **These are informational** — the engines hardcode their own weights internally, so editing the config constant does not change predictions. To tune the model, edit `prediction-service.ts` (ensemble) or `ml-predictions.ts` (helpers `americanToImplied`, `removeVig`).

## Jev AI (TypeSafe System One via OpenRouter)

Requires `OPENROUTER_API_KEY` **server-side** (set in `.env.local`). Never read it in a client component; hooks import types with `import type`. Unauthenticated `/api/*` requests get a JSON **401** from `src/middleware.ts` (not a login redirect). Two endpoints:

### Batch pipeline — `src/lib/api/jev-top-picks.ts` → `POST /api/ai/top-picks` → `useTopPicks.ts` (the main feature, "Jev Top Picks" on `/picks`)

Three layers per game (max 12 games, 4 in parallel):

1. **Research** — `POST /api/v1/chat/completions`, model `OPENROUTER_RESEARCH_MODEL` (default `anthropic/claude-sonnet-5`, ~$0.005–0.017/game, ~10s). Response often comes wrapped in ```` ```json ```` fences despite `response_format: json_object` → fences are stripped before `JSON.parse`. Failure is non-fatal (profile falls back to `null`).
2. **Jev Decisions** — `POST https://openrouter.ai/api/alpha/decisions`, model `~typesafe/jev-latest` (resolves to `typesafe/jev-1.13-*`, ~$0.00004/req). `state` = market moneyline/spread/total + `team_ratings` (supabase **service role** query on ESPN-derived ratings) + research profile; `questions` = `winner` (choice), `situational_edge` (score −2..+2), `home_covers`/`total_over` (noul, only when odds quote a line). No generated text — rationale is assembled deterministically.
3. **Value engine** — devig two-way moneyline (`devigTwoWay`), compare Jev prob vs fair → `edge` (pts), `expectedValue`, `valueBet` (`EV >= minEv` default **3%** and `p >= 0.5`); spreads/totals assumed −110 when the source omits the price (`oddsAssumed` flag). Ranked by EV, `limit` default 5.

**Calibration gotcha:** Jev's `winner.probabilities` saturate to `0/1` whenever records/ratings separate the teams (instructions asking for 0.05–0.95 don't fix it). Layer 3 therefore blends: `p = fair + α·(p_jev − fair)` with `α = JEV_MARKET_SHRINK` (default **0.4**; `1` = raw Jev). `ValueCandidate.rawJevProbability` keeps the unblended value and the rationale prints the blend when it moves >1.5pts.

Result: `TopPicksResult { picks, analyzed, gamesWithoutOdds, models, costs, minEv, shrink, generatedAt }`. Costs for one 3-game run with research ≈ **$0.016** (research) + $0.0001 (Jev).

### Single game — `src/lib/api/jev-predictions.ts` → `POST /api/ai/predictions` → `useAIPrediction.ts`

Older one-game endpoint with the same Decisions API. **No component currently calls it** (the `/picks` page uses the batch pipeline) — kept for reference.

- Pricing (verified 2026-09): Decisions ~$0.00002–0.00004/request, chat research ~$0.006/call.
- **Do not** call either API from the browser. If the page stops returning picks, check `OPENROUTER_API_KEY`, then `curl -X POST /api/ai/top-picks` with a session cookie.
- Legacy: `src/lib/api/gemini-predictions.ts` (Gemini, `NEXT_PUBLIC_GEMINI_API_KEY`) is **no longer wired in** — kept as reference; delete when convenient.

## Feature data caveats

- `fetchTeamStats` in `usePredictions.ts` queries a non-existent `team_stats` Supabase table, then falls back to **seeded deterministic stats** (name-hash). Predictions look real but are partly synthetic.
- Historical odds for training come from `useHistoricalOdds` (The Odds API historical endpoint) — subject to the missing `NEXT_PUBLIC_ODDS_API_KEY` bug (see `sports-data` skill).

## Tuning guardrails

- Never present synthetic/seeded data as "trained on 10+ years" in UI copy. Landing page currently hardcodes flattering stats (82%, 10k users) — flag before propagating.
- Keep American-odds math consistent: positive `odds` → `+stake·odds/100`; negative → `+stake·100/|odds|` (`calculatePayout` in `usePicks.ts`).