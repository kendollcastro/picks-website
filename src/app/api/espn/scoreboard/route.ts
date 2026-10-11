// ============================================
// KCMPICKS - ESPN scoreboard proxy
// Browser-direct calls to site.api.espn.com get CORS-blocked, so the
// dashboard/live pages fetch through this server route instead (no API
// key needed; ESPN is public). Responses are cached per sport for 60s.
// ============================================

import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const ESPN_BASE = 'https://site.api.espn.com/apis/site/v2/sports';
const CACHE_TTL_MS = 60 * 1000;

const SPORT_PATHS: Record<string, string> = {
  nba: 'basketball/nba',
  nfl: 'football/nfl',
  mlb: 'baseball/mlb',
  soccer: 'soccer/eng.1',
  ufc: 'mma/ufc',
  'college-football': 'football/college-football',
  'college-basketball': 'basketball/mens-college-basketball',
  'womens-basketball': 'basketball/wnba',
};

// ESPN rejects default bot UAs (same lesson as the odds-scraper).
const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

interface EspnCompetitor {
  homeAway?: string;
  team?: { displayName?: string; logo?: string; abbreviation?: string };
  score?: string;
}

interface EspnEvent {
  id?: string;
  date?: string;
  competitions?: Array<{
    competitors?: EspnCompetitor[];
    status?: {
      type?: { state?: string; description?: string; detail?: string };
      displayClock?: string;
      period?: number;
    };
  }>;
}

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');

  if (!sport || !SPORT_PATHS[sport]) {
    return NextResponse.json(
      { error: `Unknown sport. Options: ${Object.keys(SPORT_PATHS).join(', ')}` },
      { status: 400 }
    );
  }

  const entry = cache.get(sport);
  if (entry && Date.now() - entry.fetchedAt <= CACHE_TTL_MS) {
    return NextResponse.json(entry.data, { headers: { 'x-espn-cache': 'hit' } });
  }

  try {
    const response = await fetch(`${ESPN_BASE}/${SPORT_PATHS[sport]}/scoreboard`, {
      headers: REQUEST_HEADERS,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `ESPN responded ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { events?: EspnEvent[] };

    const games = (data.events ?? []).map((event) => {
      const comp = event.competitions?.[0];
      const home = comp?.competitors?.find((c) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c) => c.homeAway === 'away');
      const statusType = comp?.status?.type;

      return {
        id: event.id ?? '',
        sport,
        homeTeam: home?.team?.displayName || 'TBD',
        awayTeam: away?.team?.displayName || 'TBD',
        homeAbbr: home?.team?.abbreviation || null,
        awayAbbr: away?.team?.abbreviation || null,
        homeScore: home?.score ? parseInt(home.score, 10) : 0,
        awayScore: away?.score ? parseInt(away.score, 10) : 0,
        status: statusType?.description || 'Scheduled',
        period: statusType?.detail || '',
        clock: comp?.status?.displayClock || '',
        isLive: statusType?.state === 'in',
        gameTime: event.date ?? new Date().toISOString(),
        homeLogo: home?.team?.logo || '',
        awayLogo: away?.team?.logo || '',
      };
    });

    const payload = { count: games.length, games };
    cache.set(sport, { data: payload, fetchedAt: Date.now() });
    return NextResponse.json(payload, { headers: { 'x-espn-cache': 'miss' } });
  } catch (error) {
    console.error('[espn-proxy] fetch failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'ESPN fetch failed' }, { status: 502 });
  }
}
