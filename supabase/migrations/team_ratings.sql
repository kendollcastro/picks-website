-- Migration: Create team_ratings table for Massey Ratings
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS team_ratings (
  id SERIAL PRIMARY KEY,
  sport VARCHAR(50) NOT NULL,
  team_id VARCHAR(100) NOT NULL,
  team_name VARCHAR(255) NOT NULL,
  conference VARCHAR(100),
  rating DECIMAL(10, 4) DEFAULT 0,
  rank INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points_for INTEGER DEFAULT 0,
  points_against INTEGER DEFAULT 0,
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(sport, team_id)
);

CREATE INDEX idx_team_ratings_sport ON team_ratings(sport);
CREATE INDEX idx_team_ratings_rank ON team_ratings(rank);
CREATE INDEX idx_team_ratings_team_name ON team_ratings(team_name);

-- Enable Row Level Security
ALTER TABLE team_ratings ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read access to team ratings" ON team_ratings
  FOR SELECT TO authenticated USING (true);

-- Allow insert/update to service role (for scraper)
CREATE POLICY "Allow service role to manage team ratings" ON team_ratings
  FOR ALL USING (auth.role() = 'service_role');