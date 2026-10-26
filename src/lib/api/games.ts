// ============================================
// KCMPICKS - Scraped games feed client (browser)
// Reads GET /api/games → Supabase `games` table written by odds-scraper
// (ESPN/DraftKings public feed). Free, no credits, includes spread/total
// prices, draw moneyline, venue and status — richer than OddsPapi.
// ============================================

export interface ScrapedGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string | null;
  awayAbbr: string | null;
  homeLogo: string | null;
  awayLogo: string | null;
  gameTime: string | null;
  status: 'scheduled' | 'in' | 'post' | 'postponed' | 'cancelled' | string;
  venue: string | null;
  provider: string | null;
  homeMoneyline: number | null;
  awayMoneyline: number | null;
  drawMoneyline: number | null;
  spread: number | null;
  homeSpreadOdds: number | null;
  awaySpreadOdds: number | null;
  total: number | null;
  overOdds: number | null;
  underOdds: number | null;
  openingHomeMoneyline: number | null;
  openingAwayMoneyline: number | null;
  openingSpread: number | null;
  openingHomeSpreadOdds: number | null;
  openingAwaySpreadOdds: number | null;
  openingTotal: number | null;
  openingOverOdds: number | null;
  openingUnderOdds: number | null;
  openingOddsCapturedAt: string | null;
  oddsCapturedAt: string | null;
}

export interface FetchScrapedGamesOptions {
  sport?: string;
  league?: string;
  /** Default 'scheduled' — only pre-game rows (odds are gone once final). */
  status?: string;
  from?: string;
  to?: string;
  limit?: number;
}

export async function fetchScrapedGames(
  options: FetchScrapedGamesOptions = {}
): Promise<ScrapedGame[]> {
  const params = new URLSearchParams();
  if (options.sport) params.set('sport', options.sport);
  if (options.league) params.set('league', options.league);
  if (options.status) params.set('status', options.status);
  if (options.from) params.set('from', options.from);
  if (options.to) params.set('to', options.to);
  if (options.limit) params.set('limit', String(options.limit));

  const query = params.toString();
  const response = await fetch(`/api/games${query ? `?${query}` : ''}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Games feed error: ${response.status}`);
  }

  const data = (await response.json()) as { games?: ScrapedGame[] };
  return Array.isArray(data.games) ? data.games : [];
}
