---
name: kcmpicks-stack
description: KCMPICKS project conventions, stack, architecture, and environment variables. Use when working anywhere in this repo to know the stack, folder layout, key files, env-var names, and Next.js 16 constraints before writing or editing code.
---

# KCMPICKS — Stack & Conventions

Sports betting tracker. Read the relevant `node_modules/next/dist/docs/` guide before writing any Next.js code — this repo runs Next.js 16.2.2 (App Router) with breaking changes vs. older versions.

## Stack

- **Framework:** Next.js 16.2.2 (App Router), React 19.2.4, TypeScript 5
- **Styling:** Tailwind CSS v4 + `clsx`/`tailwind-merge` via `cn()` (see `src/lib/utils`)
- **DB/Auth:** Supabase (`@supabase/ssr` + `@supabase/supabase-js`)
- **UI libs:** framer-motion (animations), recharts (charts), lucide-react (icons)
- **State:** zustand installed; **React Query (@tanstack/react-query) is installed but NOT used** — data fetching is done with plain hooks + useState/useEffect. Keep that pattern unless explicitly asked to migrate.

## Commands

- `npm run dev` — dev server (port 3000)
- `npm run build` / `npm run start` — production
- `npm run lint` — eslint

## Folder map

```
src/app/(auth)/          # login, register routes
src/app/(dashboard)/     # dashboard, picks, live, stats, profile, settings, sports
src/app/page.tsx         # marketing landing (hardcoded showcase stats)
src/components/ui/       # Avatar, Badge, Button, Card, Icon, Input (design-system primitives)
src/components/layout/   # Sidebar, TopAppBar, BottomNavbar, FloatingActionButton, NotificationsPanel
src/contexts/UserContext.tsx
src/hooks/               # usePicks, useLiveData, usePredictions, useMasseyRatings, useAIPrediction, useAgents
src/lib/supabase/        # client.ts (browser) + server.ts (server components/RSC)
src/lib/api/             # config, odds, scores, assets, predictions, prediction-service, ml-predictions, gemini-predictions
src/lib/agents/          # AI assistant agents system
src/types/               # shared TS types
supabase/schema.sql      # full DB schema (profiles, picks, user_achievements, leaderboard view, RLS, triggers)
design/                  # "Digital Arena" design-system screenshots + HTML specs
```

## Design system — "Digital Arena"

- Fonts: **Space Grotesk** (headlines) + **Inter** (body) — applied via CSS vars in `src/app/layout.tsx`
- Palette (Tailwind theme tokens in `globals.css`): `primary #0066FF`, `tertiary #00e479`, `surface #131318`
- **Mobile-first** with bottom navigation, glassmorphism (`glass-card`), FloatingActionButton
- Use `font-['Space_Grotesk']` for headings, `font-body` for copy. Dark theme always on (`<html class="dark">`).
- Match the `design/` folder reference screens for layout guidance.

## Environment variables (`.env.local`) — IMPORTANT

| Variable | Used by | Status |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | supabase clients | ✓ set |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | supabase clients | ✓ set |
| `SUPABASE_SERVICE_ROLE_KEY` | (server-only use; never expose) | ✓ set |
| `NEXT_PUBLIC_ODDSPAPI_KEY` | `usePredictions.ts` (OddsPapi) | ✓ set |
| `NEXT_PUBLIC_ODDS_API_KEY` | `config.ts`, `useLiveData.ts` (The Odds API) | ✗ **NOT in .env.local — KNOWN BUG** |
| `API_SPORTS_KEY` | `config.ts` | ✓ set |
| `NEXT_PUBLIC_GEMINI_API_KEY` | `gemini-predictions.ts` | ✗ empty |
| `BALLDONTLIE_KEY`, `FOOTBALL_API_KEY` | `config.ts` | ✗ empty |

> ⚠️ `.env.local` is committed to git (includes secrets). Do not commit new secrets; flag if you touch it.
> Choose the correct env-var name per file — the codebase mixes `NEXT_PUBLIC_ODDSPAPI_KEY` and `NEXT_PUBLIC_ODDS_API_KEY` (see `sports-data` skill for the fix).

## Architecture notes

- **All pages are client components** (`'use client'`); pages fetch their own data in hooks. Server components only used for layout.
- Route protection lives in `src/middleware.ts` (session refresh + redirect to `/login`).
- From `src/lib/api/index.ts` re-export the domain services (odds, scores, assets, predictions).
- `profile` is `{ id, username, avatar_url, created_at }` and a user's `id === profile.id` (FK to `auth.users`).