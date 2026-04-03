// ============================================
// KCMPICKS - AI Prediction Engine
// Free prediction service using available data
// ============================================

import { API_CONFIG, SPORTS_CONFIG, PREDICTION_WEIGHTS } from './config';

// ============================================
// TYPES
// ============================================
export interface PredictionInput {
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  spread?: number;
  total?: number;
  gameTime: string;
  venue?: string;
  isPlayoffs?: boolean;
}

export interface PredictionResult {
  homeWinProbability: number;
  awayWinProbability: number;
  confidence: number;
  recommendation: string;
  spreadPick: string;
  totalPick: string;
  valueRating: number; // 1-5 stars
  reasoning: string[];
}

// ============================================
// PREDICTION ENGINE
// ============================================
export class PredictionEngine {
  // Convert American odds to implied probability
  static oddsToImpliedProbability(americanOdds: number): number {
    if (americanOdds > 0) {
      return 100 / (americanOdds + 100);
    } else {
      return Math.abs(americanOdds) / (Math.abs(americanOdds) + 100);
    }
  }

  // Remove vig/juice from odds
  static removeVig(homeOdds: number, awayOdds: number): { home: number; away: number } {
    const homeImplied = this.oddsToImpliedProbability(homeOdds);
    const awayImplied = this.oddsToImpliedProbability(awayOdds);
    const totalImplied = homeImplied + awayImplied;
    return {
      home: homeImplied / totalImplied,
      away: awayImplied / totalImplied,
    };
  }

  // Calculate value rating (1-5)
  static calculateValueRating(
    modelProbability: number,
    impliedProbability: number
  ): number {
    const edge = modelProbability - impliedProbability;
    if (edge > 0.1) return 5;
    if (edge > 0.07) return 4;
    if (edge > 0.04) return 3;
    if (edge > 0.02) return 2;
    return 1;
  }

  // Main prediction method
  static predict(input: PredictionInput): PredictionResult {
    const { homeOdds, awayOdds, spread, total, isPlayoffs } = input;

    // 1. Get implied probabilities from odds
    const fairOdds = this.removeVig(homeOdds, awayOdds);

    // 2. Apply home advantage
    let homeProb = fairOdds.home + PREDICTION_WEIGHTS.homeAdvantage;
    let awayProb = fairOdds.away - PREDICTION_WEIGHTS.homeAdvantage;

    // 3. Apply playoff bonus for favorites
    if (isPlayoffs) {
      if (homeProb > 0.5) {
        homeProb += PREDICTION_WEIGHTS.motivation;
        awayProb -= PREDICTION_WEIGHTS.motivation;
      } else {
        awayProb += PREDICTION_WEIGHTS.motivation;
        awayProb -= PREDICTION_WEIGHTS.motivation;
      }
    }

    // 4. Normalize probabilities
    const totalProb = homeProb + awayProb;
    homeProb = homeProb / totalProb;
    awayProb = awayProb / totalProb;

    // 5. Calculate confidence
    const confidence = Math.abs(homeProb - awayProb) * 100;

    // 6. Determine recommendations
    const homeFavored = homeProb > awayProb;
    const favorite = homeFavored ? input.homeTeam : input.awayTeam;
    const underdog = homeFavored ? input.awayTeam : input.homeTeam;
    const favoriteProb = homeFavored ? homeProb : awayProb;

    // 7. Spread recommendation
    let spreadPick = '';
    if (spread) {
      const spreadValue = Math.abs(spread);
      if (spreadValue <= 3) {
        spreadPick = `${favorite} ${spread > 0 ? '+' : ''}${spread}`;
      } else if (spreadValue <= 7) {
        spreadPick = confidence > 60
          ? `${favorite} ${spread > 0 ? '+' : ''}${spread}`
          : `${underdog} ${-spread > 0 ? '+' : ''}${-spread}`;
      } else {
        spreadPick = `${underdog} ${-spread > 0 ? '+' : ''}${-spread}`;
      }
    }

    // 8. Total recommendation
    let totalPick = '';
    if (total) {
      // Simple heuristic based on odds
      const homeOddsNum = homeOdds;
      const awayOddsNum = awayOdds;
      const highScoring = homeOddsNum < -150 || awayOddsNum < -150;
      totalPick = highScoring ? `Over ${total}` : `Under ${total}`;
    }

    // 9. Generate reasoning
    const reasoning: string[] = [];
    reasoning.push(`Odds imply ${favorite} has ${(fairOdds.home * 100).toFixed(1)}% win probability`);
    reasoning.push(`Home advantage adds ~${(PREDICTION_WEIGHTS.homeAdvantage * 100).toFixed(0)}% boost`);
    if (isPlayoffs) reasoning.push('Playoff game - motivation factor applied');

    // 10. Value rating
    const valueRating = this.calculateValueRating(favoriteProb, fairOdds.home);

    // 11. Recommendation
    let recommendation = '';
    if (valueRating >= 4) {
      recommendation = `STRONG PLAY: ${favorite} to win`;
    } else if (valueRating >= 3) {
      recommendation = `LEAN: ${favorite} to win`;
    } else {
      recommendation = `PASS: No clear edge detected`;
    }

    return {
      homeWinProbability: homeProb * 100,
      awayWinProbability: awayProb * 100,
      confidence: Math.min(confidence, 95),
      recommendation,
      spreadPick,
      totalPick,
      valueRating,
      reasoning,
    };
  }

  // Batch predictions for multiple games
  static predictBatch(games: PredictionInput[]): PredictionResult[] {
    return games.map((game) => this.predict(game));
  }
}

// ============================================
// FETCH PREDICTIONS FROM FREE APIs
// ============================================
export async function fetchPredictions(sport: string): Promise<PredictionInput[]> {
  const predictions: PredictionInput[] = [];

  try {
    // Try ESPN first (free, no key required)
    const espnData = await fetchESPNScores(sport);
    if (espnData.length > 0) {
      return espnData.map((game) => ({
        sport,
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        homeOdds: -110, // Default odds if not available
        awayOdds: -110,
        gameTime: game.gameTime,
        venue: game.venue,
      }));
    }
  } catch (error) {
    console.error('Error fetching predictions:', error);
  }

  return predictions;
}

// ESPN Free API
async function fetchESPNScores(sport: string): Promise<Array<{
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  venue: string;
  homeScore?: number;
  awayScore?: number;
  status: string;
}>> {
  const sportKey = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]?.espnKey;
  if (!sportKey) return [];

  try {
    const response = await fetch(
      `${API_CONFIG.ESPN.SCOREBOARD_URL}/${sportKey}/scoreboard`
    );
    const data = await response.json();

    return (data.events || []).map((event: {
      name: string;
      date: string;
      competitions: Array<{
        venue?: { fullName?: string };
        competitors: Array<{
          homeAway: string;
          team: { displayName: string };
          score?: string;
        }>;
        status?: { type?: { description?: string } };
      }>;
    }) => {
      const competition = event.competitions?.[0];
      const home = competition?.competitors?.find((c) => c.homeAway === 'home');
      const away = competition?.competitors?.find((c) => c.homeAway === 'away');

      return {
        homeTeam: home?.team?.displayName || 'TBD',
        awayTeam: away?.team?.displayName || 'TBD',
        gameTime: event.date,
        venue: competition?.venue?.fullName || 'TBD',
        homeScore: home?.score ? parseInt(home.score) : undefined,
        awayScore: away?.score ? parseInt(away.score) : undefined,
        status: competition?.status?.type?.description || 'Scheduled',
      };
    });
  } catch {
    return [];
  }
}
