// ============================================
// KCMPICKS - Betting Splits Client Service
// Reads public betting splits from /api/betting-splits.
// ============================================

export interface BettingSplit {
  id: number;
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string | null;
  source: string;
  homeBetPct: number | null;
  awayBetPct: number | null;
  homeMoneyPct: number | null;
  awayMoneyPct: number | null;
  homeBigBetPct: number | null;
  awayBigBetPct: number | null;
  notes: string | null;
  capturedAt: string;
}

export interface BettingSplitsResponse {
  count: number;
  splits: BettingSplit[];
}

export async function fetchBettingSplits(
  sport?: string,
  gameId?: string,
  source?: string
): Promise<BettingSplitsResponse> {
  const params = new URLSearchParams();
  if (sport) params.set('sport', sport);
  if (gameId) params.set('gameId', gameId);
  if (source) params.set('source', source);
  params.set('limit', '200');

  const response = await fetch(`/api/betting-splits?${params.toString()}`, { cache: 'no-store' });
  if (!response.ok) {
    // Betting splits are supplemental data; don't crash the predictions flow.
    console.warn('[betting-splits] fetch returned %s, returning empty splits', response.status);
    return { count: 0, splits: [] };
  }
  return (await response.json()) as BettingSplitsResponse;
}

/**
 * Match a split row to a game by team names. Returns null if no confident match.
 */
export function findSplitForGame(
  splits: BettingSplit[],
  homeTeam: string,
  awayTeam: string
): BettingSplit | null {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
  const homeNorm = normalize(homeTeam);
  const awayNorm = normalize(awayTeam);

  return (
    splits.find((s) => {
      const sHome = normalize(s.homeTeam);
      const sAway = normalize(s.awayTeam);
      return (
        (sHome.includes(homeNorm) || homeNorm.includes(sHome)) &&
        (sAway.includes(awayNorm) || awayNorm.includes(sAway))
      );
    }) ?? null
  );
}
