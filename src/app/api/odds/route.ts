// ============================================
// KCMPICKS - Odds Proxy (server-side)
// Fetches The Odds API with the key held server-side and caches per sport so
// every user/poll doesn't burn credits upstream. Client hooks call this route
// instead of hitting The Odds API directly with a NEXT_PUBLIC key.
//
// Credit protection:
//  - 15-min per-sport cache (dedupes all users + the 30-90s client polls).
//  - Hard hourly budget on upstream calls; beyond it we serve the last fresh
//    snapshot (stale) instead of spending more credits, or 429 if never seen.
// ============================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export const CACHE_TTL_MS = 15 * 60 * 1000;
const MAX_UPSTREAM_PER_HOUR = 8;
const BASE_URL = 'https://api.the-odds-api.com/v4';

const SPORT_KEYS: Record<string, string> = {
  nba: 'basketball_nba',
  nfl: 'americanfootball_nfl',
  mlb: 'baseball_mlb',
  soccer: 'soccer_epl',
  ufc: 'mma_mixed_martial_arts',
  'college-football': 'americanfootball_ncaaf',
  'college-basketball': 'basketball_ncaab',
  'womens-basketball': 'basketball_wncaab',
};

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
  creditHeaders: Record<string, string>;
}

/** Per-sport snapshots. Entries may outlive the TTL so we can serve stale data
 *  when the hourly upstream budget is exhausted. */
const cache = new Map<string, CacheEntry>();
/** Rolling timestamps of upstream calls used to enforce the hourly budget. */
const upstreamCalls: number[] = [];

function upstreamCountInLastHour(): number {
  const hourAgo = Date.now() - 60 * 60 * 1000;
  while (upstreamCalls.length > 0 && upstreamCalls[0] < hourAgo) upstreamCalls.shift();
  return upstreamCalls.length;
}

function recordUpstreamCall(): void {
  upstreamCalls.push(Date.now());
}

export async function GET(request: Request) {
  const apiKey = process.env.ODDS_API_KEY || process.env.NEXT_PUBLIC_ODDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Odds service not configured. Set ODDS_API_KEY (server-side).' },
      { status: 503 }
    );
  }

  const sport = new URL(request.url).searchParams.get('sport');
  if (!sport) {
    return NextResponse.json({ error: 'Missing "sport" query param' }, { status: 400 });
  }

  const sportKey = SPORT_KEYS[sport];
  if (!sportKey) {
    return NextResponse.json({ error: `Unsupported sport: ${sport}` }, { status: 400 });
  }

  const entry = cache.get(sportKey);
  const isFresh = entry && Date.now() - entry.fetchedAt <= CACHE_TTL_MS;
  if (entry && isFresh) {
    return NextResponse.json(entry.data, { headers: entry.creditHeaders });
  }

  // Over the hourly budget: serve the last snapshot, or refuse if we have none.
  if (upstreamCountInLastHour() >= MAX_UPSTREAM_PER_HOUR) {
    if (entry) {
      return NextResponse.json(entry.data, {
        headers: {
          ...entry.creditHeaders,
          'x-odds-stale': 'true',
        },
      });
    }
    return NextResponse.json(
      { error: 'Odds credit budget exhausted for this hour. Try again later.' },
      { status: 429 }
    );
  }

  try {
    recordUpstreamCall();
    const url = `${BASE_URL}/sports/${sportKey}/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals&oddsFormat=american`;
    const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(15000) });

    const creditHeaders: Record<string, string> = {};
    for (const name of ['x-requests-remaining', 'x-requests-used'] as const) {
      const value = response.headers.get(name);
      if (value) creditHeaders[name] = value;
    }
    console.log(
      `[odds-proxy] upstream ${sport} (${sportKey}) -> ${response.status} | remaining credits: ${
        creditHeaders['x-requests-remaining'] ?? '?'
      }`
    );

    if (response.status === 401 || response.status === 403) {
      return NextResponse.json({ error: 'Invalid or expired Odds API key' }, { status: 502 });
    }

    if (response.status === 429) {
      return NextResponse.json({ error: 'Odds API rate limit reached' }, { status: 429 });
    }

    if (!response.ok) {
      return NextResponse.json({ error: `Odds API error: ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Unexpected Odds API response' }, { status: 502 });
    }

    cache.set(sportKey, { data, fetchedAt: Date.now(), creditHeaders });

    return NextResponse.json(data, { headers: creditHeaders });
  } catch (error) {
    console.error('Odds proxy fetch failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to fetch odds' }, { status: 502 });
  }
}