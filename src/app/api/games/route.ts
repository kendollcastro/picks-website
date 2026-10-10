// ============================================
// KCMPICKS - Games/odds from Supabase (scraped feed)
// Reads the `games` table written by odds-scraper (ESPN public JSON).
// Additive to /api/odds (The Odds API proxy) — hooks can prefer this route
// and fall back to the existing providers.
//
// Query params:
//   sport   - kcmpicks sport key (nba, nfl, mlb, nhl, soccer, ...)
//   league  - ESPN league slug (nba, eng.1, usa.1, ...)
//   status  - scheduled | in | post | postponed | cancelled
//   from    - ISO date/datetime (commence_time >= from)
//   to      - ISO date/datetime (commence_time <= to)
//   limit   - max rows (default 200, max 500)
// ============================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60 * 1000;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

interface GameRow {
  id: string;
  sport: string;
  league: string;
  home_team: string;
  away_team: string;
  home_abbr: string | null;
  away_abbr: string | null;
  home_id: string | null;
  away_id: string | null;
  home_logo: string | null;
  away_logo: string | null;
  commence_time: string | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  venue: string | null;
  provider: string | null;
  home_moneyline: number | null;
  away_moneyline: number | null;
  draw_moneyline: number | null;
  spread: number | null;
  home_spread_odds: number | null;
  away_spread_odds: number | null;
  total: number | null;
  over_odds: number | null;
  under_odds: number | null;
  odds_captured_at: string | null;
  updated_at: string | null;
}

/** Flat camelCase shape expected by kcmpicks hooks/UI. */
export interface GameOdds {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeAbbr: string | null;
  awayAbbr: string | null;
  homeId: string | null;
  awayId: string | null;
  homeLogo: string | null;
  awayLogo: string | null;
  gameTime: string | null;
  status: 'scheduled' | 'in' | 'post' | 'postponed' | 'cancelled' | string;
  homeScore: number | null;
  awayScore: number | null;
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
  oddsCapturedAt: string | null;
  updatedAt: string | null;
}

function rowToGame(row: GameRow): GameOdds {
  return {
    id: row.id,
    sport: row.sport,
    league: row.league,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    homeAbbr: row.home_abbr,
    awayAbbr: row.away_abbr,
    homeId: row.home_id,
    awayId: row.away_id,
    homeLogo: row.home_logo,
    awayLogo: row.away_logo,
    gameTime: row.commence_time,
    status: row.status,
    homeScore: row.home_score,
    awayScore: row.away_score,
    venue: row.venue,
    provider: row.provider,
    homeMoneyline: row.home_moneyline,
    awayMoneyline: row.away_moneyline,
    drawMoneyline: row.draw_moneyline,
    spread: row.spread === null ? null : Number(row.spread),
    homeSpreadOdds: row.home_spread_odds,
    awaySpreadOdds: row.away_spread_odds,
    total: row.total === null ? null : Number(row.total),
    overOdds: row.over_odds,
    underOdds: row.under_odds,
    oddsCapturedAt: row.odds_captured_at,
    updatedAt: row.updated_at,
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // Service role stays server-side; the games table also allows public read,
  // but service role avoids any RLS surprises from the route layer.
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    return null;
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const league = searchParams.get('league');
  const status = searchParams.get('status');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limitRaw = searchParams.get('limit');
  const limit = Math.min(
    Math.max(parseInt(limitRaw ?? '', 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const cacheKey = [sport, league, status, from, to, limit].join('|');
  const entry = cache.get(cacheKey);
  if (entry && Date.now() - entry.fetchedAt <= CACHE_TTL_MS) {
    return NextResponse.json(entry.data, { headers: { 'x-games-cache': 'hit' } });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Games feed not configured. Set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  try {
    let query = supabase
      .from('games')
      .select('*')
      .order('commence_time', { ascending: false })
      .limit(limit);

    if (sport) query = query.eq('sport', sport);
    if (league) query = query.eq('league', league);
    if (status) query = query.eq('status', status);
    if (from) query = query.gte('commence_time', from);
    if (to) query = query.lte('commence_time', to);

    const { data, error } = await query;
    if (error) {
      console.error('[games] Supabase query failed:', error.message);
      return NextResponse.json({ error: 'Failed to read games' }, { status: 502 });
    }

    const games = (data ?? []).map(rowToGame);
    const payload = { count: games.length, games };
    cache.set(cacheKey, { data: payload, fetchedAt: Date.now() });

    return NextResponse.json(payload, { headers: { 'x-games-cache': 'miss' } });
  } catch (error) {
    console.error('[games] unexpected error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to read games' }, { status: 502 });
  }
}
