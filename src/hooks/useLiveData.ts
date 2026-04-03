// ============================================
// KCMPICKS - Live Data Hook
// Fetch real data from free APIs with fallback
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';

// ============================================
// TYPES
// ============================================
export interface LiveGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: string;
  period: string;
  clock: string;
  isLive: boolean;
  gameTime: string;
  homeLogo: string;
  awayLogo: string;
}

export interface GameOdds {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spread: number;
  total: number;
  bookmaker: string;
}

export interface Prediction {
  homeTeam: string;
  awayTeam: string;
  homeWinProb: number;
  awayWinProb: number;
  confidence: number;
  pick: string;
  valueRating: number;
  reasoning: string[];
}

// ============================================
// MOCK DATA (Fallback when APIs fail)
// ============================================
function getMockGames(sport: string): LiveGame[] {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(19, 0, 0, 0);

  const mockData: Record<string, LiveGame[]> = {
    nba: [
      {
        id: 'nba-1',
        sport: 'nba',
        homeTeam: 'Los Angeles Lakers',
        awayTeam: 'Golden State Warriors',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
      {
        id: 'nba-2',
        sport: 'nba',
        homeTeam: 'Boston Celtics',
        awayTeam: 'Milwaukee Bucks',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
      {
        id: 'nba-3',
        sport: 'nba',
        homeTeam: 'Denver Nuggets',
        awayTeam: 'Phoenix Suns',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
      {
        id: 'nba-4',
        sport: 'nba',
        homeTeam: 'Miami Heat',
        awayTeam: 'Philadelphia 76ers',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    nfl: [
      {
        id: 'nfl-1',
        sport: 'nfl',
        homeTeam: 'Kansas City Chiefs',
        awayTeam: 'San Francisco 49ers',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
      {
        id: 'nfl-2',
        sport: 'nfl',
        homeTeam: 'Philadelphia Eagles',
        awayTeam: 'Dallas Cowboys',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    mlb: [
      {
        id: 'mlb-1',
        sport: 'mlb',
        homeTeam: 'New York Yankees',
        awayTeam: 'Los Angeles Dodgers',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    soccer: [
      {
        id: 'soccer-1',
        sport: 'soccer',
        homeTeam: 'Manchester City',
        awayTeam: 'Liverpool',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
      {
        id: 'soccer-2',
        sport: 'soccer',
        homeTeam: 'Real Madrid',
        awayTeam: 'Barcelona',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    ufc: [
      {
        id: 'ufc-1',
        sport: 'ufc',
        homeTeam: 'Fighter A',
        awayTeam: 'Fighter B',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    'college-football': [
      {
        id: 'cfb-1',
        sport: 'college-football',
        homeTeam: 'Alabama',
        awayTeam: 'Georgia',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    'college-basketball': [
      {
        id: 'cbb-1',
        sport: 'college-basketball',
        homeTeam: 'Duke',
        awayTeam: 'North Carolina',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
    'womens-basketball': [
      {
        id: 'wnba-1',
        sport: 'womens-basketball',
        homeTeam: 'Las Vegas Aces',
        awayTeam: 'New York Liberty',
        homeScore: 0,
        awayScore: 0,
        status: 'Scheduled',
        period: '',
        clock: '',
        isLive: false,
        gameTime: tomorrow.toISOString(),
        homeLogo: '',
        awayLogo: '',
      },
    ],
  };

  return mockData[sport] || mockData.nba;
}

function getMockOdds(sport: string): GameOdds[] {
  const mockGames = getMockGames(sport);

  return mockGames.map((game, i) => {
    // Generate realistic odds
    const homeIsFavored = i % 2 === 0;
    const baseOdds = [-150, -130, -110, -200, +100, +120, +150][i % 7];

    return {
      id: game.id,
      sport: game.sport,
      homeTeam: game.homeTeam,
      awayTeam: game.awayTeam,
      gameTime: game.gameTime,
      homeMoneyline: homeIsFavored ? baseOdds : -baseOdds,
      awayMoneyline: homeIsFavored ? -baseOdds : baseOdds,
      spread: homeIsFavored ? -3.5 : 3.5,
      total: [215.5, 220.5, 225.5, 210.5, 230.5][i % 5],
      bookmaker: 'Mock Data',
    };
  });
}

// ============================================
// ESPN FREE API SERVICE
// ============================================
async function fetchESPNScores(sport: string): Promise<LiveGame[]> {
  const sportPaths: Record<string, string> = {
    nba: 'basketball/nba',
    nfl: 'football/nfl',
    mlb: 'baseball/mlb',
    soccer: 'soccer/eng.1',
    ufc: 'mma/ufc',
    'college-football': 'football/college-football',
    'college-basketball': 'basketball/mens-college-basketball',
    'womens-basketball': 'basketball/wnba',
  };

  const sportPath = sportPaths[sport];
  if (!sportPath) return getMockGames(sport);

  try {
    const response = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/${sportPath}/scoreboard`,
      { next: { revalidate: 30 } }
    );

    if (!response.ok) {
      console.warn('ESPN API error, using mock data');
      return getMockGames(sport);
    }

    const data = await response.json();

    if (!data.events || data.events.length === 0) {
      // No games today, use mock data
      return getMockGames(sport);
    }

    return data.events.map((event: {
      id: string;
      date: string;
      competitions: Array<{
        competitors: Array<{
          homeAway: string;
          team: { displayName: string; logo?: string };
          score?: string;
        }>;
        status?: {
          type?: { state?: string; description?: string; detail?: string };
          displayClock?: string;
          period?: number;
        };
      }>;
    }) => {
      const comp = event.competitions[0];
      const home = comp?.competitors?.find((c) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c) => c.homeAway === 'away');
      const statusType = comp?.status?.type;
      const isLive = statusType?.state === 'in';

      return {
        id: event.id,
        sport,
        homeTeam: home?.team?.displayName || 'TBD',
        awayTeam: away?.team?.displayName || 'TBD',
        homeScore: home?.score ? parseInt(home.score) : 0,
        awayScore: away?.score ? parseInt(away.score) : 0,
        status: statusType?.description || 'Scheduled',
        period: statusType?.detail || '',
        clock: comp?.status?.displayClock || '',
        isLive,
        gameTime: event.date,
        homeLogo: home?.team?.logo || '',
        awayLogo: away?.team?.logo || '',
      };
    });
  } catch (error) {
    console.error('ESPN fetch error, using mock data:', error);
    return getMockGames(sport);
  }
}

// ============================================
// ODDS API SERVICE (with fallback)
// ============================================
async function fetchOdds(sport: string): Promise<GameOdds[]> {
  const sportKeys: Record<string, string> = {
    nba: 'basketball_nba',
    nfl: 'americanfootball_nfl',
    mlb: 'baseball_mlb',
    soccer: 'soccer_epl',
    ufc: 'mma_mixed_martial_arts',
    'college-football': 'americanfootball_ncaaf',
    'college-basketball': 'basketball_ncaab',
    'womens-basketball': 'basketball_wncaab',
  };

  const sportKey = sportKeys[sport];
  if (!sportKey) return getMockOdds(sport);

  try {
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY || '';
    if (!apiKey) {
      console.warn('No Odds API key, using mock odds');
      return getMockOdds(sport);
    }

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`
    );

    if (!response.ok) {
      // API quota exceeded or error, use mock data
      console.warn('Odds API error, using mock odds');
      return getMockOdds(sport);
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      return getMockOdds(sport);
    }

    return data.map((game: {
      id: string;
      commence_time: string;
      home_team: string;
      away_team: string;
      bookmakers: Array<{
        title: string;
        markets: Array<{
          key: string;
          outcomes: Array<{ name: string; price: number; point?: number }>;
        }>;
      }>;
    }) => {
      const bm = game.bookmakers[0];
      const moneyline = bm?.markets?.find((m) => m.key === 'h2h');
      const spreads = bm?.markets?.find((m) => m.key === 'spreads');
      const totals = bm?.markets?.find((m) => m.key === 'totals');

      return {
        id: game.id,
        sport,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        gameTime: game.commence_time,
        homeMoneyline: moneyline?.outcomes?.find((o) => o.name === game.home_team)?.price || -110,
        awayMoneyline: moneyline?.outcomes?.find((o) => o.name === game.away_team)?.price || -110,
        spread: spreads?.outcomes?.find((o) => o.name === game.home_team)?.point || -3.5,
        total: totals?.outcomes?.find((o) => o.name === 'Over')?.point || 215.5,
        bookmaker: bm?.title || 'N/A',
      };
    });
  } catch (error) {
    console.error('Error fetching odds, using mock:', error);
    return getMockOdds(sport);
  }
}

// ============================================
// HOOKS
// ============================================
export function useLiveData(sport: string = 'nba') {
  const [games, setGames] = useState<LiveGame[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGames = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchESPNScores(sport);
      setGames(data);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchESPNScores(sport).then(setGames).catch(console.error);
    }, 30000);
    return () => clearInterval(interval);
  }, [sport]);

  return { games, loading, refresh: fetchGames };
}

export function useOdds(sport: string = 'nba') {
  const [odds, setOdds] = useState<GameOdds[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOddsData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchOdds(sport);
      setOdds(data);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchOddsData();
  }, [fetchOddsData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOdds(sport).then(setOdds).catch(console.error);
    }, 60000);
    return () => clearInterval(interval);
  }, [sport]);

  return { odds, loading, refresh: fetchOddsData };
}

export function usePredictions(sport: string = 'nba') {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPredictions = useCallback(async () => {
    try {
      setLoading(true);
      const oddsData = await fetchOdds(sport);
      const preds = oddsData.map(generatePrediction);
      setPredictions(preds);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOdds(sport).then(oddsData => {
        setPredictions(oddsData.map(generatePrediction));
      }).catch(console.error);
    }, 90000);
    return () => clearInterval(interval);
  }, [sport]);

  return { predictions, loading, refresh: fetchPredictions };
}

// Generate prediction from odds
function generatePrediction(game: GameOdds): Prediction {
  const homeImplied = game.homeMoneyline > 0
    ? 100 / (game.homeMoneyline + 100)
    : Math.abs(game.homeMoneyline) / (Math.abs(game.homeMoneyline) + 100);

  const awayImplied = game.awayMoneyline > 0
    ? 100 / (game.awayMoneyline + 100)
    : Math.abs(game.awayMoneyline) / (Math.abs(game.awayMoneyline) + 100);

  const total = homeImplied + awayImplied;
  let homeProb = (homeImplied / total) * 100 + 3;
  let awayProb = (awayImplied / total) * 100 - 3;

  const totalProb = homeProb + awayProb;
  homeProb = (homeProb / totalProb) * 100;
  awayProb = (awayProb / totalProb) * 100;

  const confidence = Math.abs(homeProb - awayProb);
  const favorite = homeProb > awayProb ? game.homeTeam : game.awayTeam;
  const edge = Math.abs(homeProb - 50);

  let valueRating = 1;
  if (edge > 15) valueRating = 5;
  else if (edge > 10) valueRating = 4;
  else if (edge > 7) valueRating = 3;
  else if (edge > 4) valueRating = 2;

  return {
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeWinProb: homeProb,
    awayWinProb: awayProb,
    confidence,
    pick: favorite,
    valueRating,
    reasoning: [
      `Odds imply ${favorite} has ${homeProb > awayProb ? homeProb.toFixed(1) : awayProb.toFixed(1)}% win probability`,
      `Home advantage adds ~3%`,
      edge > 5 ? 'Strong value detected' : 'Moderate value',
    ],
  };
}

// Format odds helper
export function formatOdds(american: number): string {
  if (american > 0) return `+${american}`;
  return `${american}`;
}
