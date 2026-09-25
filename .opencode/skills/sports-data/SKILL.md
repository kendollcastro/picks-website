---
name: sports-data
description: KCMPICKS sports data sources, API keys, hook usage, sport-key mappings, and mock-fallback behavior. Use when working on live scores, odds, schedules, team assets, or any ESPN/Odds API integration.
---

# KCMPICKS — Sports Data & APIs

Live data comes from free APIs and falls back to mock data when they fail or lack keys. API metadata lives in `src/lib/api/config.ts` (`API_CONFIG`, `SPORTS_CONFIG`, `CACHE_DURATION`).

## Data sources

| Source | Base URL | Key | Used for |
|---|---|---|---|
| ESPN (unofficial) | `site.api.espn.com/apis/site/v2/sports` | none | live scoreboards — **primary** (`.scoreboard` endpoint) |
| The Odds API | `api.the-odds-api.com/v4` | `NEXT_PUBLIC_ODDS_API_KEY` | odds/lines, historical |
| OddsPapi | `api.oddspapi.io/v4` | `NEXT_PUBLIC_ODDSPAPI_KEY` | odds in `usePredictions.ts` (primary there) |
| API-Sports / Football-API | `vX.*.api-sports.io` | `API_SPORTS_KEY` / `FOOTBALL_API_KEY` | stats (not wired into UI) |
| TheSportsDB / BallDontLie / Si API / OpenLigaDB | | | team logos, assets (partial wiring) |

## Sport → API key mappings (keep in sync)

ESPN path (`.espnKey`) vs The Odds key (`.oddsKey`):
`nba`→`basketball/nba` / `basketball_nba`; `nfl`→`football/nfl` / `americanfootball_nfl`; `mlb`→`baseball/mlb` / `baseball_mlb`; `soccer`→`soccer` / `soccer_epl`; `ufc`→`mma/ufc` / `mma_mixed_martial_arts`; `college-football`→`football/college-football` / `americanfootball_ncaaf`; `college-basketball`→`basketball/mens-college-basketball` / `basketball_ncaab`; `womens-basketball`→`basketball/wnba` / `basketball_wncaab`.

> ⚠️ `useLiveData.ts` sports keys omit `womens-basketball` for odds (undefined → mock). And its NBA/college-basketball keys use new-style enum names (e.g. `basketball_wncaab`), while `config.ts` uses old names — verify against The Odds API docs when touching.

## Hooks (client-side, `src/hooks/`)

- `useLiveData(sport)` → `{ games, loading, refresh }` — ESPN scoreboard, filters to today/live (`isGameToday`/`isLive`), polls every 30s. Returns `LiveGame[]`.
- `useOdds(sport)`, `useEnhancedOdds(sport)`, `useHistoricalOdds(sport, days)` → `GameOdds[]`/`EnhancedGameOdds[]`/`HistoricalOdds[]`; polls every 60s. Filtered with `!isGameInFuture(odd.gameTime)`.
- `usePredictions(sport)` → odds via OddsPapi → fallback The Odds API → `generatePrediction` (ensemble model), polls every 60s; sorted by edge.
- `useGamePrediction(home, away, homeOdds, awayOdds, sport)` → single-game result.

Polling intervals are hardcoded in each hook (30/60/90s). `CACHE_DURATION` in config.ts is NOT actually applied — real intervals live in the hooks.

## Known bug — The Odds API never loads

`process.env.NEXT_PUBLIC_ODDS_API_KEY` (read in `config.ts`, `useLiveData.ts:401/495/623`, `usePredictions.ts:168`) is **not present** in `.env.local`; the file only defines `NEXT_PUBLIC_ODDSPAPI_KEY`. Result: The Odds API always falls back to mock odds. Fix (when authorized): add `NEXT_PUBLIC_ODDS_API_KEY` to `.env.local` (The Odds API key), or unify on one variable name across `config.ts` + both hooks.

## Fallback strategy (by design)

- Every API layer catches its own errors and logs via `console.warn/error`.
- Mock generators: `getMockGames(sport)` / `getMockOdds(sport)` in `useLiveData.ts` (realistic-looking sample games/odds + `bookmaker: 'Mock Data'`).
- Failure path **must** return the mock/empty data — never throw to the UI. When live data can't be fetched, tests/UIs still work with mocks.

## Time handling (recent fixes)

- Game dates are ISO timestamps. The repo deliberately parses as UTC then formats in Eastern time (`src/lib/utils` `formatGameTime`/`formatGameDate`, `isGameToday`, `isGameInFuture`). Keep the "today vs future" split: scheduled cards = today's scheduled games; `!isGameInFuture` = hide upcoming future games.
- When touching date logic, preserve UTC parsing + Eastern display or scores will show wrong days/times.

## Assets & logos

- Team assets: `src/lib/api/assets.ts` (`ESPNTeamAssets`, `TheSportsDBAssets`, `getTeamLogoWithFallback`, `getSportIcon`). Images rendered with `next/image unoptimized` (no remote pattern added).
- If you add `next/image` with a new host, you must update `next.config.ts` `images.remotePatterns` — currently none configured.