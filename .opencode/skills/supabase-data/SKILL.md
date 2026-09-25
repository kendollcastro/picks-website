---
name: supabase-data
description: KCMPICKS Supabase schema, Row Level Security, auth, and data-access patterns. Use when writing or fixing database queries, migrations, RLS policies, auth flows, or anything touching the picks/profiles tables.
---

# KCMPICKS — Supabase Data Layer

Source of truth for schema: `supabase/schema.sql`. Migrations live in `supabase/migrations/` (community-contributed, e.g. `team_ratings.sql`).

## Clients

- **Browser:** `createClient()` from `@/lib/supabase/client` → `createBrowserClient` (singleton).
- **Server:** `createClient()` from `@/lib/supabase/server` → `createServerClient` with cookie store. Must be awaited (`await createClient()`), it's async.
- **Middleware:** its own `createServerClient` in `src/middleware.ts` (handles `getAll`/`setAll` cookies + session refresh + route guards).

## Schema

### `profiles`
| col | type | notes |
|---|---|---|
| id | uuid PK | FK → `auth.users` ON DELETE CASCADE; equals `auth.uid()` |
| username | text UNIQUE NOT NULL | auto-created by `handle_new_user` trigger (`user_<8 first id chars>` fallback) |
| avatar_url, created_at, updated_at | | |

> Profile is the user concept in this app: `profile.id === user.id`. `UserContext` keeps both in sync.

### `picks`
| col | type | notes |
|---|---|---|
| id | uuid PK | `uuid_generate_v4()` |
| user_id | uuid NN FK → profiles | indexed |
| sport | text CHECK | `nba, nfl, mlb, soccer, ufc, college-football, college-basketball, womens-basketball` |
| match_name | text NN | convention: `"${away_team} @ ${home_team}"` (built in `usePicks`) |
| pick_type | text CHECK | `moneyline, spread, total, prop, parlay` |
| selection | text NN | e.g. `"LAL +3.5"`, `"Over 215.5"`, `"Team ML"` |
| odds | int (American) | positive = underdog, negative = favorite |
| stake / potential_payout | numeric(10,2) | payout calc in `usePicks.createPick` / `calculatePayout` |
| confidence | int 1–5 | |
| status | text CHECK | `pending, won, lost, push, void` |
| home_team / away_team | text NN | needed for auto-settlement matching |
| home_score / away_score / settled_at / notes / game_date / match_id | | |

### `user_achievements`
`id, user_id→profiles, achievement_id, unlocked_at`, UNIQUE(user_id, achievement_id). Achievement defs in `src/lib/constants/sports.ts` (`ACHIEVEMENTS`).

### `leaderboard` (view)
Aggregation query over profiles+picks: total_picks, wins, losses, win_rate, profit. Note: it's a SQL view, not a table — `select from('leaderboard')` works.

## RLS — each table is owner-scoped

- `profiles`: own row only (SELECT/INSERT/UPDATE), `auth.uid() = id`
- `picks`: own picks only (`auth.uid() = user_id`) for SELECT/INSERT/UPDATE/DELETE
- `user_achievements`: own only

**Consequence:** every client query MUST filter/include `user_id = user.id` (hooks already do). A plain `select('*')` without auth returns zero rows, not an error. Service-role key bypasses RLS (server-only; never expose `SUPABASE_SERVICE_ROLE_KEY` to the client).

## Auth

- Email + Google providers. Auto-creates the profile row via `on_auth_user_created` trigger → `public.handle_new_user()`.
- Fetch current user: `(await supabase.auth.getUser()).data.user` (client or server). React to session changes via `supabase.auth.onAuthStateChange` (see `UserContext.tsx`).

## Known gaps / hazards

- 🔴 `usePicks.ts` queries a `pick_stats` table (`supabase.from('pick_stats')`) that does **not** exist in `schema.sql`. It's wrapped in try/catch and warns — never rely on it; remove or define it.
- 🔴 `usePredictions.ts` queries `team_stats` table for `fetchTeamStats` — NOT in `schema.sql` either (silently falls back to seeded fake stats). Same caveat.
- Mind that a supabase method returning no rows ≠ error; check `data` length. `Result` is `{ error }` when the operation failed, `data` when it succeeded (possibly empty).
- When adding tables/migrations: RLS must be enabled + policies written for every new table, or client queries will 403/return nothing.