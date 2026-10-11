// ============================================
// KCMPICKS - Model top-picks settle + record
// Persists every value bet the AI pipeline surfaces into `top_picks` and
// settles pending rows against final `games` (status = 'post'). Lets us
// measure real model win-rate / ROI and calibrate JEV_MARKET_SHRINK with
// outcomes instead of by eye.
// ============================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { TopPick } from './jev-top-picks';

export type SettledStatus = 'won' | 'lost' | 'push' | 'void';

export interface TopPickRow {
  id: string;
  game_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  commence_time: string | null;
  bet_type: 'moneyline' | 'spread' | 'total';
  side: string;
  selection: string;
  line: number | null;
  odds: number;
  jev_probability: number | null;
  fair_probability: number | null;
  edge: number | null;
  expected_value: number | null;
  confidence: number | null;
  status: 'pending' | SettledStatus;
  home_score: number | null;
  away_score: number | null;
  settled_at: string | null;
}

export interface SettleSummary {
  settled: number;
  won: number;
  lost: number;
  push: number;
  void: number;
}

export interface ModelRecord {
  total: number;
  won: number;
  lost: number;
  push: number;
  void: number;
  /** Settled non-void bets (won + lost); push excluded from win rate. */
  graded: number;
  winRate: number | null;
  /** Flat-stake ROI in % across graded bets (pushes excluded). */
  roi: number | null;
  /** Avg model probability of graded bets. */
  avgProb: number | null;
  /** Avg stated edge (pts) of graded bets. */
  avgEdge: number | null;
  lastUpdated: string | null;
}

let supabaseSingleton: SupabaseClient | null = null;

function getServiceClient(): SupabaseClient | null {
  if (supabaseSingleton) return supabaseSingleton;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  supabaseSingleton = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return supabaseSingleton;
}

// --------------------------------------------
// Settle one bet given final scores
function settleMoneyline(
  side: string,
  homeTeam: string,
  awayTeam: string,
  homeScore: number,
  awayScore: number
): SettledStatus {
  if (side === 'Draw') return homeScore === awayScore ? 'won' : 'lost';
  const isHome = side === homeTeam;
  const isAway = side === awayTeam;
  if (!isHome && !isAway) return 'void';
  // ML with no draw side offered → push on a tie (soccer 1X2 uses a "Draw" side).
  if (homeScore === awayScore) return 'push';
  if (isHome) return homeScore > awayScore ? 'won' : 'lost';
  return awayScore > homeScore ? 'won' : 'lost';
}

function settleSpreadOrTotal(
  betType: 'spread' | 'total',
  side: string,
  line: number | null,
  homeScore: number,
  awayScore: number
): SettledStatus {
  if (line === null || !Number.isFinite(line)) return 'void';

  if (betType === 'spread') {
    // line is the signed home spread (e.g. -4.5). Home covers if margin + line > 0.
    const margin = homeScore - awayScore;
    if (Math.abs(margin + line) < 1e-9) return 'push';
    return margin + line > 0 ? 'won' : 'lost';
  }

  const sum = homeScore + awayScore;
  if (Math.abs(sum - line) < 1e-9) return 'push';
  if (side === 'Over') return sum > line ? 'won' : 'lost';
  return sum < line ? 'won' : 'lost';
}

export function settleRow(
  row: Pick<TopPickRow, 'bet_type' | 'side' | 'line' | 'home_team' | 'away_team'>,
  homeScore: number,
  awayScore: number
): SettledStatus {
  if (!Number.isFinite(homeScore) || !Number.isFinite(awayScore)) return 'void';
  if (row.bet_type === 'moneyline') {
    return settleMoneyline(row.side, row.home_team, row.away_team, homeScore, awayScore);
  }
  return settleSpreadOrTotal(row.bet_type, row.side, row.line, homeScore, awayScore);
}

// --------------------------------------------
// Persist a batch of picks (one row per pick per run)
// --------------------------------------------
export async function recordTopPicks(
  picks: TopPick[],
  opts: {
    runId: string;
    researchModel: string | null;
    jevModel: string;
  }
): Promise<{ inserted: number; error?: string }> {
  const supabase = getServiceClient();
  if (!supabase) return { inserted: 0, error: 'Supabase not configured' };

  const rows = picks.map((p) => ({
    game_id: p.game.id,
    sport: p.game.sport,
    home_team: p.game.homeTeam,
    away_team: p.game.awayTeam,
    commence_time: p.game.gameTime,
    bet_type: p.candidate.betType,
    side: p.candidate.side,
    selection: p.candidate.selection,
    line: p.candidate.line ?? null,
    odds: Math.round(p.candidate.odds),
    jev_probability: p.candidate.jevProbability,
    fair_probability: p.candidate.fairProbability,
    edge: p.candidate.edge,
    expected_value: p.candidate.expectedValue,
    confidence: p.confidence,
    status: 'pending',
    run_id: opts.runId,
    research_model: opts.researchModel,
    jev_model: opts.jevModel,
  }));

  const { data, error } = await supabase
    .from('top_picks')
    .upsert(rows, { onConflict: 'game_id,bet_type,side,run_id', ignoreDuplicates: true })
    .select('id');

  if (error) return { inserted: 0, error: error.message };
  return { inserted: data?.length ?? 0 };
}

// --------------------------------------------
// Settle pending picks against final games
// --------------------------------------------
export async function settlePendingTopPicks(): Promise<{
  summary: SettleSummary;
  error?: string;
}> {
  const supabase = getServiceClient();
  const summary: SettleSummary = { settled: 0, won: 0, lost: 0, push: 0, void: 0 };
  if (!supabase) return { summary, error: 'Supabase not configured' };

  const { data: pending, error: pendErr } = await supabase
    .from('top_picks')
    .select('*')
    .eq('status', 'pending')
    .limit(500);

  if (pendErr) return { summary, error: pendErr.message };
  if (!pending || pending.length === 0) return { summary };

  // Pull final games for the referenced ids in one shot.
  const gameIds = [...new Set(pending.map((p: TopPickRow) => p.game_id))];
  const { data: games, error: gErr } = await supabase
    .from('games')
    .select('id, status, home_score, away_score')
    .in('id', gameIds);

  if (gErr) return { summary, error: gErr.message };

  const gameMap = new Map<string, { status: string; home_score: number | null; away_score: number | null }>();
  for (const g of games ?? []) {
    gameMap.set(g.id, { status: g.status, home_score: g.home_score, away_score: g.away_score });
  }

  const updates: Array<{ id: string; status: SettledStatus; home_score: number; away_score: number; settled_at: string }> = [];

  for (const row of pending as TopPickRow[]) {
    const game = gameMap.get(row.game_id);
    if (!game) continue;
    if (game.status !== 'post') continue; // not final yet
    const hs = game.home_score;
    const as = game.away_score;
    if (hs === null || as === null) continue;

    const result = settleRow(row, hs, as);
    updates.push({ id: row.id, status: result, home_score: hs, away_score: as, settled_at: new Date().toISOString() });
  }

  if (updates.length === 0) return { summary };

  for (const u of updates) {
    const { error } = await supabase
      .from('top_picks')
      .update({ status: u.status, home_score: u.home_score, away_score: u.away_score, settled_at: u.settled_at })
      .eq('id', u.id);
    if (!error) {
      summary.settled += 1;
      summary[u.status] += 1;
    }
  }

  return { summary };
}

// --------------------------------------------
// Aggregate model record
// --------------------------------------------
export async function getModelRecord(): Promise<ModelRecord> {
  const supabase = getServiceClient();
  const empty: ModelRecord = {
    total: 0, won: 0, lost: 0, push: 0, void: 0,
    graded: 0, winRate: null, roi: null, avgProb: null, avgEdge: null, lastUpdated: null,
  };
  if (!supabase) return empty;

  const { data, error } = await supabase
    .from('top_picks')
    .select('status, odds, jev_probability, edge, settled_at')
    .neq('status', 'pending');

  if (error || !data) return empty;

  let won = 0, lost = 0, push = 0, v = 0;
  let profit = 0, probSum = 0, edgeSum = 0;
  let lastUpdated: string | null = null;

  for (const r of data as Array<{ status: string; odds: number; jev_probability: number | null; edge: number | null; settled_at: string | null }>) {
    if (r.status === 'won') won += 1;
    else if (r.status === 'lost') lost += 1;
    else if (r.status === 'push') push += 1;
    else if (r.status === 'void') v += 1;

    if (r.settled_at && (!lastUpdated || r.settled_at > lastUpdated)) lastUpdated = r.settled_at;

    if (r.status === 'won' || r.status === 'lost') {
      const o = r.odds;
      const profitUnit = o > 0 ? o / 100 : 100 / Math.abs(o);
      profit += r.status === 'won' ? profitUnit : -1;
      if (r.jev_probability != null) probSum += r.jev_probability;
      if (r.edge != null) edgeSum += r.edge;
    }
  }

  const graded = won + lost;
  return {
    total: won + lost + push + v,
    won, lost, push, void: v,
    graded,
    winRate: graded > 0 ? won / graded : null,
    roi: graded > 0 ? (profit / graded) * 100 : null,
    avgProb: graded > 0 ? probSum / graded : null,
    avgEdge: graded > 0 ? edgeSum / graded : null,
    lastUpdated,
  };
}
