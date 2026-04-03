// User types
export interface User {
  id: string;
  email: string;
  username: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile extends User {
  total_picks: number;
  wins: number;
  losses: number;
  pushes: number;
  win_rate: number;
  roi: number;
  current_streak: number;
  best_streak: number;
  total_profit: number;
  achievements: Achievement[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at: string | null;
}

// Sport types
export type SportType =
  | 'nba'
  | 'nfl'
  | 'mlb'
  | 'soccer'
  | 'ufc'
  | 'college-football'
  | 'college-basketball'
  | 'womens-basketball';

export interface Sport {
  id: SportType;
  name: string;
  icon: string;
  color: string;
  season_active: boolean;
}

// Pick types
export type PickStatus = 'pending' | 'won' | 'lost' | 'push' | 'void';
export type PickType = 'moneyline' | 'spread' | 'total' | 'prop' | 'parlay';
export type ConfidenceLevel = 1 | 2 | 3 | 4 | 5;

export interface Pick {
  id: string;
  user_id: string;
  sport: SportType;
  match_id: string;
  match_name: string;
  pick_type: PickType;
  selection: string;
  odds: number;
  stake: number;
  potential_payout: number;
  confidence: ConfidenceLevel;
  status: PickStatus;
  notes: string | null;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  game_date: string;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface PickWithStats extends Pick {
  result_value: number;
}

// Match/Game types
export interface Match {
  id: string;
  sport: SportType;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: 'scheduled' | 'live' | 'final' | 'postponed' | 'cancelled';
  commence_time: string;
  league: string;
  odds: MatchOdds;
}

export interface MatchOdds {
  home_moneyline: number | null;
  away_moneyline: number | null;
  spread: number | null;
  spread_home: number | null;
  spread_away: number | null;
  total: number | null;
  over_odds: number | null;
  under_odds: number | null;
}

// Stats types
export interface DashboardStats {
  total_picks: number;
  wins: number;
  losses: number;
  pushes: number;
  win_rate: number;
  roi: number;
  total_profit: number;
  current_streak: number;
  streak_type: 'win' | 'loss';
  avg_odds: number;
  best_sport: SportType;
  best_sport_win_rate: number;
}

export interface SportStats {
  sport: SportType;
  total_picks: number;
  wins: number;
  losses: number;
  pushes: number;
  win_rate: number;
  profit: number;
  roi: number;
}

export interface ChartDataPoint {
  date: string;
  profit: number;
  cumulative: number;
  picks: number;
}

// Leaderboard types
export interface LeaderboardEntry {
  rank: number;
  user_id: string;
  username: string;
  avatar_url: string | null;
  win_rate: number;
  total_picks: number;
  profit: number;
  roi: number;
  current_streak: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  error: null;
}

export interface ApiError {
  data: null;
  error: {
    message: string;
    code: string;
  };
}

// Form types
export interface CreatePickForm {
  sport: SportType;
  match_id: string;
  match_name: string;
  pick_type: PickType;
  selection: string;
  odds: number;
  stake: number;
  confidence: ConfidenceLevel;
  notes: string;
  home_team: string;
  away_team: string;
  game_date: string;
}

// Filter types
export interface PickFilters {
  sport: SportType | 'all';
  status: PickStatus | 'all';
  pick_type: PickType | 'all';
  date_range: 'today' | 'week' | 'month' | 'all' | 'custom';
  start_date?: string;
  end_date?: string;
}
