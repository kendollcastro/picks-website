// ============================================
// KCMPICKS - Jev Top Picks API Route
// Runs the research (OpenRouter) → Jev (Decisions) → value engine pipeline
// for a batch of games and returns ranked picks. Keeps OPENROUTER_API_KEY
// and SUPABASE_SERVICE_ROLE_KEY server-side.
// ============================================

import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { generateTopPicks, type TopPickGame } from '@/lib/api/jev-top-picks';
import { recordTopPicks, settlePendingTopPicks, getModelRecord } from '@/lib/api/top-picks-settle';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { applyCors, handleOptions } from '@/lib/api/cors';

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
    homeLogo: typeof g.homeLogo === 'string' ? g.homeLogo : undefined,
    awayLogo: typeof g.awayLogo === 'string' ? g.awayLogo : undefined,
    homeAbbr: typeof g.homeAbbr === 'string' ? g.homeAbbr : undefined,
    awayAbbr: typeof g.awayAbbr === 'string' ? g.awayAbbr : undefined,
  };
}

export async function OPTIONS() {
  return handleOptions();
}

async function enforceAiAccess(limit: number) {
  const auth = await requireAuth();
  if (auth.response) return { response: applyCors(auth.response) };

  const rate = checkRateLimit(`ai:top-picks:${auth.user.id}`, limit, 60 * 60 * 1000);
  if (!rate.allowed) {
    return {
      response: applyCors(
        NextResponse.json(
          { error: 'Rate limit exceeded' },
          { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
        )
      ),
    };
  }

  return { userId: auth.user.id };
}

export async function POST(request: Request) {
  const access = await enforceAiAccess(10);
  if (access.response) return access.response;

  if (!process.env.OPENROUTER_API_KEY) {
    return applyCors(
      NextResponse.json(
        { error: 'AI analysis unavailable. Check OPENROUTER_API_KEY.' },
        { status: 502 }
      )
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return applyCors(NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }));
  }

  const rawGames = Array.isArray(body.games) ? body.games : null;
  if (!rawGames || rawGames.length === 0) {
    return applyCors(
      NextResponse.json({ error: 'Field "games" must be a non-empty array' }, { status: 400 })
    );
  }
  if (rawGames.length > MAX_GAMES) {
    return applyCors(
      NextResponse.json({ error: `Maximum ${MAX_GAMES} games per request` }, { status: 400 })
    );
  }

  const games = rawGames.map(parseGame).filter((g): g is TopPickGame => g !== null);
  if (games.length === 0) {
    return applyCors(
      NextResponse.json(
        { error: 'No valid games: each needs homeTeam, awayTeam, sport and both moneylines' },
        { status: 400 }
      )
    );
  }

  const result = await generateTopPicks(games, {
    useResearch: body.useResearch !== false,
    limit: typeof body.limit === 'number' ? body.limit : undefined,
    minEv: typeof body.minEv === 'number' ? body.minEv : undefined,
  });

  // Persist model bets + settle any now-final games, for win-rate tracking.
  // Fire-and-forget: tracking must never fail the pick response.
  const runId = randomUUID();
  if (result.allPicks.length > 0) {
    void recordTopPicks(result.allPicks, {
      runId,
      researchModel: result.models.research,
      jevModel: result.models.jev,
    }).catch((err) => console.error('[top-picks] record failed:', err));
  }
  void settlePendingTopPicks().catch((err) =>
    console.error('[top-picks] settle failed:', err)
  );

  return applyCors(NextResponse.json(result));
}

// GET /api/ai/top-picks → settle any pending picks, then return the model's
// running record (win-rate, ROI, calibration) from the `top_picks` table.
export async function GET() {
  const access = await enforceAiAccess(10);
  if (access.response) return access.response;

  const settle = await settlePendingTopPicks().catch((err) => {
    console.error('[top-picks] settle failed:', err);
    return null;
  });
  const record = await getModelRecord().catch((err) => {
    console.error('[top-picks] record failed:', err);
    return null;
  });

  return applyCors(
    NextResponse.json({
      record,
      lastSettle: settle?.summary ?? null,
      error: settle?.error ?? null,
    })
  );
}
