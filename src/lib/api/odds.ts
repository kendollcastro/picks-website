// ============================================
// KCMPICKS - Odds Service
// Real-time odds from multiple free APIs
// ============================================

import { API_CONFIG } from './config';

// ============================================
// TYPES
// ============================================
export interface GameOdds {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  bookmakers: BookmakerOdds[];
  bestOdds: {
    homeMoneyline: number;
    awayMoneyline: number;
    homeSpread: number;
    awaySpread: number;
    spreadHomeOdds: number;
    spreadAwayOdds: number;
    totalOver: number;
    totalUnder: number;
    totalOverOdds: number;
    totalUnderOdds: number;
  };
}

export interface BookmakerOdds {
  name: string;
  lastUpdate: string;
  markets: {
    moneyline?: {
      home: number;
      away: number;
    };
    spread?: {
      home: number;
      away: number;
      point: number;
    };
    total?: {
      over: number;
      under: number;
      point: number;
    };
  };
}

// ============================================
// THE ODDS API SERVICE (Free: 500 req/month)
// ============================================
export class TheOddsAPIService {
  private static baseUrl = API_CONFIG.ODDS_API.BASE_URL;
  private static apiKey = API_CONFIG.ODDS_API.KEY;

  // Get odds for a specific sport
  static async getOdds(sport: string): Promise<GameOdds[]> {
    const sportKey = API_CONFIG.ODDS_API.SPORTS[sport as keyof typeof API_CONFIG.ODDS_API.SPORTS];
    if (!sportKey || !this.apiKey) return [];

    try {
      const url = `${this.baseUrl}/sports/${sportKey}/odds/?apiKey=${this.apiKey}&regions=${API_CONFIG.ODDS_API.REGIONS}&markets=${API_CONFIG.ODDS_API.MARKETS}&oddsFormat=american`;

      const response = await fetch(url, {
        next: { revalidate: 60 }, // Cache for 1 minute
      });

      if (!response.ok) {
        console.error('Odds API error:', response.status);
        return [];
      }

      const data = await response.json();
      return this.transformData(data, sport);
    } catch (error) {
      console.error('Error fetching odds:', error);
      return [];
    }
  }

  // Get odds for all sports
  static async getAllOdds(): Promise<GameOdds[]> {
    const sports = Object.keys(API_CONFIG.ODDS_API.SPORTS);
    const results = await Promise.allSettled(
      sports.map((sport) => this.getOdds(sport))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<GameOdds[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value);
  }

  // Transform API response to our format
  private static transformData(data: Array<{
    id: string;
    sport_key: string;
    commence_time: string;
    home_team: string;
    away_team: string;
    bookmakers: Array<{
      key: string;
      title: string;
      last_update: string;
      markets: Array<{
        key: string;
        outcomes: Array<{
          name: string;
          price: number;
          point?: number;
        }>;
      }>;
    }>;
  }>, sport: string): GameOdds[] {
    return data.map((game) => {
      const bookmakers: BookmakerOdds[] = game.bookmakers.map((bm) => {
        const moneylineMarket = bm.markets.find((m) => m.key === 'h2h');
        const spreadMarket = bm.markets.find((m) => m.key === 'spreads');
        const totalMarket = bm.markets.find((m) => m.key === 'totals');

        return {
          name: bm.title,
          lastUpdate: bm.last_update,
          markets: {
            moneyline: moneylineMarket ? {
              home: moneylineMarket.outcomes.find((o) => o.name === game.home_team)?.price || 0,
              away: moneylineMarket.outcomes.find((o) => o.name === game.away_team)?.price || 0,
            } : undefined,
            spread: spreadMarket ? {
              home: spreadMarket.outcomes.find((o) => o.name === game.home_team)?.price || 0,
              away: spreadMarket.outcomes.find((o) => o.name === game.away_team)?.price || 0,
              point: spreadMarket.outcomes.find((o) => o.name === game.home_team)?.point || 0,
            } : undefined,
            total: totalMarket ? {
              over: totalMarket.outcomes.find((o) => o.name === 'Over')?.price || 0,
              under: totalMarket.outcomes.find((o) => o.name === 'Under')?.price || 0,
              point: totalMarket.outcomes.find((o) => o.name === 'Over')?.point || 0,
            } : undefined,
          },
        };
      });

      // Find best odds across all bookmakers
      const bestOdds = this.findBestOdds(bookmakers, game.home_team, game.away_team);

      return {
        id: game.id,
        sport,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        gameTime: game.commence_time,
        bookmakers,
        bestOdds,
      };
    });
  }

  // Find best odds across bookmakers
  private static findBestOdds(
    bookmakers: BookmakerOdds[],
    _homeTeam: string,
    _awayTeam: string
  ): GameOdds['bestOdds'] {
    let bestHomeMoneyline = -Infinity;
    let bestAwayMoneyline = -Infinity;
    let bestSpreadHome = -Infinity;
    let bestSpreadAway = -Infinity;
    let bestSpreadPoint = 0;
    let bestTotalOver = -Infinity;
    let bestTotalUnder = -Infinity;
    let bestTotalPoint = 0;

    for (const bm of bookmakers) {
      if (bm.markets.moneyline) {
        if (bm.markets.moneyline.home > bestHomeMoneyline) {
          bestHomeMoneyline = bm.markets.moneyline.home;
        }
        if (bm.markets.moneyline.away > bestAwayMoneyline) {
          bestAwayMoneyline = bm.markets.moneyline.away;
        }
      }
      if (bm.markets.spread) {
        if (bm.markets.spread.home > bestSpreadHome) {
          bestSpreadHome = bm.markets.spread.home;
          bestSpreadPoint = bm.markets.spread.point;
        }
        if (bm.markets.spread.away > bestSpreadAway) {
          bestSpreadAway = bm.markets.spread.away;
        }
      }
      if (bm.markets.total) {
        if (bm.markets.total.over > bestTotalOver) {
          bestTotalOver = bm.markets.total.over;
          bestTotalPoint = bm.markets.total.point;
        }
        if (bm.markets.total.under > bestTotalUnder) {
          bestTotalUnder = bm.markets.total.under;
        }
      }
    }

    return {
      homeMoneyline: bestHomeMoneyline === -Infinity ? -110 : bestHomeMoneyline,
      awayMoneyline: bestAwayMoneyline === -Infinity ? -110 : bestAwayMoneyline,
      homeSpread: bestSpreadPoint,
      awaySpread: -bestSpreadPoint,
      spreadHomeOdds: bestSpreadHome === -Infinity ? -110 : bestSpreadHome,
      spreadAwayOdds: bestSpreadAway === -Infinity ? -110 : bestSpreadAway,
      totalOver: bestTotalPoint,
      totalUnder: bestTotalPoint,
      totalOverOdds: bestTotalOver === -Infinity ? -110 : bestTotalOver,
      totalUnderOdds: bestTotalUnder === -Infinity ? -110 : bestTotalUnder,
    };
  }

  // Get remaining API requests
  static async getRemainingRequests(): Promise<{ remaining: number; used: number }> {
    if (!this.apiKey) return { remaining: 0, used: 0 };

    try {
      const response = await fetch(
        `${this.baseUrl}/sports/?apiKey=${this.apiKey}`
      );
      return {
        remaining: parseInt(response.headers.get('x-requests-remaining') || '0'),
        used: parseInt(response.headers.get('x-requests-used') || '0'),
      };
    } catch {
      return { remaining: 0, used: 0 };
    }
  }
}

// ============================================
// ODDS UTILITIES
// ============================================
export class OddsUtils {
  // Convert American odds to decimal
  static americanToDecimal(american: number): number {
    if (american > 0) {
      return 1 + american / 100;
    } else {
      return 1 + 100 / Math.abs(american);
    }
  }

  // Convert decimal to American odds
  static decimalToAmerican(decimal: number): number {
    if (decimal >= 2) {
      return (decimal - 1) * 100;
    } else {
      return -100 / (decimal - 1);
    }
  }

  // Calculate implied probability
  static impliedProbability(american: number): number {
    if (american > 0) {
      return 100 / (american + 100);
    } else {
      return Math.abs(american) / (Math.abs(american) + 100);
    }
  }

  // Calculate payout for a $100 bet
  static calculatePayout(stake: number, american: number): number {
    if (american > 0) {
      return stake + stake * (american / 100);
    } else {
      return stake + stake * (100 / Math.abs(american));
    }
  }

  // Calculate expected value
  static expectedValue(
    stake: number,
    american: number,
    winProbability: number
  ): number {
    const payout = this.calculatePayout(stake, american);
    const ev = winProbability * (payout - stake) - (1 - winProbability) * stake;
    return ev;
  }

  // Format odds for display
  static formatOdds(american: number): string {
    if (american > 0) return `+${american}`;
    return `${american}`;
  }

  // Find value bets (positive EV)
  static findValueBets(
    games: GameOdds[],
    predictions: Array<{ homeTeam: string; homeWinProbability: number }>
  ): Array<{
    game: GameOdds;
    pick: string;
    edge: number;
    ev: number;
  }> {
    const valueBets: Array<{
      game: GameOdds;
      pick: string;
      edge: number;
      ev: number;
    }> = [];

    for (const game of games) {
      const prediction = predictions.find(
        (p) => p.homeTeam === game.homeTeam
      );
      if (!prediction) continue;

      const homeImplied = this.impliedProbability(game.bestOdds.homeMoneyline);
      const edge = prediction.homeWinProbability / 100 - homeImplied;

      if (edge > 0.03) {
        // 3%+ edge
        const ev = this.expectedValue(100, game.bestOdds.homeMoneyline, prediction.homeWinProbability / 100);
        valueBets.push({
          game,
          pick: game.homeTeam,
          edge: edge * 100,
          ev,
        });
      }
    }

    return valueBets.sort((a, b) => b.edge - a.edge);
  }
}
