# KCMPICKS Security Remediation

**Date:** 2026-10-24  
**Scope:** `kcmpicks` Next.js app + `odds-scraper` Python service

---

## Critical Incident: Exposed Secrets

A file containing live secrets was discovered at `odds-scraper/.env`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (JWT valid until 2090)
- `NEXT_PUBLIC_ODDSPAPI_KEY`
- `OPENROUTER_API_KEY`
- `API_SPORTS_KEY`
- `ODDS_API_KEY`

### Immediate Actions Taken

1. `odds-scraper/.env` was deleted from the working directory.
2. Root `.gitignore` created to prevent `.env`, `.env.local`, `.venv`, `node_modules/`, and local data snapshots from being committed.
3. `odds-scraper/.env.example` created with placeholder values.

### Required User Actions

**Rotate every exposed key immediately**, even if this repo is not yet in git:

| Provider | Where to rotate |
|----------|-----------------|
| Supabase service-role key | Supabase Dashboard → Project Settings → API → Regenerate service_role key |
| Supabase anon key | Supabase Dashboard → Project Settings → API → Regenerate anon key |
| OpenRouter | https://openrouter.ai/keys → revoke old key, create new one |
| OddsPapi | https://oddspapi.com/ dashboard → regenerate key |
| The Odds API | https://the-odds-api.com/ dashboard → regenerate key |
| API-Sports | https://api-sports.io/ dashboard → regenerate key |

After rotating, set values in your shell or in a **non-committed** `.env.local` file:

```bash
# kcmpicks/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<new-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
ODDS_API_KEY=<new-odds-api-key>
ODDS_PAPI_KEY=<new-oddspapi-key>
OPENROUTER_API_KEY=<new-openrouter-key>

# odds-scraper/.env.local
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<new-service-role-key>
ODDS_API_KEY=<new-odds-api-key>
```

If `odds-scraper/.env` was ever committed to git, purge it from history with `git filter-repo` or BFG.

---

## Code Fixes Applied

### 1. API keys moved server-side

| Before | After |
|--------|-------|
| `NEXT_PUBLIC_ODDSPAPI_KEY` used directly in browser | New `/api/oddspapi` proxy + `ODDS_PAPI_KEY` server-only |
| `NEXT_PUBLIC_ODDS_API_KEY` used for historical odds in browser | New `/api/historical-odds` proxy + `ODDS_API_KEY` server-only |
| `/api/odds` fell back to `NEXT_PUBLIC_ODDS_API_KEY` | Now only accepts `ODDS_API_KEY` |
| `NEXT_PUBLIC_GEMINI_API_KEY` in `gemini-predictions.ts` | Renamed to server-only `GEMINI_API_KEY` |

### 2. Service-role isolation

- `src/lib/api/top-picks-settle.ts` no longer falls back to the anon key.
- `src/app/api/games/route.ts` no longer falls back to the anon key.

### 3. Supabase client hardening

- `src/lib/supabase/client.ts` now throws a clear error if env vars are missing instead of returning a dangerous `null` cast.

### 4. Dependency vulnerabilities

- Upgraded `next` from `16.2.2` to `16.4.3`.
- Ran `npm audit fix`; all 13 npm vulnerabilities are now resolved.

### 5. Build verification

- `npm run build` passes successfully after all changes.

---

## Additional Fixes Completed by Subagents

### 6. API route hardening

- Created `src/lib/api/auth.ts` with `requireAuth()` helper using Supabase server client.
- Added auth verification to:
  - `/api/ai/predictions`
  - `/api/ai/top-picks`
  - `/api/odds`
  - `/api/oddspapi`
  - `/api/historical-odds`
- Public read routes left open: `/api/games`, `/api/espn/scoreboard`.

### 7. Rate limiting

- Created `src/lib/api/rate-limit.ts` with in-memory per-key buckets.
- `/api/ai/predictions`: 30 requests/hour per user.
- `/api/ai/top-picks`: 10 requests/hour per user.
- Returns `429` with `Retry-After` header when exceeded.

### 8. Security headers & CORS

- Created `src/lib/api/cors.ts` helpers.
- Added global security headers in `next.config.ts`:
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`
  - `Strict-Transport-Security` in production
  - Permissive CSP for Next.js compatibility
- Added CORS headers for `/api/:path*`.

### 9. UI/data integrity

- `src/hooks/usePicks.ts`: `updatePickStatus`, `deletePick`, and `settlePicks` now filter by `user_id`.
- `src/lib/utils/index.ts`: added `sanitizeInput()` helper.
- `src/lib/api/jev-top-picks.ts` and `src/lib/api/jev-predictions.ts`: sanitize team names/sport/venue/recentForm before LLM prompts.
- `src/lib/api/jev-top-picks.ts`: safe JSON parsing for research LLM output; length-limited rationale strings.
- `src/app/(dashboard)/settings/page.tsx`: persists notification preferences to the new `profiles.notifications` JSONB column.
- `supabase/schema.sql` and `supabase/migrations/profiles_notifications.sql`: added `notifications JSONB` column.

---

## Security Posture After Remediation

| Control | Status |
|---------|--------|
| No real secrets in repo | ✅ |
| .gitignore protecting env files | ✅ |
| Paid API keys server-side | ✅ |
| Service-role key isolated | ✅ |
| Next.js patched (0 npm vulns) | ✅ |
| Per-route auth verification | ✅ |
| Rate limiting on AI routes | ✅ |
| Security headers/CORS | ✅ |
| LLM input/output sanitization | ✅ |
| Pick mutation defense-in-depth | ✅ |

---

## Future Recommendations

- Use a secret manager (e.g., 1Password Secrets Automation, Doppler, or Vercel/Supabase env vars) instead of local `.env` files.
- Enable Supabase RLS audit logging.
- Add automated dependency scanning (Dependabot / Snyk).
- Implement proper logging/monitoring for API abuse.
- Conduct periodic penetration testing of API routes.
