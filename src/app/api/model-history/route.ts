// ============================================
// KCMPICKS - Model Pick History API
// Returns every AI value bet from the `top_picks` table for transparent
// tracking. Public read data; cached for 60 seconds.
// Query params:
//   sport    - filter by sport key
//   status   - pending | won | lost | push | void
//   betType  - moneyline | spread | total
//   limit    - max rows (default 200, max 500)
//   from     - ISO date (created_at >= from)
//   to       - ISO date (created_at <= to)
// ============================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const CACHE_TTL_MS = 60 * 1000;
const DEFAULT_LIMIT = 200;
const MAX_LIMIT = 500;

interface HistoryRow {
  id: string;
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  commence_time: string | null;
  bet_type: string;
  side: string;
  selection: string;
  line: number | null;
  odds: number;
  jev_probability: number | null;
  fair_probability: number | null;
  edge: number | null;
  expected_value: number | null;
  confidence: number | null;
  status: string;
  home_score: number | null;
  away_score: number | null;
  settled_at: string | null;
  run_id: string | null;
  created_at: string;
}

interface HistoryEntry {
  id: string;
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string | null;
  betType: string;
  side: string;
  selection: string;
  line: number | null;
  odds: number;
  jevProbability: number | null;
  fairProbability: number | null;
  edge: number | null;
  expectedValue: number | null;
  confidence: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  settledAt: string | null;
  runId: string | null;
  createdAt: string;
}

interface CacheEntry {
  data: unknown;
  fetchedAt: number;
}

const cache = new Map<string, CacheEntry>();

function rowToEntry(row: HistoryRow): HistoryEntry {
  return {
    id: row.id,
    gameId: row.game_id,
    sport: row.sport,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    commenceTime: row.commence_time,
    betType: row.bet_type,
    side: row.side,
    selection: row.selection,
    line: row.line === null ? null : Number(row.line),
    odds: row.odds,
    jevProbability: row.jev_probability === null ? null : Number(row.jev_probability),
    fairProbability: row.fair_probability === null ? null : Number(row.fair_probability),
    edge: row.edge === null ? null : Number(row.edge),
    expectedValue: row.expected_value === null ? null : Number(row.expected_value),
    confidence: row.confidence,
    status: row.status,
    homeScore: row.home_score,
    awayScore: row.away_score,
    settledAt: row.settled_at,
    runId: row.run_id,
    createdAt: row.created_at,
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  // top_picks is public read; service role avoids any RLS surprises.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function calculateStats(picks: HistoryEntry[]) {
  const graded = picks.filter((p) => p.status === 'won' || p.status === 'lost');
  const won = graded.filter((p) => p.status === 'won').length;
  const lost = graded.filter((p) => p.status === 'lost').length;
  const push = picks.filter((p) => p.status === 'push').length;
  const voidCount = picks.filter((p) => p.status === 'void').length;

  let profit = 0;
  let totalStaked = 0;
  for (const pick of graded) {
    totalStaked += 1; // model assumes 1 unit flat stake
    const odds = pick.odds;
    const profitUnit = odds > 0 ? odds / 100 : 100 / Math.abs(odds);
    profit += pick.status === 'won' ? profitUnit : -1;
  }

  return {
    total: picks.length,
    graded: graded.length,
    won,
    lost,
    push,
    void: voidCount,
    pending: picks.filter((p) => p.status === 'pending').length,
    winRate: graded.length > 0 ? won / graded.length : null,
    roi: totalStaked > 0 ? profit / totalStaked : null,
    profit,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const status = searchParams.get('status');
  const betType = searchParams.get('betType');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const limitRaw = searchParams.get('limit');
  const limit = Math.min(
    Math.max(parseInt(limitRaw ?? '', 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const cacheKey = [sport, status, betType, from, to, limit].join('|');
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt <= CACHE_TTL_MS) {
    return NextResponse.json(cached.data, { headers: { 'x-model-history-cache': 'hit' } });
  }

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Model history not configured. Set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  try {
    let query = supabase
      .from('top_picks')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (sport) query = query.eq('sport', sport);
    if (status) query = query.eq('status', status);
    if (betType) query = query.eq('bet_type', betType);
    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);

    const { data, error } = await query;
    if (error) {
      console.error('[model-history] query failed:', error.message);
      return NextResponse.json({ error: 'Failed to read model history' }, { status: 502 });
    }

    const picks = (data ?? []).map(rowToEntry);
    const stats = calculateStats(picks);

    // Per-sport stats
    const sportMap = new Map<string, HistoryEntry[]>();
    for (const pick of picks) {
      const arr = sportMap.get(pick.sport) ?? [];
      arr.push(pick);
      sportMap.set(pick.sport, arr);
    }
    const bySport = Array.from(sportMap.entries()).map(([sportKey, rows]) => ({
      sport: sportKey,
      ...calculateStats(rows),
    }));

    // Per-bet-type stats
    const typeMap = new Map<string, HistoryEntry[]>();
    for (const pick of picks) {
      const arr = typeMap.get(pick.betType) ?? [];
      arr.push(pick);
      typeMap.set(pick.betType, arr);
    }
    const byBetType = Array.from(typeMap.entries()).map(([type, rows]) => ({
      betType: type,
      ...calculateStats(rows),
    }));

    const payload = { count: picks.length, stats, bySport, byBetType, picks };
    cache.set(cacheKey, { data: payload, fetchedAt: Date.now() });

    return NextResponse.json(payload, { headers: { 'x-model-history-cache': 'miss' } });
  } catch (error) {
    console.error('[model-history] unexpected error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to read model history' }, { status: 502 });
  }
}
