// ============================================
// KCMPICKS - Prediction Data Hook
// Fetches real odds + generates predictions
// Supports: OddsPapi (primary), The Odds API (fallback)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getTeamRating } from '@/lib/api/massey-ratings';
import { fetchOddsPapiGames } from '@/lib/api/oddspapi';
import { 
  generatePrediction, 
  formatPredictionForUI,
  type GameData,
  type TeamStats,
  type PredictionResult
} from '@/lib/api/prediction-service';

interface OddsGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeMoneyline: number;
  awayMoneyline: number;
  spread?: number;
  total?: number;
  gameTime: string;
  bookmaker: string;
}

interface PredictionWithGame {
  game: OddsGame;
  prediction: ReturnType<typeof formatPredictionForUI>;
  rawPrediction: PredictionResult;
}

// ============================================
// FETCH ODDS FROM ODDS PAPI (Primary - Better coverage)
// ============================================
async function fetchOddsFromOddsPapi(sport: string): Promise<OddsGame[]> {
  const games = await fetchOddsPapiGames(sport, 3);
  return games.map((game) => ({
    id: game.id,
    sport: game.sport,
    homeTeam: game.homeTeam,
    awayTeam: game.awayTeam,
    homeMoneyline: game.homeMoneyline,
    awayMoneyline: game.awayMoneyline,
    gameTime: game.gameTime,
    bookmaker: game.bookmaker,
  }));
}

// ============================================
// FETCH ODDS FROM THE ODDS API (Fallback)
// Goes through the server proxy (/api/odds) so the API key stays server-side
// and responses are cached per sport.
// ============================================
async function fetchOddsFromTheOddsAPI(sport: string): Promise<OddsGame[]> {
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

  if (!sportKeys[sport]) return [];

  try {
    const response = await fetch(`/api/odds?sport=${sport}`, { cache: 'no-store' });

    if (response.status === 503) return []; // key not configured
    if (response.status === 429) {
      console.warn('Odds API rate limit reached (proxy)');
      return [];
    }

    if (!response.ok) {
      console.error('Odds proxy error:', response.status, response.statusText);
      return [];
    }

    const data = await response.json();
    if (!data || !Array.isArray(data)) return [];

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
      const bm = game.bookmakers?.[0];
      const ml = bm?.markets?.find((m: { key: string }) => m.key === 'h2h');
      const sp = bm?.markets?.find((m: { key: string }) => m.key === 'spreads');
      const tot = bm?.markets?.find((m: { key: string }) => m.key === 'totals');

      const homeTeam = game.home_team;
      const awayTeam = game.away_team;

      return {
        id: game.id,
        sport,
        homeTeam,
        awayTeam,
        homeMoneyline: ml?.outcomes?.find((o: { name: string }) => o.name === homeTeam)?.price || -110,
        awayMoneyline: ml?.outcomes?.find((o: { name: string }) => o.name === awayTeam)?.price || -110,
        spread: sp?.outcomes?.find((o: { name: string }) => o.name === homeTeam)?.point,
        total: tot?.outcomes?.find((o: { name: string }) => o.name === 'Over')?.point,
        gameTime: game.commence_time,
        bookmaker: bm?.title || 'N/A',
      };
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return [];
  }
}

// ============================================
// FETCH TEAM STATS (from Massey ratings when available)
// ============================================
async function fetchTeamStats(teamName: string, sport: string): Promise<TeamStats | null> {
  const rating = await getTeamRating(sport, teamName);
  if (!rating) return null;

  const wins = rating.wins || 0;
  const losses = rating.losses || 0;
  const played = wins + losses;
  const winPct = played > 0 ? wins / played : 0.5;

  // Derive last-5 form and home/away splits from the season record (approx. 55/45 home split)
  const last5: ('W' | 'L')[] = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(winPct * 5) ? 'W' : 'L'
  );

  return {
    wins,
    losses,
    winPct,
    avgPointsFor: rating.points_for || 100,
    avgPointsAgainst: rating.points_against || 100,
    last5,
    homeRecord: { wins: Math.round(wins * 0.55), losses: Math.round(losses * 0.4) },
    awayRecord: { wins: Math.round(wins * 0.45), losses: Math.round(losses * 0.6) },
    restDays: 2,
    injuryImpact: 0,
  };
}

// ============================================
// MAIN HOOK
// ============================================
export function usePredictions(sport: string = 'nba') {
  const [predictions, setPredictions] = useState<PredictionWithGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPredictions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Try OddsPapi first (better coverage)
      let oddsGames = await fetchOddsFromOddsPapi(sport);
      
      // Fallback to The Odds API if OddsPapi fails
      if (oddsGames.length === 0) {
        console.log('OddsPapi returned no data, trying The Odds API...');
        oddsGames = await fetchOddsFromTheOddsAPI(sport);
      }
      
      // If no API data, use fallback
      if (oddsGames.length === 0) {
        console.log('No API data available, using fallback');
        setPredictions([]);
        setLoading(false);
        return;
      }

      console.log(`Got ${oddsGames.length} games from API`);

      // Fetch stats for each team
      const statsMap: Record<string, { home?: TeamStats; away?: TeamStats }> = {};
      
      for (const game of oddsGames) {
        if (!statsMap[game.homeTeam]) {
          statsMap[game.homeTeam] = {};
        }
        if (!statsMap[game.awayTeam]) {
          statsMap[game.awayTeam] = {};
        }
        
        // Parallel fetch
        const [homeStats, awayStats] = await Promise.all([
          fetchTeamStats(game.homeTeam, sport),
          fetchTeamStats(game.awayTeam, sport),
        ]);
        
        statsMap[game.homeTeam].home = homeStats || undefined;
        statsMap[game.awayTeam].away = awayStats || undefined;
      }

      // Generate predictions for each game
      const results: PredictionWithGame[] = oddsGames.map(game => {
        const gameData: GameData = {
          id: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          homeOdds: game.homeMoneyline,
          awayOdds: game.awayMoneyline,
          spread: game.spread,
          total: game.total,
          gameTime: game.gameTime,
        };

        const stats = statsMap[game.homeTeam] || statsMap[game.awayTeam] || {};
        
        const rawPrediction = generatePrediction(
          gameData,
          stats.home,
          stats.away
        );

        const formattedPrediction = formatPredictionForUI(
          rawPrediction,
          game.homeTeam,
          game.awayTeam
        );

        return {
          game,
          prediction: formattedPrediction,
          rawPrediction,
        };
      });

      // Sort by value/edge (best picks first)
      results.sort((a, b) => b.rawPrediction.edge - a.rawPrediction.edge);
      
      setPredictions(results);
    } catch (err) {
      console.error('Error generating predictions:', err);
      setError('Failed to generate predictions');
    } finally {
      setLoading(false);
    }
  }, [sport]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchPredictions();
    }, 60000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  return {
    predictions,
    loading,
    error,
    refresh: fetchPredictions,
  };
}

// ============================================
// HOOK FOR SINGLE GAME PREDICTION
// ============================================
export function useGamePrediction(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  sport: string,
  spread?: number,
  total?: number
) {
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const generate = async () => {
      setLoading(true);
      
      const [homeStats, awayStats] = await Promise.all([
        fetchTeamStats(homeTeam, sport),
        fetchTeamStats(awayTeam, sport),
      ]);

      const gameData: GameData = {
        id: `${sport}-${homeTeam}-${awayTeam}`,
        sport,
        homeTeam,
        awayTeam,
        homeOdds,
        awayOdds,
        spread,
        total,
        gameTime: new Date().toISOString(),
      };

      const result = generatePrediction(
        gameData,
        homeStats || undefined,
        awayStats || undefined
      );

      setPrediction(result);
      setLoading(false);
    };

    generate();
  }, [homeTeam, awayTeam, homeOdds, awayOdds, sport, spread, total]);

  return { prediction, loading };
}