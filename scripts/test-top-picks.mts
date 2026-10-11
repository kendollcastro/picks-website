// End-to-end test: Supabase scraped games → generateTopPicks (research → Jev → value engine)
// Run from kcmpicks/:  npx tsx scripts/test-top-picks.ts
import { readFileSync } from 'node:fs';

const env = readFileSync('.env.local', 'utf8');
for (const line of env.split('\n')) {
  const m = line.match(/^([A-Za-z0-9_]+)=(.*)$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
}

const { createClient } = await import('@supabase/supabase-js');
const { generateTopPicks } = await import('../src/lib/api/jev-top-picks');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
);

const { data: rows, error } = await supabase
  .from('games')
  .select('*')
  .eq('sport', 'nba')
  .eq('status', 'scheduled')
  .order('commence_time', { ascending: true })
  .limit(4);

if (error || !rows?.length) {
  console.error('No games:', error?.message ?? 'empty');
  process.exit(1);
}

const games = rows
  .filter((g) => g.home_moneyline && g.away_moneyline)
  .slice(0, 3)
  .map((g) => ({
    id: g.id,
    sport: g.sport,
    homeTeam: g.home_team,
    awayTeam: g.away_team,
    gameTime: g.commence_time,
    homeMoneyline: g.home_moneyline,
    awayMoneyline: g.away_moneyline,
    drawMoneyline: g.draw_moneyline ?? undefined,
    spread: g.spread ?? undefined,
    total: g.total ?? undefined,
    spreadOdds: g.home_spread_odds ?? undefined,
    awaySpreadOdds: g.away_spread_odds ?? undefined,
    totalOdds: g.over_odds ?? undefined,
    underOdds: g.under_odds ?? undefined,
    venue: g.venue ?? undefined,
    provider: g.provider ?? undefined,
  }));

console.log('Input games:', games.length);
console.log(
  games.map((g) => `${g.awayTeam} @ ${g.homeTeam} | ML ${g.homeMoneyline}/${g.awayMoneyline} | sp ${g.spread} (${g.spreadOdds}/${g.awaySpreadOdds}) | tot ${g.total} (${g.totalOdds}/${g.underOdds}) | ${g.venue ?? 'no venue'} | ${g.provider}`)
    .join('\n')
);

const result = await generateTopPicks(games, { useResearch: true, limit: 3, minEv: 0.01 });

console.log('\n=== RESULT ===');
console.log('analyzed:', result.analyzed, '| models:', JSON.stringify(result.models));
console.log('costs:', JSON.stringify(result.costs), '| shrink:', result.shrink);
for (const pick of result.picks) {
  const c = pick.candidate;
  console.log(
    `\n#${result.picks.indexOf(pick) + 1} ${pick.game.awayTeam} @ ${pick.game.homeTeam}` +
      `\n  pick: ${c.selection} @ ${c.odds} (${c.betType})${c.oddsAssumed ? ' [ASSUMED]' : ' [REAL PRICE]'}` +
      `\n  EV: ${(c.expectedValue * 100).toFixed(1)}% | edge: ${c.edge}pts | conf: ${pick.confidence}` +
      `\n  jev p=${(c.jevProbability * 100).toFixed(1)}% vs fair=${(c.fairProbability * 100).toFixed(1)}%` +
      `\n  rationale: ${pick.rationale[0] ?? ''}` +
      (pick.research ? `\n  research: ${pick.research.summary.slice(0, 140)}` : '')
  );
}
