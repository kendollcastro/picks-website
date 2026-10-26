// ============================================
// KCMPICKS - OddsPapi Client Service
// https://oddspapi.com (FREE: 250 requests/month, incl. Pinnacle)
// Moneyline (1X2) odds channel — the only OddsPapi market currently integrated.
// SERVER-ONLY: uses the server-side ODDS_PAPI_KEY env var. The browser
// client lives in oddspapi-client.ts and calls /api/oddspapi so the key
// is never exposed in the client bundle.
// ============================================

const ODDS_PAPI_BASE = 'https://api.oddspapi.io/v4';

export const ODDS_PAPI_SPORT_IDS: Record<string, number> = {
  nba: 11, // basketball
  nfl: 14, // american football
  mlb: 13, // baseball
  soccer: 10,
  ufc: 20, // mma
  'college-football': 14,
  'college-basketball': 11,
  'womens-basketball': 11,
};

export function convertDecimalToAmerican(decimal: number): number {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

export interface OddsPapiGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homeMoneyline: number; // american format
  awayMoneyline: number; // american format
  bookmaker: string;
}

interface Fixture {
  fixtureId: string;
  participant1Name?: string;
  participant2Name?: string;
  startTime?: string;
}

// ============================================
// FETCH ODDS (moneyline only)
// ============================================
export async function fetchOddsPapiGames(
  sport: string,
  limit: number = 10
): Promise<OddsPapiGame[]> {
  // Server-side only: never use NEXT_PUBLIC_ for this key. The browser
  // reaches OddsPapi through /api/oddspapi (see oddspapi-client.ts).
  const apiKey = process.env.ODDS_PAPI_KEY || process.env.ODDSPAPI_KEY;

  if (!apiKey) {
    console.warn('No OddsPapi key configured (set ODDS_PAPI_KEY server-side)');
    return [];
  }

  const sportId = ODDS_PAPI_SPORT_IDS[sport];
  if (!sportId) return [];

  try {
    const now = new Date();
    const future = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const fixturesResponse = await fetch(
      `${ODDS_PAPI_BASE}/fixtures?sportId=${sportId}&from=${now.toISOString()}&to=${future.toISOString()}&apiKey=${apiKey}`
    );

    if (fixturesResponse.status === 429) {
      console.warn('OddsPapi rate limit reached');
      return [];
    }

    if (!fixturesResponse.ok) {
      console.error('OddsPapi fixtures error:', fixturesResponse.status);
      return [];
    }

    const fixturesData = (await fixturesResponse.json()) as Fixture[];
    if (!Array.isArray(fixturesData) || fixturesData.length === 0) {
      return [];
    }

    const games: OddsPapiGame[] = [];

    for (const fixture of fixturesData.slice(0, limit)) {
      try {
        const oddsResponse = await fetch(
          `${ODDS_PAPI_BASE}/odds?fixtureId=${fixture.fixtureId}&marketId=1&apiKey=${apiKey}`
        );

        if (oddsResponse.status === 429) {
          console.warn('OddsPapi rate limit during odds fetch');
          break;
        }

        if (!oddsResponse.ok) continue;

        const oddsData = (await oddsResponse.json()) as {
          bookmakerOdds?: Record<
            string,
            { markets?: { '1'?: { outcomes?: Record<string, { players?: Record<string, { price: number }> }> } } }
          >;
        };

        if (!oddsData.bookmakerOdds) continue;

        // Find best moneyline from available bookmakers
        let bestHomeOdds = -110;
        let bestAwayOdds = -110;
        let bestBookmaker = 'N/A';

        for (const [bookmaker, data] of Object.entries(oddsData.bookmakerOdds)) {
          const marketData = data.markets?.['1'];
          if (!marketData?.outcomes) continue;

          // outcome_1 = home, draw = X, outcome_2 = away
          const homeOdds = marketData.outcomes?.['1']?.players?.['0']?.price;
          const awayOdds = marketData.outcomes?.['2']?.players?.['0']?.price;

          if (
            homeOdds &&
            awayOdds &&
            (homeOdds > bestHomeOdds || awayOdds > bestAwayOdds)
          ) {
            bestHomeOdds = convertDecimalToAmerican(homeOdds);
            bestAwayOdds = convertDecimalToAmerican(awayOdds);
            bestBookmaker = bookmaker;
          }
        }

        games.push({
          id: fixture.fixtureId,
          sport,
          homeTeam: fixture.participant1Name || 'Home',
          awayTeam: fixture.participant2Name || 'Away',
          gameTime: fixture.startTime || new Date().toISOString(),
          homeMoneyline: bestHomeOdds,
          awayMoneyline: bestAwayOdds,
          bookmaker: bestBookmaker,
        });
      } catch (e) {
        console.warn('Error processing OddsPapi fixture:', e);
      }
    }

    return games;
  } catch (error) {
    console.error('Error fetching from OddsPapi:', error);
    return [];
  }
}