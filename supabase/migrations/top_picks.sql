-- ============================================
-- KCMPICKS - Model top-picks tracking
-- Records every value bet the AI pipeline surfaces (from /api/ai/top-picks)
-- so we can measure real model win-rate / ROI and calibrate JEV_MARKET_SHRINK
-- against outcomes instead of by eye. Settled server-side against the
-- `games` table (status = 'post') by /api/ai/top-picks/settle.
-- ============================================

create table if not exists public.top_picks (
  id uuid primary key default gen_random_uuid(),
  -- ESPN event id — joins to games.id
  game_id text not null,
  sport text not null,
  home_team text not null,
  away_team text not null,
  commence_time timestamptz,

  -- What was bet
  bet_type text not null check (bet_type in ('moneyline', 'spread', 'total')),
  -- The side taken: home team name, away team name, "Over", "Under" or "Draw"
  side text not null,
  selection text not null,
  -- Signed home spread (spread bets) or the total line (totals); null for ML
  line numeric,
  odds integer not null,

  -- Model inputs at pick time (for calibration analysis)
  jev_probability numeric,
  fair_probability numeric,
  edge numeric,
  expected_value numeric,
  confidence int,

  -- Outcome
  status text not null default 'pending'
    check (status in ('pending', 'won', 'lost', 'push', 'void')),
  home_score int,
  away_score int,
  settled_at timestamptz,

  -- Dedupe + provenance
  run_id uuid,
  research_model text,
  jev_model text,
  created_at timestamptz not null default now(),

  unique (game_id, bet_type, side, run_id)
);

create index if not exists top_picks_status_idx on public.top_picks (status);
create index if not exists top_picks_created_at_idx on public.top_picks (created_at desc);

-- Public read (same pattern as games); writes go through the service role.
alter table public.top_picks enable row level security;

drop policy if exists "Public can read top_picks" on public.top_picks;
create policy "Public can read top_picks"
  on public.top_picks for select
  using (true);
