// ============================================
// KCMPICKS - API Configuration
// Free APIs for sports data, predictions, and assets
// ============================================

export const API_CONFIG = {
  // ============================================
  // 1. THE ODDS API - Odds & Lines (FREE: 500 req/month)
  // https://the-odds-api.com/
  // ============================================
  ODDS_API: {
    BASE_URL: 'https://api.the-odds-api.com/v4',
    KEY: process.env.NEXT_PUBLIC_ODDS_API_KEY || '',
    FREE_LIMIT: 500, // requests per month
    SPORTS: {
      nba: 'basketball_nba',
      nfl: 'americanfootball_nfl',
      mlb: 'baseball_mlb',
      soccer_epl: 'soccer_epl',
      soccer_laliga: 'soccer_spain_la_liga',
      soccer_mls: 'soccer_usa_mls',
      ufc: 'mma_mixed_martial_arts',
      ncaaf: 'americanfootball_ncaaf',
      ncaab: 'basketball_ncaab',
    },
    REGIONS: 'us',
    MARKETS: 'h2h,spreads,totals',
  },

  // ============================================
  // 2. API-SPORTS - Comprehensive Data (FREE: 100 req/day)
  // https://api-sports.io/
  // ============================================
  API_SPORTS: {
    BASE_URL: 'https://v1.american-football.api-sports.io',
    NBA_URL: 'https://v1.basketball.api-sports.io',
    MLB_URL: 'https://v1.baseball.api-sports.io',
    SOCCER_URL: 'https://v1.football.api-sports.io',
    KEY: process.env.API_SPORTS_KEY || '',
    FREE_LIMIT: 100, // requests per day
  },

  // ============================================
  // 3. THE SPORTS DB - Free Complete Database
  // https://www.thesportsdb.com/
  // ============================================
  SPORTS_DB: {
    BASE_URL: 'https://www.thesportsdb.com/api/v1/json/3',
    FREE: true,
    NO_KEY_REQUIRED: true,
    INCLUDES: ['teams', 'logos', 'players', 'schedules', 'results'],
  },

  // ============================================
  // 4. BALLDONTLIE - NBA Stats (FREE)
  // https://balldontlie.io/
  // ============================================
  BALLDONTLIE: {
    BASE_URL: 'https://api.balldontlie.io/v1',
    KEY: process.env.BALLDONTLIE_KEY || '',
    FREE: true,
    SPORTS: ['nba'],
  },

  // ============================================
  // 5. ESPN UNOFFICIAL API - Free
  // No key required, unofficial endpoints
  // ============================================
  ESPN: {
    SCOREBOARD_URL: 'https://site.api.espn.com/apis/site/v2/sports',
    SPORTS: {
      nba: 'basketball/nba',
      nfl: 'football/nfl',
      mlb: 'baseball/mlb',
      soccer: 'soccer',
      ufc: 'mma/ufc',
      ncaaf: 'football/college-football',
      ncaab: 'basketball/mens-college-basketball',
      wnba: 'basketball/wnba',
    },
  },

  // ============================================
  // 6. FOOTBALL-API (Soccer) - FREE
  // https://www.api-football.com/
  // ============================================
  FOOTBALL_API: {
    BASE_URL: 'https://v3.football.api-sports.io',
    KEY: process.env.FOOTBALL_API_KEY || '',
    FREE_LIMIT: 100,
  },

  // ============================================
  // 7. OPENLIGADB - Free German/European Football
  // https://api.openligadb.de/
  // ============================================
  OPENLIGA: {
    BASE_URL: 'https://api.openligadb.de',
    FREE: true,
    NO_KEY_REQUIRED: true,
  },

  // ============================================
  // 8. SPORTS ILLUSTRATED API - Free
  // Limited but useful for schedules
  // ============================================
  SI_API: {
    BASE_URL: 'https://api.sportsillustrated.com',
    FREE: true,
  },
};

// ============================================
// SPORTS CONFIGURATION
// ============================================
export const SPORTS_CONFIG = {
  nba: {
    name: 'NBA',
    emoji: '🏀',
    espnKey: 'basketball/nba',
    oddsKey: 'basketball_nba',
    ballDontLie: true,
    seasonMonths: [10, 11, 12, 1, 2, 3, 4, 5, 6], // Oct-Jun
  },
  nfl: {
    name: 'NFL',
    emoji: '🏈',
    espnKey: 'football/nfl',
    oddsKey: 'americanfootball_nfl',
    seasonMonths: [9, 10, 11, 12, 1, 2], // Sep-Feb
  },
  mlb: {
    name: 'MLB',
    emoji: '⚾',
    espnKey: 'baseball/mlb',
    oddsKey: 'baseball_mlb',
    seasonMonths: [3, 4, 5, 6, 7, 8, 9, 10], // Mar-Oct
  },
  soccer: {
    name: 'Soccer',
    emoji: '⚽',
    espnKey: 'soccer',
    oddsKey: 'soccer_epl',
    leagues: ['epl', 'laliga', 'mls', 'champions'],
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
  },
  ufc: {
    name: 'UFC',
    emoji: '🥊',
    espnKey: 'mma/ufc',
    oddsKey: 'mma_mixed_martial_arts',
    seasonMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // Year-round
  },
  'college-football': {
    name: 'College Football',
    emoji: '🏟️',
    espnKey: 'football/college-football',
    oddsKey: 'americanfootball_ncaaf',
    seasonMonths: [8, 9, 10, 11, 12, 1], // Aug-Jan
  },
  'college-basketball': {
    name: 'College Basketball',
    emoji: '🎓',
    espnKey: 'basketball/mens-college-basketball',
    oddsKey: 'basketball_ncaab',
    seasonMonths: [11, 12, 1, 2, 3], // Nov-Mar
  },
  'womens-basketball': {
    name: "Women's Basketball",
    emoji: '👩‍🏀',
    espnKey: 'basketball/wnba',
    oddsKey: 'basketball_wnba',
    seasonMonths: [5, 6, 7, 8, 9, 10], // May-Oct
  },
};

// ============================================
// PREDICTION WEIGHTS (for AI model)
// ============================================
export const PREDICTION_WEIGHTS = {
  homeAdvantage: 0.03,      // 3% home advantage
  recentForm: 0.25,         // Last 5-10 games
  headToHead: 0.15,         // Historical matchup
  oddsMovement: 0.20,       // Line movement
  injuries: 0.15,           // Key player availability
  restDays: 0.05,           // Days since last game
  travelDistance: 0.03,     // Away team travel
  weather: 0.04,            // For outdoor sports
  motivation: 0.10,         // Playoff implications, rivalry
};

// ============================================
// CACHE DURATION (in seconds)
// ============================================
export const CACHE_DURATION = {
  LIVE_SCORES: 30,          // 30 seconds
  ODDS: 60,                 // 1 minute
  SCHEDULES: 300,           // 5 minutes
  TEAM_STATS: 3600,         // 1 hour
  PREDICTIONS: 900,         // 15 minutes
  TEAM_LOGOS: 86400,        // 24 hours
};
