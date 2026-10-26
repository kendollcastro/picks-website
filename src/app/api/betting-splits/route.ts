// ============================================
// KCMPICKS - Public Betting Splits API
// Returns the latest public betting splits for a sport or a specific game.
// Data is populated by the betting_splits scraper (Action Network -> OddsTrader fallback).
// Query params:
//   sport    - filter by sport key
//   gameId   - filter by ESPN event id
//   source   - actionnetwork | oddsTrader | sbr | manual
//   limit    - max rows (default 100, max 500)
// ============================================

import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 500;

interface BettingSplitRow {
  id: number;
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  commence_time: string | null;
  source: string;
  home_bet_pct: number | null;
  away_bet_pct: number | null;
  home_money_pct: number | null;
  away_money_pct: number | null;
  home_big_bet_pct: number | null;
  away_big_bet_pct: number | null;
  notes: string | null;
  captured_at: string;
}

interface BettingSplitEntry {
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

function rowToEntry(row: BettingSplitRow): BettingSplitEntry {
  return {
    id: row.id,
    gameId: row.game_id,
    sport: row.sport,
    homeTeam: row.home_team,
    awayTeam: row.away_team,
    commenceTime: row.commence_time,
    source: row.source,
    homeBetPct: row.home_bet_pct === null ? null : Number(row.home_bet_pct),
    awayBetPct: row.away_bet_pct === null ? null : Number(row.away_bet_pct),
    homeMoneyPct: row.home_money_pct === null ? null : Number(row.home_money_pct),
    awayMoneyPct: row.away_money_pct === null ? null : Number(row.away_money_pct),
    homeBigBetPct: row.home_big_bet_pct === null ? null : Number(row.home_big_bet_pct),
    awayBigBetPct: row.away_big_bet_pct === null ? null : Number(row.away_big_bet_pct),
    notes: row.notes,
    capturedAt: row.captured_at,
  };
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get('sport');
  const gameId = searchParams.get('gameId');
  const source = searchParams.get('source');
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') ?? '', 10) || DEFAULT_LIMIT, 1),
    MAX_LIMIT
  );

  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: 'Betting splits not configured. Set SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY.' },
      { status: 503 }
    );
  }

  try {
    let query = supabase
      .from('betting_splits')
      .select('*')
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (sport) query = query.eq('sport', sport);
    if (gameId) query = query.eq('game_id', gameId);
    if (source) query = query.eq('source', source);

    const { data, error } = await query;
    if (error) {
      // If the table has not been created yet, degrade gracefully so the UI
      // still loads. Log a clear warning so ops knows to apply the migration.
      const isMissingTable =
        error.code === 'PGRST116' ||
        error.message?.toLowerCase().includes("could not find the table");
      if (isMissingTable) {
        console.warn(
          '[betting-splits] table missing — run supabase/migrations/betting_splits.sql. Returning empty splits.'
        );
        return NextResponse.json(
          {
            count: 0,
            splits: [],
            warning: 'Betting splits table not found. Run supabase/migrations/betting_splits.sql.',
          },
          { status: 200 }
        );
      }
      console.error('[betting-splits] query failed:', error.message);
      return NextResponse.json({ error: 'Failed to read betting splits' }, { status: 502 });
    }

    // De-duplicate to one row per game (latest captured source wins).
    const seen = new Set<string>();
    const entries = (data ?? [])
      .map(rowToEntry)
      .filter((entry) => {
        if (seen.has(entry.gameId)) return false;
        seen.add(entry.gameId);
        return true;
      });

    return NextResponse.json({ count: entries.length, splits: entries });
  } catch (error) {
    console.error('[betting-splits] unexpected error:', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'Failed to read betting splits' }, { status: 502 });
  }
}
