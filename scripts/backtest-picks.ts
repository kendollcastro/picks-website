#!/usr/bin/env npx tsx
/**
 * KCMPICKS - Pick settlement backtest / audit
 *
 * Modes:
 *   npx tsx scripts/backtest-picks.ts unit          (default) synthetic unit tests for settlePick
 *   npx tsx scripts/backtest-picks.ts audit         audit real DB picks against ESPN final scores
 *   npx tsx scripts/backtest-picks.ts audit --fix   also update mismatched statuses in Supabase
 *
 * The audit mode requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or
 * NEXT_PUBLIC_SUPABASE_ANON_KEY) in your environment.
 */

import { createClient } from '@supabase/supabase-js';
import { settlePick, parsePickSelection, type Pick } from '../src/hooks/usePicks';

const ESPN_SPORT_PATHS: Record<string, string> = {
  nba: 'basketball/nba',
  nfl: 'football/nfl',
  mlb: 'baseball/mlb',
  'college-football': 'football/college-football',
  'college-basketball': 'basketball/mens-college-basketball',
  'womens-basketball': 'basketball/wnba',
};

interface EspnGame {
  status: string;
  homeScore: number;
  awayScore: number;
  homeTeam: string;
  awayTeam: string;
  isLive: boolean;
}

// ============================================================================
// UNIT TESTS
// ============================================================================
function makePick(overrides: Partial<Pick>): Pick {
  return {
    id: 'test-id',
    user_id: 'user-id',
    sport: 'nba',
    home_team: 'Boston Celtics',
    away_team: 'Los Angeles Lakers',
    pick_type: 'moneyline',
    selection: 'Boston Celtics ML',
    odds: -150,
    stake: 100,
    potential_payout: 166.67,
    confidence: 3,
    status: 'pending',
    notes: null,
    home_score: null,
    away_score: null,
    game_date: new Date().toISOString(),
    match_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    settled_at: null,
    ...overrides,
  } as Pick;
}

function assertEqual(actual: unknown, expected: unknown, label: string) {
  if (actual === expected) {
    console.log(`  ✅ ${label}`);
    return true;
  }
  console.log(`  ❌ ${label}: expected ${expected}, got ${actual}`);
  return false;
}

function runUnitTests() {
  console.log('\n🧪 Running settlement unit tests\n');
  let passed = 0;
  let failed = 0;

  const gameFinal = {
    status: 'Final',
    homeScore: 110,
    awayScore: 105,
    homeTeam: 'Boston Celtics',
    awayTeam: 'Los Angeles Lakers',
    isLive: false,
  };

  const gameTie = { ...gameFinal, homeScore: 105, awayScore: 105 };

  // Moneyline
  if (assertEqual(settlePick(makePick({ pick_type: 'moneyline', selection: 'Boston Celtics ML' }), gameFinal), 'won', 'ML home winner')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'moneyline', selection: 'Los Angeles Lakers ML' }), gameFinal), 'lost', 'ML away loser')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'moneyline', selection: 'Boston Celtics ML' }), gameTie), 'push', 'ML tie push')) passed++; else failed++;

  // Spread - multi-word team names
  if (assertEqual(settlePick(makePick({ pick_type: 'spread', selection: 'Boston Celtics -4.5' }), gameFinal), 'won', 'Spread favorite covers')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'spread', selection: 'Boston Celtics -5.0' }), gameFinal), 'push', 'Spread favorite push')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'spread', selection: 'Los Angeles Lakers +5.5' }), gameFinal), 'won', 'Spread underdog covers')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'spread', selection: 'Los Angeles Lakers +4.5' }), gameFinal), 'lost', 'Spread underdog loses')) passed++; else failed++;

  // Totals
  if (assertEqual(settlePick(makePick({ pick_type: 'total', selection: 'Over 214.5' }), gameFinal), 'won', 'Over hits')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'total', selection: 'Under 214.5' }), gameFinal), 'lost', 'Under misses')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'total', selection: 'Under 215.0' }), gameFinal), 'push', 'Total push')) passed++; else failed++;

  // Unsupported types
  if (assertEqual(settlePick(makePick({ pick_type: 'prop', selection: 'J. Tatum Over 28.5 Pts' }), gameFinal), null, 'Prop returns null')) passed++; else failed++;
  if (assertEqual(settlePick(makePick({ pick_type: 'parlay', selection: 'Parlay' }), gameFinal), null, 'Parlay returns null')) passed++; else failed++;

  // Parser edge cases
  const parsedSpread = parsePickSelection('New York Knicks -5.5', 'spread');
  if (parsedSpread.team === 'New York Knicks' && parsedSpread.line === -5.5) {
    console.log('  ✅ Parser extracts multi-word team + line');
    passed++;
  } else {
    console.log('  ❌ Parser failed:', parsedSpread);
    failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed > 0 ? 1 : 0);
}

// ============================================================================
// ESPN HELPERS
// ============================================================================
async function fetchEspnGame(sport: string, matchId: string): Promise<EspnGame | null> {
  const path = ESPN_SPORT_PATHS[sport];
  if (!path) {
    console.warn(`  ⚠️  No ESPN path mapping for sport: ${sport}`);
    return null;
  }

  const url = `https://site.api.espn.com/apis/site/v2/sports/${path}/summary?event=${matchId}`;
  try {
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) {
      console.warn(`  ⚠️  ESPN returned ${res.status} for ${url}`);
      return null;
    }
    const json = await res.json();
    const competition = json?.header?.competitions?.[0];
    if (!competition) return null;

    const status = competition.status?.type?.name || '';
    const home = competition.competitors?.find((c: { homeAway?: string; score?: string | number; team?: { displayName?: string; name?: string } }) => c.homeAway === 'home');
    const away = competition.competitors?.find((c: { homeAway?: string; score?: string | number; team?: { displayName?: string; name?: string } }) => c.homeAway === 'away');
    if (!home || !away) return null;

    return {
      status,
      homeScore: Number(home.score ?? 0),
      awayScore: Number(away.score ?? 0),
      homeTeam: home.team?.displayName || home.team?.name || '',
      awayTeam: away.team?.displayName || away.team?.name || '',
      isLive: status === 'STATUS_IN_PROGRESS',
    };
  } catch (err) {
    console.warn(`  ⚠️  Failed to fetch ESPN for ${matchId}:`, err instanceof Error ? err.message : err);
    return null;
  }
}

// ============================================================================
// DB AUDIT
// ============================================================================
async function runAudit(fix: boolean) {
  console.log('\n🔍 Auditing picks against ESPN final scores\n');

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    console.error('Missing Supabase env vars. Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: picks, error } = await supabase.from('picks').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch picks:', error.message);
    process.exit(1);
  }

  if (!picks || picks.length === 0) {
    console.log('No picks found in the database.');
    return;
  }

  console.log(`Found ${picks.length} pick(s)\n`);

  let checked = 0;
  let mismatches = 0;
  let pendingFinal = 0;
  const updates: { id: string; status: string; home_score: number; away_score: number }[] = [];

  for (const pick of picks as Pick[]) {
    const game = pick.match_id
      ? await fetchEspnGame(pick.sport, pick.match_id)
      : null;

    if (!game) {
      console.log(`⏭️  ${pick.selection} — no final score available (match_id: ${pick.match_id ?? 'none'})`);
      continue;
    }

    if (game.status !== 'STATUS_FINAL') {
      console.log(`⏳ ${pick.selection} — game not final yet (${game.status})`);
      continue;
    }

    checked++;
    const expected = settlePick(pick, { ...game, status: 'Final' });
    if (!expected) {
      console.log(`⏭️  ${pick.selection} — unsupported pick type or unable to settle`);
      continue;
    }

    const expectedLabel = expected.toUpperCase();
    const actualLabel = pick.status.toUpperCase();

    if (pick.status === 'pending') {
      pendingFinal++;
      console.log(`📝 ${pick.selection} — PENDING → should be ${expectedLabel} (${game.homeScore}-${game.awayScore})`);
      if (fix) updates.push({ id: pick.id, status: expected, home_score: game.homeScore, away_score: game.awayScore });
    } else if (pick.status !== expected) {
      mismatches++;
      console.log(`🚨 ${pick.selection} — DB says ${actualLabel}, expected ${expectedLabel} (${game.homeScore}-${game.awayScore})`);
      if (fix) updates.push({ id: pick.id, status: expected, home_score: game.homeScore, away_score: game.awayScore });
    } else {
      console.log(`✅ ${pick.selection} — ${actualLabel} (${game.homeScore}-${game.awayScore})`);
    }
  }

  console.log(`\nChecked ${checked} final game(s)`);
  console.log(`Pending picks with final scores: ${pendingFinal}`);
  console.log(`Mismatches: ${mismatches}`);

  if (fix && updates.length > 0) {
    console.log(`\n🛠️  Updating ${updates.length} pick(s)...`);
    for (const u of updates) {
      const { error: updateError } = await supabase
        .from('picks')
        .update({ status: u.status, home_score: u.home_score, away_score: u.away_score, settled_at: new Date().toISOString() })
        .eq('id', u.id);
      if (updateError) {
        console.error(`  Failed to update ${u.id}:`, updateError.message);
      }
    }
    console.log('Done.');
  } else if (updates.length > 0) {
    console.log(`\nRun with --fix to update ${updates.length} pick(s).`);
  }

  console.log('');
}

// ============================================================================
// MAIN
// ============================================================================
const mode = process.argv[2] || 'unit';
const fix = process.argv.includes('--fix');

if (mode === 'unit') {
  runUnitTests();
} else if (mode === 'audit') {
  runAudit(fix);
} else {
  console.error('Unknown mode. Use: unit | audit [--fix]');
  process.exit(1);
}
