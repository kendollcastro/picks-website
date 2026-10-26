-- Migration: Create games table for scraped odds/scores (ESPN feed)
-- Run this in Supabase SQL Editor
--
-- One row = one game, holding the current pregame/live line from the
-- sportsbook ESPN displays (usually DraftKings) plus final scores once settled.
-- Written by odds-scraper (service_role); read by kcmpicks /api/games.

CREATE TABLE IF NOT EXISTS games (
  id TEXT PRIMARY KEY,                -- ESPN event id (stable across scrapes)
  sport VARCHAR(30) NOT NULL,         -- kcmpicks sport key: nba, nfl, mlb, nhl, soccer, college-football, ...
  league VARCHAR(50) NOT NULL,        -- ESPN league slug: nba, nfl, eng.1, usa.1, ...
  home_team VARCHAR(255) NOT NULL,
  away_team VARCHAR(255) NOT NULL,
  home_abbr VARCHAR(10),
  away_abbr VARCHAR(10),
  home_id VARCHAR(50),                -- ESPN team id
  away_id VARCHAR(50),
  home_logo TEXT,
  away_logo TEXT,
  commence_time TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'scheduled',  -- scheduled | in | post | postponed | cancelled
  home_score INTEGER,
  away_score INTEGER,
  venue VARCHAR(255),
  -- Odds snapshot (American integers; decimal lines for spread/total)
  provider VARCHAR(50),               -- e.g. DraftKings
  home_moneyline INTEGER,
  away_moneyline INTEGER,
  draw_moneyline INTEGER,             -- soccer 1X2
  spread DECIMAL(6,2),                -- home side line: -4.5 = home gives 4.5
  home_spread_odds INTEGER,
  away_spread_odds INTEGER,
  total DECIMAL(6,2),                 -- over/under line
  over_odds INTEGER,
  under_odds INTEGER,
  -- Opening lines: captured on first scrape and preserved for line-movement analysis
  opening_home_moneyline INTEGER,
  opening_away_moneyline INTEGER,
  opening_spread DECIMAL(6,2),
  opening_home_spread_odds INTEGER,
  opening_away_spread_odds INTEGER,
  opening_total DECIMAL(6,2),
  opening_over_odds INTEGER,
  opening_under_odds INTEGER,
  opening_odds_captured_at TIMESTAMPTZ,
  odds_captured_at TIMESTAMPTZ,
  -- Meta
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_games_sport_time ON games(sport, commence_time);
CREATE INDEX idx_games_status ON games(status);
CREATE INDEX idx_games_league ON games(league);

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Odds/scores are public data: allow read to everyone (anon + authenticated)
CREATE POLICY "Allow public read access to games" ON games
  FOR SELECT USING (true);

-- Allow insert/update to service role (for scraper)
CREATE POLICY "Allow service role to manage games" ON games
  FOR ALL USING (auth.role() = 'service_role');

-- Keep updated_at fresh on scraper upserts
CREATE OR REPLACE FUNCTION set_games_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_games_updated_at ON games;
CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION set_games_updated_at();

-- Preserve opening lines on first insert / update so line-movement analysis
-- always has the earliest captured price as reference.
CREATE OR REPLACE FUNCTION preserve_opening_lines()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.opening_home_moneyline := COALESCE(NEW.opening_home_moneyline, NEW.home_moneyline);
    NEW.opening_away_moneyline := COALESCE(NEW.opening_away_moneyline, NEW.away_moneyline);
    NEW.opening_spread := COALESCE(NEW.opening_spread, NEW.spread);
    NEW.opening_home_spread_odds := COALESCE(NEW.opening_home_spread_odds, NEW.home_spread_odds);
    NEW.opening_away_spread_odds := COALESCE(NEW.opening_away_spread_odds, NEW.away_spread_odds);
    NEW.opening_total := COALESCE(NEW.opening_total, NEW.total);
    NEW.opening_over_odds := COALESCE(NEW.opening_over_odds, NEW.over_odds);
    NEW.opening_under_odds := COALESCE(NEW.opening_under_odds, NEW.under_odds);
    NEW.opening_odds_captured_at := COALESCE(NEW.opening_odds_captured_at, NEW.odds_captured_at);
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.opening_home_moneyline := COALESCE(NEW.opening_home_moneyline, OLD.opening_home_moneyline, NEW.home_moneyline);
    NEW.opening_away_moneyline := COALESCE(NEW.opening_away_moneyline, OLD.opening_away_moneyline, NEW.away_moneyline);
    NEW.opening_spread := COALESCE(NEW.opening_spread, OLD.opening_spread, NEW.spread);
    NEW.opening_home_spread_odds := COALESCE(NEW.opening_home_spread_odds, OLD.opening_home_spread_odds, NEW.home_spread_odds);
    NEW.opening_away_spread_odds := COALESCE(NEW.opening_away_spread_odds, OLD.opening_away_spread_odds, NEW.away_spread_odds);
    NEW.opening_total := COALESCE(NEW.opening_total, OLD.opening_total, NEW.total);
    NEW.opening_over_odds := COALESCE(NEW.opening_over_odds, OLD.opening_over_odds, NEW.over_odds);
    NEW.opening_under_odds := COALESCE(NEW.opening_under_odds, OLD.opening_under_odds, NEW.under_odds);
    NEW.opening_odds_captured_at := COALESCE(NEW.opening_odds_captured_at, OLD.opening_odds_captured_at, NEW.odds_captured_at);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_games_preserve_opening_lines ON games;
CREATE TRIGGER trg_games_preserve_opening_lines
  BEFORE INSERT OR UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION preserve_opening_lines();
