-- KCMPICKS Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PICKS TABLE
-- ============================================
CREATE TABLE picks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sport TEXT NOT NULL CHECK (sport IN ('nba', 'nfl', 'mlb', 'soccer', 'ufc', 'college-football', 'college-basketball', 'womens-basketball')),
  match_id TEXT,
  match_name TEXT NOT NULL,
  pick_type TEXT NOT NULL CHECK (pick_type IN ('moneyline', 'spread', 'total', 'prop', 'parlay')),
  selection TEXT NOT NULL,
  odds INTEGER NOT NULL,
  stake DECIMAL(10,2) NOT NULL,
  potential_payout DECIMAL(10,2) NOT NULL,
  confidence INTEGER CHECK (confidence BETWEEN 1 AND 5),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'push', 'void')),
  notes TEXT,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  home_score INTEGER,
  away_score INTEGER,
  game_date TIMESTAMPTZ NOT NULL,
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE user_achievements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_picks_user_id ON picks(user_id);
CREATE INDEX idx_picks_sport ON picks(sport);
CREATE INDEX idx_picks_status ON picks(status);
CREATE INDEX idx_picks_game_date ON picks(game_date);
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE picks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Picks policies
CREATE POLICY "Users can view own picks" ON picks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own picks" ON picks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own picks" ON picks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own picks" ON picks
  FOR DELETE USING (auth.uid() = user_id);

-- Achievements policies
CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own achievements" ON user_achievements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || LEFT(NEW.id::text, 8))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_picks_updated_at
  BEFORE UPDATE ON picks
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- LEADERBOARD VIEW
-- ============================================
CREATE VIEW leaderboard AS
SELECT
  p.id AS user_id,
  p.username,
  p.avatar_url,
  COUNT(pk.id) AS total_picks,
  COUNT(CASE WHEN pk.status = 'won' THEN 1 END) AS wins,
  COUNT(CASE WHEN pk.status = 'lost' THEN 1 END) AS losses,
  CASE
    WHEN COUNT(CASE WHEN pk.status IN ('won', 'lost') THEN 1 END) > 0
    THEN ROUND(
      COUNT(CASE WHEN pk.status = 'won' THEN 1 END)::DECIMAL /
      COUNT(CASE WHEN pk.status IN ('won', 'lost') THEN 1 END) * 100,
      1
    )
    ELSE 0
  END AS win_rate,
  COALESCE(SUM(
    CASE
      WHEN pk.status = 'won' THEN pk.potential_payout - pk.stake
      WHEN pk.status = 'lost' THEN -pk.stake
      ELSE 0
    END
  ), 0) AS profit
FROM profiles p
LEFT JOIN picks pk ON p.id = pk.user_id
GROUP BY p.id, p.username, p.avatar_url
ORDER BY profit DESC;
