// ============================================
// KCMPICKS - Historical Odds Proxy (server-side)
// Fetches The Odds API historical endpoint with the key held server-side.
// Historical odds cost 10x credits; this route is intentionally un-cached
// and should be called sparingly (e.g. for model training, not per user).
// ============================================

import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api/auth';
import { applyCors, handleOptions } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

const BASE_URL = 'https://api.the-odds-api.com/v4';

const SPORT_KEYS: Record<string, string> = {
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  mlb: 'baseball_mlb',
  soccer: 'soccer_epl',
  ufc: 'mma_mixed_martial_arts',
  'college-football': 'americanfootball_ncaaf',
  'college-basketball': 'basketball_ncaab',
};

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return applyCors(auth.response);

  const apiKey = process.env.ODDS_API_KEY;
  if (!apiKey) {
    return applyCors(
      NextResponse.json(
        { error: 'Historical odds not configured. Set ODDS_API_KEY (server-side).' },
        { status: 503 }
      )
    );
  }

  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const daysBackRaw = searchParams.get('daysBack');
  const daysBack = Math.min(Math.max(parseInt(daysBackRaw ?? '30', 10) || 30, 1), 90);

  if (!sport || !SPORT_KEYS[sport]) {
    return applyCors(
      NextResponse.json(
        { error: `Unsupported sport. Options: ${Object.keys(SPORT_KEYS).join(', ')}` },
        { status: 400 }
      )
    );
  }

  try {
    const response = await fetch(
      `${BASE_URL}/sports/${SPORT_KEYS[sport]}/historical/?apiKey=${apiKey}&regions=us&daysFrom=${daysBack}&oddsFormat=american`,
      { cache: 'no-store', signal: AbortSignal.timeout(30000) }
    );

    if (response.status === 401 || response.status === 403) {
      return applyCors(
        NextResponse.json({ error: 'Invalid or expired Odds API key' }, { status: 502 })
      );
    }

    if (response.status === 429) {
      return applyCors(
        NextResponse.json({ error: 'Odds API rate limit reached' }, { status: 429 })
      );
    }

    if (!response.ok) {
      return applyCors(
        NextResponse.json(
          { error: `Odds API error: ${response.status}` },
          { status: 502 }
        )
      );
    }

    const payload = await response.json();
    return applyCors(NextResponse.json(payload));
  } catch (error) {
    console.error(
      '[historical-odds] fetch failed:',
      error instanceof Error ? error.message : error
    );
    return applyCors(
      NextResponse.json({ error: 'Failed to fetch historical odds' }, { status: 502 })
    );
  }
}
