// ============================================
// KCMPICKS - OddsPapi Proxy (server-side)
// Keeps the OddsPapi key out of the browser bundle. The client-side
// oddspapi.ts module calls this route when running in the browser.
// ============================================

import { NextResponse } from 'next/server';
import { fetchOddsPapiGames } from '@/lib/api/oddspapi';
import { requireAuth } from '@/lib/api/auth';
import { applyCors, handleOptions } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

const SUPPORTED_SPORTS = [
  'nba',
  'nfl',
  'mlb',
  'soccer',
  'ufc',
  'college-football',
  'college-basketball',
  'womens-basketball',
];

export async function OPTIONS() {
  return handleOptions();
}

export async function GET(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return applyCors(auth.response);

  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const limitRaw = searchParams.get('limit');
  const limit = Math.min(Math.max(parseInt(limitRaw ?? '10', 10) || 10, 1), 25);

  if (!sport || !SUPPORTED_SPORTS.includes(sport)) {
    return applyCors(
      NextResponse.json(
        { error: `Unsupported sport. Supported: ${SUPPORTED_SPORTS.join(', ')}` },
        { status: 400 }
      )
    );
  }

  try {
    const games = await fetchOddsPapiGames(sport, limit);
    return applyCors(NextResponse.json({ games }));
  } catch (error) {
    console.error('[oddspapi-proxy] failed:', error instanceof Error ? error.message : error);
    return applyCors(NextResponse.json({ error: 'OddsPapi fetch failed' }, { status: 502 }));
  }
}
