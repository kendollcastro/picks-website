-- ============================================
-- KCMPICKS - Public betting splits
-- Stores public betting percentages and handle (money) splits from external
-- sources such as Action Network or OddsTrader. One row per game per source.
-- The pipeline tries Action Network first and falls back to OddsTrader if A fails.
-- ============================================

create table if not exists public.betting_splits (
  id bigserial primary key,
  -- ESPN event id — joins to games.id
  game_id text not null,
  sport text not null,
  home_team text not null,
  away_team text not null,
  commence_time timestamptz,
  -- Source that provided the data
  source text not null check (source in ('actionnetwork', 'oddsTrader', 'teamrankings', 'sbr', 'manual')),
  -- Public bet percentages (what % of tickets are on each side)
  home_bet_pct numeric,
  away_bet_pct numeric,
  -- Public money / handle percentages
  home_money_pct numeric,
  away_money_pct numeric,
  -- Big bet / sharp splits when available
  home_big_bet_pct numeric,
  away_big_bet_pct numeric,
  -- Free-text notes, e.g. which sportsbook consensus was used
  notes text,
  -- Timestamps
  captured_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  -- One active row per game + source; older rows kept for history if desired,
  -- but the app reads the latest via created_at desc.
  unique(game_id, source)
);

-- Index for fast reads of the latest split per game.
create index if not exists idx_betting_splits_game_id on public.betting_splits(game_id, created_at desc);
create index if not exists idx_betting_splits_sport on public.betting_splits(sport, created_at desc);

-- Public read (same pattern as games/top_picks).
alter table public.betting_splits enable row level security;

drop policy if exists "Allow public read access to betting_splits" on public.betting_splits;
create policy "Allow public read access to betting_splits"
  on public.betting_splits
  for select
  to anon, authenticated
  using (true);

-- Update timestamp trigger.
create or replace function set_betting_splits_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_betting_splits_updated_at on public.betting_splits;
create trigger trg_betting_splits_updated_at
  before update on public.betting_splits
  for each row
  execute function set_betting_splits_updated_at();
