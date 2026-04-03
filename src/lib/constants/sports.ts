import { Sport, SportType } from '@/types';

export const SPORTS: Record<SportType, Sport> = {
  nba: {
    id: 'nba',
    name: 'NBA',
    icon: '🏀',
    color: '#FF6B35',
    season_active: true,
  },
  nfl: {
    id: 'nfl',
    name: 'NFL',
    icon: '🏈',
    color: '#013369',
    season_active: false,
  },
  mlb: {
    id: 'mlb',
    name: 'MLB',
    icon: '⚾',
    color: '#002D72',
    season_active: false,
  },
  soccer: {
    id: 'soccer',
    name: 'Soccer',
    icon: '⚽',
    color: '#2E7D32',
    season_active: true,
  },
  ufc: {
    id: 'ufc',
    name: 'UFC',
    icon: '🥊',
    color: '#D50000',
    season_active: true,
  },
  'college-football': {
    id: 'college-football',
    name: 'College Football',
    icon: '🏟️',
    color: '#8B4513',
    season_active: false,
  },
  'college-basketball': {
    id: 'college-basketball',
    name: 'College Basketball',
    icon: '🎓',
    color: '#1E3A5F',
    season_active: true,
  },
  'womens-basketball': {
    id: 'womens-basketball',
    name: "Women's Basketball",
    icon: '👩‍🏀',
    color: '#C2185B',
    season_active: true,
  },
};

export const SPORT_LIST = Object.values(SPORTS);

export const SPORT_GROUPS = {
  pro: ['nba', 'nfl', 'mlb', 'soccer', 'ufc'] as SportType[],
  college: ['college-football', 'college-basketball'] as SportType[],
  womens: ['womens-basketball'] as SportType[],
};

export const PICK_TYPE_LABELS = {
  moneyline: 'Moneyline',
  spread: 'Spread',
  total: 'Over/Under',
  prop: 'Player Prop',
  parlay: 'Parlay',
};

export const PICK_STATUS_COLORS = {
  pending: { bg: 'bg-kcm-yellow/20', text: 'text-kcm-yellow', label: 'Pending' },
  won: { bg: 'bg-kcm-green/20', text: 'text-kcm-green', label: 'Won' },
  lost: { bg: 'bg-kcm-red/20', text: 'text-kcm-red', label: 'Lost' },
  push: { bg: 'bg-foreground-muted/20', text: 'text-foreground-muted', label: 'Push' },
  void: { bg: 'bg-foreground-muted/20', text: 'text-foreground-muted', label: 'Void' },
};

export const CONFIDENCE_LABELS: Record<number, string> = {
  1: 'Low',
  2: 'Medium',
  3: 'High',
  4: 'Very High',
  5: 'Lock',
};

export const ACHIEVEMENTS = [
  { id: 'first_pick', name: 'First Pick', description: 'Submit your first pick', icon: '🎯' },
  { id: 'first_win', name: 'First Blood', description: 'Win your first pick', icon: '🏆' },
  { id: 'win_10', name: 'Hot Streak', description: 'Win 10 picks', icon: '🔥' },
  { id: 'win_25', name: 'Sharp', description: 'Win 25 picks', icon: '💎' },
  { id: 'win_50', name: 'Expert', description: 'Win 50 picks', icon: '👑' },
  { id: 'streak_5', name: 'On Fire', description: '5 wins in a row', icon: '⚡' },
  { id: 'streak_10', name: 'Unstoppable', description: '10 wins in a row', icon: '🌟' },
  { id: 'profit_100', name: 'Triple Digits', description: 'Earn $100 profit', icon: '💰' },
  { id: 'profit_1000', name: 'Big Winner', description: 'Earn $1000 profit', icon: '🤑' },
  { id: 'picks_100', name: 'Century', description: 'Place 100 picks', icon: '💯' },
  { id: 'all_sports', name: 'All-Rounder', description: 'Place picks in all sports', icon: '🌍' },
  { id: 'parlay_king', name: 'Parlay King', description: 'Win a 5+ leg parlay', icon: '🎰' },
];
