-- Add opening-line columns + trigger to games for line-movement tracking.
-- Run this in Supabase SQL Editor if the games table already exists.

ALTER TABLE public.games
ADD COLUMN IF NOT EXISTS opening_home_moneyline INTEGER,
ADD COLUMN IF NOT EXISTS opening_away_moneyline INTEGER,
ADD COLUMN IF NOT EXISTS opening_spread DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS opening_home_spread_odds INTEGER,
ADD COLUMN IF NOT EXISTS opening_away_spread_odds INTEGER,
ADD COLUMN IF NOT EXISTS opening_total DECIMAL(6,2),
ADD COLUMN IF NOT EXISTS opening_over_odds INTEGER,
ADD COLUMN IF NOT EXISTS opening_under_odds INTEGER,
ADD COLUMN IF NOT EXISTS opening_odds_captured_at TIMESTAMPTZ;

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

DROP TRIGGER IF EXISTS trg_games_preserve_opening_lines ON public.games;
CREATE TRIGGER trg_games_preserve_opening_lines
  BEFORE INSERT OR UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION preserve_opening_lines();
