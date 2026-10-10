// ============================================
// KCMPICKS - Live Data Hook
// Fetch real data from free APIs with fallback
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { isGameToday, isGameInFuture } from '@/lib/utils';
import { fetchOddsPapiGames } from '@/lib/api/oddspapi';

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
      { cache: 'no-store' }
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
    console.error('ESPN fetch error:', error);
    return [];
  }
}

// ============================================
// ODDS API SERVICE (with fallback)
// ============================================
function mapOddsPapiToGameOdds(games: import('@/lib/api/oddspapi').OddsPapiGame[]): GameOdds[] {
  return games.map((game) => ({
    id: game.id,
    sport: game.sport,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    gameTime: game.gameTime,
    homeMoneyline: game.homeMoneyline,
    awayMoneyline: game.awayMoneyline,
    spread: -3.5,
    total: 215.5,
    bookmaker: game.bookmaker,
  }));
}

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
    const response = await fetch(`/api/odds?sport=${sport}`, { cache: 'no-store' });

    if (!response.ok) {
      const papiGames = await fetchOddsPapiGames(sport);
      if (papiGames.length > 0) return mapOddsPapiToGameOdds(papiGames);
      console.warn('Odds proxy error, using mock odds');
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
// ENHANCED ODDS - Multiple Bookmakers Comparison
// ============================================
export interface BookmakerOdds {
  bookmaker: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spread: number;
  total: number;
}

export interface EnhancedGameOdds extends GameOdds {
  bookmakerOdds: BookmakerOdds[];
  bestHomeOdds: number;
  bestAwayOdds: number;
  bestSpread: number;
  bestTotal: number;
  arbitrageOpportunity: number | null;
}

async function fetchEnhancedOdds(sport: string): Promise<EnhancedGameOdds[]> {
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
  if (!sportKey) return [];

  try {
    const response = await fetch(`/api/odds?sport=${sport}`, { cache: 'no-store' });

    if (!response.ok) return [];

    const data = await response.json();
    if (!data || data.length === 0) return [];

    const gamesMap = new Map<string, {
      homeTeam: string;
      awayTeam: string;
      gameTime: string;
      bookmakerOdds: BookmakerOdds[];
    }>();

    for (const game of data) {
      const bookmakerOdds: BookmakerOdds[] = game.bookmakers.map((bm: {
        title: string;
        markets: Array<{
          key: string;
          outcomes: Array<{ name: string; price: number; point?: number }>;
        }>;
      }) => {
        const ml = bm.markets.find((m) => m.key === 'h2h');
        const sp = bm.markets.find((m) => m.key === 'spreads');
        const tot = bm.markets.find((m) => m.key === 'totals');
        
        return {
          bookmaker: bm.title,
          homeMoneyline: ml?.outcomes?.find((o) => o.name === game.home_team)?.price || -110,
          awayMoneyline: ml?.outcomes?.find((o) => o.name === game.away_team)?.price || -110,
          spread: sp?.outcomes?.find((o) => o.name === game.home_team)?.point || -3.5,
          total: tot?.outcomes?.find((o) => o.name === 'Over')?.point || 215.5,
        };
      });

      const existing = gamesMap.get(game.id);
      if (!existing) {
        gamesMap.set(game.id, {
          homeTeam: game.home_team,
          awayTeam: game.away_team,
          gameTime: game.commence_time,
          bookmakerOdds,
        });
      } else {
        existing.bookmakerOdds.push(...bookmakerOdds);
      }
    }

    const results: EnhancedGameOdds[] = [];
    
    for (const [id, game] of gamesMap) {
      const bestHome = Math.max(...game.bookmakerOdds.map(b => b.homeMoneyline));
      const bestAway = Math.max(...game.bookmakerOdds.map(b => b.awayMoneyline));
      const bestSp = game.bookmakerOdds.reduce((best, b) => 
        b.spread > best.spread ? b : best, game.bookmakerOdds[0]);
      const bestTot = game.bookmakerOdds.reduce((best, b) => 
        b.total > best.total ? b : best, game.bookmakerOdds[0]);

      const homeImplied = bestHome > 0 ? 100 / (bestHome + 100) : Math.abs(bestHome) / (Math.abs(bestHome) + 100);
      const awayImplied = bestAway > 0 ? 100 / (bestAway + 100) : Math.abs(bestAway) / (Math.abs(bestAway) + 100);
      const totalImplied = homeImplied + awayImplied;
      const arb = totalImplied < 1 ? (1 - totalImplied) * 100 : null;

      results.push({
        id,
        sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        gameTime: game.gameTime,
        homeMoneyline: game.bookmakerOdds[0]?.homeMoneyline || -110,
        awayMoneyline: game.bookmakerOdds[0]?.awayMoneyline || -110,
        spread: game.bookmakerOdds[0]?.spread || -3.5,
        total: game.bookmakerOdds[0]?.total || 215.5,
        bookmaker: game.bookmakerOdds[0]?.bookmaker || 'N/A',
        bookmakerOdds: game.bookmakerOdds,
        bestHomeOdds: bestHome,
        bestAwayOdds: bestAway,
        bestSpread: bestSp.spread,
        bestTotal: bestTot.total,
        arbitrageOpportunity: arb,
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching enhanced odds:', error);
    return [];
  }
}

// ============================================
// HISTORICAL ODDS (for AI training)
// ============================================
export interface HistoricalOdds {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameDate: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spread: number;
  total: number;
  homeScore: number;
  awayScore: number;
  result: 'home' | 'away' | 'push';
}

async function fetchHistoricalOdds(sport: string, daysBack: number = 30): Promise<HistoricalOdds[]> {
  const sportKeys: Record<string, string> = {
    nba: 'basketball_nba',
    nfl: 'americanfootball_nfl',
    mlb: 'baseball_mlb',
    soccer: 'soccer_epl',
    ufc: 'mma_mixed_martial_arts',
    'college-football': 'americanfootball_ncaaf',
    'college-basketball': 'basketball_ncaab',
  };

  const sportKey = sportKeys[sport];
  if (!sportKey) return [];

  try {
    const apiKey = process.env.NEXT_PUBLIC_ODDS_API_KEY || '';
    if (!apiKey) return [];

    const response = await fetch(
      `https://api.the-odds-api.com/v4/sports/${sportKey}/historical/?apiKey=${apiKey}&regions=us&daysFrom=${daysBack}&oddsFormat=american`
    );

    if (!response.ok) return [];

    const data = await response.json();
    if (!data || !data.data) return [];

    const results: HistoricalOdds[] = [];
    
    for (const event of data.data) {
      if (!event.completed) continue;
      
      const homeScore = event.scores?.[event.home_team]?.score || 0;
      const awayScore = event.scores?.[event.away_team]?.score || 0;
      
      let result: 'home' | 'away' | 'push' = 'push';
      if (homeScore > awayScore) result = 'home';
      else if (awayScore > homeScore) result = 'away';

      const bm = event.bookmakers?.[0];
      const ml = bm?.markets?.find((m: { key: string }) => m.key === 'h2h');
      const sp = bm?.markets?.find((m: { key: string }) => m.key === 'spreads');
      const tot = bm?.markets?.find((m: { key: string }) => m.key === 'totals');

      results.push({
        id: event.id,
        sport,
        homeTeam: event.home_team,
        awayTeam: event.away_team,
        gameDate: event.commence_time,
        homeMoneyline: ml?.outcomes?.find((o: { name: string }) => o.name === event.home_team)?.price || -110,
        awayMoneyline: ml?.outcomes?.find((o: { name: string }) => o.name === event.away_team)?.price || -110,
        spread: sp?.outcomes?.find((o: { name: string }) => o.name === event.home_team)?.point || -3.5,
        total: tot?.outcomes?.find((o: { name: string }) => o.name === 'Over')?.point || 215.5,
        homeScore,
        awayScore,
        result,
      });
    }

    return results;
  } catch (error) {
    console.error('Error fetching historical odds:', error);
    return [];
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
      // Filter to only show today's games (including live)
      const todaysGames = data.filter((game) => 
        isGameToday(game.gameTime) || game.isLive
      );
      setGames(todaysGames);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchGames();
  }, [fetchGames]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchESPNScores(sport).then((data) => {
        const todaysGames = data.filter((game) => 
          isGameToday(game.gameTime) || game.isLive
        );
        setGames(todaysGames);
      }).catch(console.error);
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
      // Filter to only show today's games (not future games)
      const todaysOdds = data.filter((odd) => !isGameInFuture(odd.gameTime));
      setOdds(todaysOdds);
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchOddsData();
  }, [fetchOddsData]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchOdds(sport).then((data) => {
        const todaysOdds = data.filter((odd) => !isGameInFuture(odd.gameTime));
        setOdds(todaysOdds);
      }).catch(console.error);
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
      const todaysOdds = oddsData.filter((odd) => !isGameInFuture(odd.gameTime));
      const preds = todaysOdds.map(generateHeuristicPrediction);
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
      fetchOdds(sport).then((oddsData) => {
        const todaysOdds = oddsData.filter((odd) => !isGameInFuture(odd.gameTime));
        setPredictions(todaysOdds.map(generateHeuristicPrediction));
      }).catch(console.error);
    }, 90000);
    return () => clearInterval(interval);
  }, [sport]);

  return { predictions, loading, refresh: fetchPredictions };
}

// ============================================
// ENHANCED ODDS HOOK
// ============================================
export function useEnhancedOdds(sport: string = 'nba') {
  const [odds, setOdds] = useState<EnhancedGameOdds[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEnhanced = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchEnhancedOdds(sport);
      setOdds(data.filter(odd => !isGameInFuture(odd.gameTime)));
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchEnhanced();
  }, [fetchEnhanced]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetchEnhancedOdds(sport).then(data => {
        setOdds(data.filter(odd => !isGameInFuture(odd.gameTime)));
      }).catch(console.error);
    }, 60000);
    return () => clearInterval(interval);
  }, [sport]);

  return { odds, loading, refresh: fetchEnhanced };
}

// ============================================
// HISTORICAL ODDS HOOK (for AI training data)
// ============================================
export function useHistoricalOdds(sport: string = 'nba', daysBack: number = 30) {
  const [historical, setHistorical] = useState<HistoricalOdds[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistorical = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchHistoricalOdds(sport, daysBack);
      setHistorical(data);
    } finally {
      setLoading(false);
    }
  }, [sport, daysBack]);

  useEffect(() => {
    fetchHistorical();
  }, [fetchHistorical]);

  return { historical, loading, refresh: fetchHistorical };
}

// Heuristic (odds-only) prediction for the dashboard "AI Predictions" section.
// Distinct from the ensemble engine in src/lib/api/prediction-service.ts
function generateHeuristicPrediction(game: GameOdds): Prediction {
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
