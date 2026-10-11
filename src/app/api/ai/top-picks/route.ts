// ============================================
// KCMPICKS - Jev Top Picks API Route
// Runs the research (OpenRouter) → Jev (Decisions) → value engine pipeline
// for a batch of games and returns ranked picks. Keeps OPENROUTER_API_KEY
// and SUPABASE_SERVICE_ROLE_KEY server-side.
// ============================================

import { NextResponse } from 'next/server';
import { generateTopPicks, type TopPickGame } from '@/lib/api/jev-top-picks';

export const dynamic = 'force-dynamic';

const MAX_GAMES = 12;

function numberOrUndefined(value: unknown): number | undefined {
  if (typeof value === 'number' && isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    if (isFinite(parsed)) return parsed;
  }
  return undefined;
}

function parseGame(raw: unknown): TopPickGame | null {
  if (!raw || typeof raw !== 'object') return null;
  const g = raw as Record<string, unknown>;

  const homeTeam = typeof g.homeTeam === 'string' ? g.homeTeam.trim() : '';
  const awayTeam = typeof g.awayTeam === 'string' ? g.awayTeam.trim() : '';
  const sport = typeof g.sport === 'string' ? g.sport.trim() : '';
  const homeMoneyline = numberOrUndefined(g.homeMoneyline);
  const awayMoneyline = numberOrUndefined(g.awayMoneyline);

  if (!homeTeam || !awayTeam || !sport) return null;
  if (homeMoneyline === undefined || awayMoneyline === undefined) return null;

  return {
    id: typeof g.id === 'string' ? g.id : `${sport}-${awayTeam}-${homeTeam}`,
    sport,
    homeTeam,
    awayTeam,
    gameTime: typeof g.gameTime === 'string' ? g.gameTime : new Date().toISOString(),
    homeMoneyline,
    awayMoneyline,
    drawMoneyline: numberOrUndefined(g.drawMoneyline),
    spread: numberOrUndefined(g.spread),
    total: numberOrUndefined(g.total),
    spreadOdds: numberOrUndefined(g.spreadOdds),
    awaySpreadOdds: numberOrUndefined(g.awaySpreadOdds),
    totalOdds: numberOrUndefined(g.totalOdds),
    underOdds: numberOrUndefined(g.underOdds),
    venue: typeof g.venue === 'string' ? g.venue : undefined,
    provider: typeof g.provider === 'string' ? g.provider : undefined,
  };
}

export async function POST(request: Request) {
  if (!process.env.OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: 'AI analysis unavailable. Check OPENROUTER_API_KEY.' },
      { status: 502 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const rawGames = Array.isArray(body.games) ? body.games : null;
  if (!rawGames || rawGames.length === 0) {
    return NextResponse.json({ error: 'Field "games" must be a non-empty array' }, { status: 400 });
  }
  if (rawGames.length > MAX_GAMES) {
    return NextResponse.json({ error: `Maximum ${MAX_GAMES} games per request` }, { status: 400 });
  }

  const games = rawGames.map(parseGame).filter((g): g is TopPickGame => g !== null);
  if (games.length === 0) {
    return NextResponse.json(
      { error: 'No valid games: each needs homeTeam, awayTeam, sport and both moneylines' },
      { status: 400 }
    );
  }

  const result = await generateTopPicks(games, {
    useResearch: body.useResearch !== false,
    limit: typeof body.limit === 'number' ? body.limit : undefined,
    minEv: typeof body.minEv === 'number' ? body.minEv : undefined,
  });

  return NextResponse.json(result);
}
