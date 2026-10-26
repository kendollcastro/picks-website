// ============================================
// KCMPICKS - ESPN injuries proxy
// Fetches the official injury report per sport/league. ESPN blocks direct
// browser calls, so we proxy server-side (no API key). Cached 60s.
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

const REQUEST_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36',
  Accept: 'application/json',
};

type InjuryStatus = 'OUT' | 'DOUBTFUL' | 'QUESTIONABLE' | 'PROBABLE' | 'DAY_TO_DAY' | 'INJURY_STATUS_UNSPECIFIED';

export interface InjuryEntry {
  id: string;
  name: string;
  position: string | null;
  team: string;
  teamAbbr: string | null;
  status: InjuryStatus;
  shortComment: string | null;
  longComment: string | null;
  returnDate: string | null;
  impactScore: number; // 0-10 derived from status + position
}

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

function normalizeStatus(status?: string): InjuryStatus {
  if (!status) return 'INJURY_STATUS_UNSPECIFIED';
  const s = status.toUpperCase().replace(/\s+/g, '_');
  if (s.includes('OUT')) return 'OUT';
  if (s.includes('DOUBTFUL')) return 'DOUBTFUL';
  if (s.includes('QUESTIONABLE')) return 'QUESTIONABLE';
  if (s.includes('PROBABLE')) return 'PROBABLE';
  if (s.includes('DAY') && s.includes('DAY')) return 'DAY_TO_DAY';
  return 'INJURY_STATUS_UNSPECIFIED';
}

function statusToImpact(status: InjuryStatus, position: string | null): number {
  const statusScores: Record<InjuryStatus, number> = {
    OUT: 10,
    DOUBTFUL: 8,
    QUESTIONABLE: 4,
    PROBABLE: 1,
    DAY_TO_DAY: 3,
    INJURY_STATUS_UNSPECIFIED: 2,
  };
  const base = statusScores[status] ?? 2;
  // Boost impact for premium positions.
  const premiumPositions = ['QB', 'RB', 'WR', 'PG', 'SG', 'SF', 'PF', 'C', 'SP', 'Ace', 'GK', 'ST', 'FW'];
  const isPremium = position && premiumPositions.some((p) => position.toUpperCase().includes(p));
  return Math.min(10, Math.round(base * (isPremium ? 1.4 : 1.0)));
}

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
    return NextResponse.json(entry.data, { headers: { 'x-espn-injuries-cache': 'hit' } });
  }

  try {
    const response = await fetch(`${ESPN_BASE}/${SPORT_PATHS[sport]}/injuries`, {
      headers: REQUEST_HEADERS,
      cache: 'no-store',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `ESPN responded ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as {
      injuries?: Array<{
        id?: string;
        type?: string;
        athlete?: {
          id?: string;
          displayName?: string;
          position?: { abbreviation?: string };
        };
        team?: { displayName?: string; abbreviation?: string };
        status?: string;
        details?: string;
        summary?: string;
        returnDate?: string;
        shortComment?: string;
      }>;
    };

    const injuries: InjuryEntry[] = (data.injuries ?? []).map((inj) => {
      const status = normalizeStatus(inj.status);
      const position = inj.athlete?.position?.abbreviation ?? null;
      return {
        id: inj.athlete?.id ?? inj.id ?? `${inj.athlete?.displayName}-${Math.random()}`,
        name: inj.athlete?.displayName ?? 'Unknown',
        position,
        team: inj.team?.displayName ?? 'Unknown',
        teamAbbr: inj.team?.abbreviation ?? null,
        status,
        shortComment: inj.shortComment ?? null,
        longComment: inj.details ?? inj.summary ?? null,
        returnDate: inj.returnDate ?? null,
        impactScore: statusToImpact(status, position),
      };
    });

    const payload = { sport, count: injuries.length, injuries };
    cache.set(sport, { data: payload, fetchedAt: Date.now() });
    return NextResponse.json(payload, { headers: { 'x-espn-injuries-cache': 'miss' } });
  } catch (error) {
    console.error('[espn-injuries] fetch failed:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'ESPN injuries fetch failed' }, { status: 502 });
  }
}
