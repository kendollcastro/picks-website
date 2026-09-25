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

- Server module: `src/lib/api/jev-predictions.ts` — calls the **OpenRouter Decisions API** (`POST https://openrouter.ai/api/alpha/decisions`, model `~typesafe/jev-latest`). It sends a `state` + typed `questions` (choice winner + noul edge) and maps the structured answers to a `JevPrediction` (pick, confidence, home/away probabilities, edge vs moneyline implied, EV). Jev returns **no generated text** — `reasoning`/`factors` are synthesized deterministically from the answers.
- Route: `src/app/api/ai/predictions/route.ts` (POST) — keeps `OPENROUTER_API_KEY` **server-side** only. Never read it in a client component; the hook imports the types with `import type`.
- Hook: `src/hooks/useAIPrediction.ts` — POSTs the `JevContext` (`{ homeTeam, awayTeam, sport, homeOdds, awayOdds, + Massey ratings/wins/losses }`) to `/api/ai/predictions` and returns the `JevPrediction`.
- Requires `OPENROUTER_API_KEY` (server-side) — currently **empty** in `.env.local`, so the route returns 502 until set. Get one at https://openrouter.ai/keys.
- Free/early-access pricing: output tokens free, input paid (typically < $0.00002/game), 32k context.
- **Do not** call the Decisions API from the browser. If a page stops returning predictions, verify the key, then check the route responds at `/api/ai/predictions`.
- Legacy: `src/lib/api/gemini-predictions.ts` (Gemini, `NEXT_PUBLIC_GEMINI_API_KEY`) is **no longer wired in** — kept as reference; delete when convenient.

## Feature data caveats

- `fetchTeamStats` in `usePredictions.ts` queries a non-existent `team_stats` Supabase table, then falls back to **seeded deterministic stats** (name-hash). Predictions look real but are partly synthetic.
- Historical odds for training come from `useHistoricalOdds` (The Odds API historical endpoint) — subject to the missing `NEXT_PUBLIC_ODDS_API_KEY` bug (see `sports-data` skill).

## Tuning guardrails

- Never present synthetic/seeded data as "trained on 10+ years" in UI copy. Landing page currently hardcodes flattering stats (82%, 10k users) — flag before propagating.
- Keep American-odds math consistent: positive `odds` → `+stake·odds/100`; negative → `+stake·100/|odds|` (`calculatePayout` in `usePicks.ts`).