// ============================================
// KCMPICKS - AI Predictions API Route
// Proxies AI predictions to Jev (TypeSafe System One)
// via the OpenRouter Decisions API. Keeps OPENROUTER_API_KEY server-side.
// ============================================

import { NextResponse } from 'next/server';
import { getJevPrediction, type JevContext } from '@/lib/api/jev-predictions';
import { requireAuth } from '@/lib/api/auth';
import { checkRateLimit } from '@/lib/api/rate-limit';
import { applyCors, handleOptions } from '@/lib/api/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return handleOptions();
}

export async function POST(request: Request) {
  const auth = await requireAuth();
  if (auth.response) return applyCors(auth.response);

  const rate = checkRateLimit(
    `ai:predictions:${auth.user.id}`,
    30,
    60 * 60 * 1000
  );
  if (!rate.allowed) {
    return applyCors(
      NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
      )
    );
  }

  let body: Partial<JevContext>;

  try {
    body = await request.json();
  } catch {
    return applyCors(NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }));
  }

  if (!body.homeTeam || !body.awayTeam || !body.sport) {
    return applyCors(
      NextResponse.json(
        { error: 'Missing required fields: homeTeam, awayTeam, sport' },
        { status: 400 }
      )
    );
  }

  const prediction = await getJevPrediction({
    homeTeam: body.homeTeam,
    awayTeam: body.awayTeam,
    sport: body.sport,
    homeOdds: typeof body.homeOdds === 'number' ? body.homeOdds : 0,
    awayOdds: typeof body.awayOdds === 'number' ? body.awayOdds : 0,
    homeRating: body.homeRating,
    awayRating: body.awayRating,
    homeWins: body.homeWins,
    homeLosses: body.homeLosses,
    awayWins: body.awayWins,
    awayLosses: body.awayLosses,
    recentForm: body.recentForm,
  });

  if (!prediction) {
    return applyCors(
      NextResponse.json(
        { error: 'AI prediction unavailable. Check OPENROUTER_API_KEY.' },
        { status: 502 }
      )
    );
  }

  return applyCors(NextResponse.json({ prediction }));
}