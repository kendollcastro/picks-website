// ============================================
// KCMPICKS - OddsPapi Browser Client
// Calls the server-side /api/oddspapi proxy so the API key never ships
// to the browser. Safe to import from 'use client' components.
// ============================================

export interface OddsPapiGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homeMoneyline: number;
  awayMoneyline: number;
  bookmaker: string;
}

export async function fetchOddsPapiGames(
  sport: string,
  limit: number = 10
): Promise<OddsPapiGame[]> {
  const params = new URLSearchParams({ sport, limit: String(limit) });
  const response = await fetch(`/api/oddspapi?${params.toString()}`, {
    cache: 'no-store',
  });

  if (!response.ok) {
    console.error('OddsPapi proxy error:', response.status, response.statusText);
    return [];
  }

  const data = (await response.json()) as { games?: OddsPapiGame[] };
  return Array.isArray(data.games) ? data.games : [];
}
