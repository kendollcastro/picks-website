// ============================================
// KCMPICKS - Seed team_ratings from ESPN standings
// Usage: npm run seed:ratings
// Reads SUPABASE_URL / SERVICE_ROLE_KEY from .env.local (never logged).
// ============================================

import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const SPORTS = [
  { sport: 'nba', path: 'basketball/nba' },
  { sport: 'nfl', path: 'football/nfl' },
  { sport: 'mlb', path: 'baseball/mlb' },
  { sport: 'soccer', path: 'soccer/eng.1' },
  { sport: 'college-football', path: 'football/college-football' },
  { sport: 'college-basketball', path: 'basketball/mens-college-basketball' },
  { sport: 'womens-basketball', path: 'basketball/wnba' },
];

function loadEnv(path) {
  const env = {};
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    env[trimmed.slice(0, eq)] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

function collectGroups(node, out = []) {
  if (node?.standings?.entries?.length) out.push(node);
  for (const child of node?.children ?? []) collectGroups(child, out);
  return out;
}

// Entries can repeat stat names (nested splits); keep the first (overall) value.
function statMap(stats) {
  const map = {};
  for (const s of stats ?? []) {
    if (map[s.name] === undefined && s.value !== undefined && s.value !== null) {
      map[s.name] = s.value;
    }
  }
  return map;
}

function isSeasonLabel(name) {
  return /\b(19|20)\d{2}\b/.test(name);
}

async function fetchStandings(path, season) {
  const url = new URL(`https://site.api.espn.com/apis/v2/sports/${path}/standings`);
  if (season) url.searchParams.set('season', String(season));
  const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`ESPN ${res.status} for ${path} season=${season ?? 'current'}`);
  return res.json();
}

function toRows(sport, data) {
  const rows = [];
  const groups = collectGroups(data);

  for (const group of groups) {
    const entries = [...group.standings.entries];
    const ranked = entries
      .map((e) => ({ e, s: statMap(e.stats) }))
      .sort((a, b) => {
        const w = (b.s.winPercent ?? b.s.leagueWinPercent ?? 0) - (a.s.winPercent ?? a.s.leagueWinPercent ?? 0);
        if (w !== 0) return w;
        return (b.s.pointDifferential ?? 0) - (a.s.pointDifferential ?? 0);
      });

    ranked.forEach(({ e, s }, index) => {
      const team = e.team ?? {};
      const teamName = team.displayName || [team.location, team.name].filter(Boolean).join(' ');
      if (!teamName) return;

      const wins = Math.round(s.wins ?? 0);
      const losses = Math.round(s.losses ?? 0);
      const ties = Math.round(s.ties ?? 0);
      const games = wins + losses + ties;
      const winPct = games > 0 ? wins / games : 0;

      rows.push({
        sport,
        team_id: `${sport}_${team.id ?? teamName.toLowerCase().replace(/\s+/g, '_')}`,
        team_name: teamName,
        conference: group.name && !isSeasonLabel(group.name) ? group.name : null,
        rating: Math.round(winPct * 10000) / 100,
        rank: Math.round(s.rank ?? index + 1),
        wins,
        losses,
        points_for: Math.round(s.pointsFor ?? 0),
        points_against: Math.round(s.pointsAgainst ?? 0),
        last_updated: new Date().toISOString(),
      });
    });
  }

  return rows;
}

async function main() {
  const env = loadEnv(new URL('../.env.local', import.meta.url).pathname);
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const key = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
  }

  const supabase = createClient(url, key, { auth: { persistSession: false } });
  const currentSeason = new Date().getFullYear();
  let total = 0;

  for (const { sport, path } of SPORTS) {
    try {
      let data = await fetchStandings(path);
      let rows = toRows(sport, data);
      let season = 'current';

      // Off-season leagues (e.g. NBA in September) have no games yet:
      // fall back to last season so ratings are real instead of all-zero.
      const games = rows.reduce((sum, r) => sum + r.wins + r.losses, 0);
      if (games === 0) {
        try {
          data = await fetchStandings(path, currentSeason - 1);
          const previous = toRows(sport, data);
          if (previous.reduce((sum, r) => sum + r.wins + r.losses, 0) > 0) {
            rows = previous;
            season = String(currentSeason - 1);
          }
        } catch (err) {
          console.warn(`  ${sport}: previous season unavailable (${err.message})`);
        }
      }

      if (rows.length === 0) {
        console.log(`${sport}: no rows returned, skipped`);
        continue;
      }

      for (let i = 0; i < rows.length; i += 200) {
        const { error } = await supabase.from('team_ratings').upsert(rows.slice(i, i + 200), {
          onConflict: 'sport,team_id',
        });
        if (error) throw new Error(error.message);
      }

      total += rows.length;
      const sample = rows[0];
      console.log(
        `${sport}: ${rows.length} teams (season ${season}, sample: ${sample.team_name} rank ${sample.rank} ${sample.wins}-${sample.losses} rating ${sample.rating})`
      );
    } catch (err) {
      console.error(`${sport}: FAILED - ${err.message}`);
    }
  }

  const { count } = await supabase
    .from('team_ratings')
    .select('*', { count: 'exact', head: true });
  console.log(`\nDone. Rows written: ${total}. team_ratings total: ${count}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
