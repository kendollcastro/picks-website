// ============================================
// KCMPICKS - Jev Top Picks Pipeline (SERVER-ONLY)
//
// Two-layer AI pipeline, per the OpenRouter + Jev architecture:
//   1. Research layer  — a frontier chat model on OpenRouter digests the
//      structured game state (records, ratings, market, situational context)
//      into a compact qualitative profile (strict JSON, no prose).
//   2. Decision layer  — Jev (TypeSafe System One) evaluates closed-set
//      questions in parallel: winner (choice), spread/total (noul),
//      situational edge (score). Returns calibrated probabilities only.
//   3. Value engine    — deterministic math compares Jev probabilities with
//      the book's devigged implied probabilities → edge + EV → ranked picks.
//
// Never import this from a client component (it reads env secrets).
// Use `import type { ... }` on the client instead.
// ============================================

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { americanToImplied, americanToDecimal } from './jev-predictions';
import { sanitizeInput } from '@/lib/utils';
import type { GameConditions } from './game-conditions';

const CHAT_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions';
const JEV_MODEL = '~typesafe/jev-latest';
const DEFAULT_RESEARCH_MODEL = 'anthropic/claude-sonnet-5';
const DEFAULT_MIN_EV = 0.03;
const DEFAULT_LIMIT = 5;
const MAX_GAMES = 12;
// Jev's choice probabilities saturate toward 0/1 whenever records/ratings
// clearly separate the teams, which produces fantasy +EV numbers on every
// game. Blend each probability toward the vig-removed market prior by this
// weight so edges stay meaningful. Override with JEV_MARKET_SHRINK (0..1).
const DEFAULT_MARKET_SHRINK = 0.4;

// ============================================
// TYPES
// ============================================
export interface TopPickGame {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  gameTime: string;
  homeMoneyline: number;
  awayMoneyline: number;
  /** Soccer 1X2 draw price; presence switches the market to three-way. */
  drawMoneyline?: number;
  /** Present only when the odds source actually quotes a spread. */
  spread?: number;
  /** Present only when the odds source actually quotes a total. */
  total?: number;
  /** Home-side spread price (American). */
  spreadOdds?: number;
  /** Away-side spread price (American); falls back to spreadOdds. */
  awaySpreadOdds?: number;
  /** Over price (American). */
  totalOdds?: number;
  /** Under price (American); falls back to totalOdds. */
  underOdds?: number;
  /** Venue/stadium, when the source provides it (scraped feed does). */
  venue?: string;
  /** Sportsbook the line came from, e.g. "DraftKings". */
  provider?: string;
  /** Team logo URLs (scraped feed provides them via ESPN). */
  homeLogo?: string | null;
  awayLogo?: string | null;
  homeAbbr?: string | null;
  awayAbbr?: string | null;
  /** Opening lines preserved by the odds scraper for line-movement analysis. */
  openingHomeMoneyline?: number;
  openingAwayMoneyline?: number;
  openingSpread?: number;
  openingHomeSpreadOdds?: number;
  openingAwaySpreadOdds?: number;
  openingTotal?: number;
  openingOverOdds?: number;
  openingUnderOdds?: number;
  openingOddsCapturedAt?: string;
  /** Pre-computed game context (injuries, rest, weather) fed to the research prompt. */
  conditions?: GameConditions | null;
  /** Public betting splits for this matchup. */
  bettingSplit?: {
    homeMoneyPct: number | null;
    awayMoneyPct: number | null;
    homeBetPct: number | null;
    awayBetPct: number | null;
    source: string;
  } | null;
}

export interface ResearchProfile {
  summary: string;
  key_factors: string[];
  home_notes: string[];
  away_notes: string[];
  model: string;
}

export type BetType = 'moneyline' | 'spread' | 'total';

export interface ValueCandidate {
  betType: BetType;
  /** Ready-to-save selection, e.g. "Los Angeles Lakers ML", "Over 224.5". */
  selection: string;
  side: string;
  odds: number;
  oddsAssumed: boolean;
  line?: number;
  jevProbability: number;
  /** Jev's raw model probability before blending toward the market prior. */
  rawJevProbability: number;
  /** Raw market implied probability of this side (with vig). */
  marketProbability: number;
  /** Vig-removed market probability — what Jev is compared against. */
  fairProbability: number;
  /** Percentage points: (jevProbability - fairProbability) * 100. */
  edge: number;
  /** Expected value as a fraction (0.074 = +7.4%). */
  expectedValue: number;
  valueBet: boolean;
}

export interface TopPick {
  game: TopPickGame;
  candidate: ValueCandidate;
  confidence: number;
  probabilities: { homeWin: number; awayWin: number; homeCovers?: number; overProb?: number };
  situationalEdge: number | null;
  research: ResearchProfile | null;
  rationale: string[];
}

export interface TopPicksResult {
  picks: TopPick[];
  /**
   * Every model bet generated this run (one per analyzed game — the top
   * candidate by EV, before the minEv value-bet filter). Persisted to the
   * `top_picks` table so we measure model calibration on all predictions,
   * not only the ones that cleared the +EV threshold.
   */
  allPicks: TopPick[];
  analyzed: number;
  gamesWithoutOdds: number;
  models: { research: string | null; jev: string };
  costs: { research: number; jev: number };
  minEv: number;
  /** Market-prior blend weight applied to Jev probabilities (0 = pure market, 1 = raw Jev). */
  shrink: number;
  generatedAt: string;
}

export interface GenerateOptions {
  useResearch?: boolean;
  limit?: number;
  minEv?: number;
}

interface TeamInfo {
  team_name: string;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
}

// ============================================
// HELPERS
// ============================================
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function sanitizeGame(game: TopPickGame): TopPickGame {
  return {
    ...game,
    homeTeam: sanitizeInput(game.homeTeam, 100),
    awayTeam: sanitizeInput(game.awayTeam, 100),
    sport: sanitizeInput(game.sport, 50),
    venue: sanitizeInput(game.venue, 200) || undefined,
    provider: sanitizeInput(game.provider, 100) || undefined,
  };
}

/** Devig a two-way market: returns each side's fair (no-vig) probability. */
export function devigTwoWay(homeOdds: number, awayOdds: number): { home: number; away: number } {
  const homeRaw = americanToImplied(homeOdds);
  const awayRaw = americanToImplied(awayOdds);
  const total = homeRaw + awayRaw;
  if (!isFinite(total) || total <= 0) return { home: 0.5, away: 0.5 };
  return { home: homeRaw / total, away: awayRaw / total };
}

/** Devig a three-way 1X2 market (soccer: home / draw / away). */
export function devigThreeWay(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): { home: number; draw: number; away: number } {
  const homeRaw = americanToImplied(homeOdds);
  const drawRaw = americanToImplied(drawOdds);
  const awayRaw = americanToImplied(awayOdds);
  const total = homeRaw + drawRaw + awayRaw;
  if (!isFinite(total) || total <= 0) return { home: 1 / 3, draw: 1 / 3, away: 1 / 3 };
  return { home: homeRaw / total, draw: drawRaw / total, away: awayRaw / total };
}

function formatLine(line: number): string {
  return line > 0 ? `+${line}` : `${line}`;
}

function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/);
  return fenced ? fenced[1] : trimmed;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (cursor < items.length) {
      const index = cursor++;
      results[index] = await fn(items[index]);
    }
  });
  await Promise.all(workers);
  return results;
}

// ============================================
// LAYER 1 — RESEARCH (OpenRouter chat model)
// ============================================
function buildResearchPrompt(game: TopPickGame, ratings: { home?: TeamInfo; away?: TeamInfo }) {
  const record = (t?: TeamInfo) => (t ? `${t.wins}-${t.losses}` : 'unknown');
  return {
    task:
      'Build a concise pre-game qualitative profile for this matchup. Reply with JSON only.',
    schema: {
      summary: 'string, 2-3 sentences, neutral and factual',
      key_factors: 'array of up to 4 short strings',
      home_notes: 'array of up to 2 short strings about the home team',
      away_notes: 'array of up to 2 short strings about the away team',
    },
    rules: [
      'No betting advice or picks — research only.',
      game.conditions
        ? 'Use the injury/rest/conditions data provided when relevant; do not invent additional injuries, lineup news or weather.'
        : 'No live injury feed is available: do not invent injuries, lineup news or weather.',
      'Base claims on the data provided plus general, well-established knowledge (venue, style, typical pace).',
      'If something is unknown, say so briefly instead of guessing.',
    ],
    game: {
      sport: game.sport,
      matchup: `${game.awayTeam} @ ${game.homeTeam}`,
      tipoff: game.gameTime,
      ...(game.venue ? { venue: game.venue } : {}),
      ...(game.provider ? { line_source: game.provider } : {}),
    },
    market: {
      home_moneyline: game.homeMoneyline,
      away_moneyline: game.awayMoneyline,
      ...(game.drawMoneyline !== undefined ? { draw_moneyline: game.drawMoneyline } : {}),
      ...(game.spread !== undefined ? { home_spread: game.spread } : {}),
      ...(game.spreadOdds !== undefined ? { home_spread_odds: game.spreadOdds } : {}),
      ...(game.total !== undefined ? { total: game.total } : {}),
      ...(game.totalOdds !== undefined ? { over_odds: game.totalOdds } : {}),
    },
    ...(game.conditions ? {
      conditions: {
        home_injuries: game.conditions.homeInjuries.map((i) => `${i.name} (${i.status}, impact ${i.impactScore}/10)`),
        away_injuries: game.conditions.awayInjuries.map((i) => `${i.name} (${i.status}, impact ${i.impactScore}/10)`),
        rest_days: game.conditions.restDays,
        notes: game.conditions.notes,
      },
    } : {}),
    team_quality: {
      home: {
        team: game.homeTeam,
        record: record(ratings.home),
        rating: ratings.home?.rating,
        rank: ratings.home?.rank,
      },
      away: {
        team: game.awayTeam,
        record: record(ratings.away),
        rating: ratings.away?.rating,
        rank: ratings.away?.rank,
      },
    },
  };
}

export async function researchGame(
  game: TopPickGame,
  ratings: { home?: TeamInfo; away?: TeamInfo }
): Promise<{ profile: ResearchProfile | null; cost: number }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return { profile: null, cost: 0 };

  const model = process.env.OPENROUTER_RESEARCH_MODEL || DEFAULT_RESEARCH_MODEL;

  try {
    const response = await fetch(CHAT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'KCMPICKS',
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'system',
            content:
              'You are a sports research analyst supporting a quantitative betting pipeline. You produce short, factual JSON profiles. Never recommend bets.',
          },
          { role: 'user', content: JSON.stringify(buildResearchPrompt(game, ratings)) },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.2,
        max_tokens: 700,
      }),
      signal: AbortSignal.timeout(45000),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Research API error:', response.status, (await response.text()).slice(0, 300));
      return { profile: null, cost: 0 };
    }

    const data = await response.json();
    const cost = data?.usage?.cost ?? 0;
    const content: string = data?.choices?.[0]?.message?.content ?? '';
    if (!content) return { profile: null, cost };

    let parsed: Record<string, unknown> = {};
    try {
      parsed = JSON.parse(stripCodeFences(content));
    } catch (parseError) {
      console.error('Research JSON parse failed:', parseError instanceof Error ? parseError.message : parseError);
      return { profile: null, cost };
    }

    const toStringArray = (value: unknown, maxItems: number): string[] => {
      if (!Array.isArray(value)) return [];
      return value
        .slice(0, maxItems)
        .map((item) => sanitizeInput(String(item), 200));
    };

    const profile: ResearchProfile = {
      summary: sanitizeInput(typeof parsed.summary === 'string' ? parsed.summary : '', 600),
      key_factors: toStringArray(parsed.key_factors, 4),
      home_notes: toStringArray(parsed.home_notes, 2),
      away_notes: toStringArray(parsed.away_notes, 2),
      model,
    };
    return { profile: profile.summary ? profile : null, cost };
  } catch (error) {
    console.error('Research layer failed:', error instanceof Error ? error.message : error);
    return { profile: null, cost: 0 };
  }
}

// ============================================
// LAYER 2 — JEV DECISIONS
// ============================================
function buildState(
  game: TopPickGame,
  ratings: { home?: TeamInfo; away?: TeamInfo },
  research: ResearchProfile | null
) {
  const teamState = (team: string, info?: TeamInfo) => ({
    team,
    record: info ? `${info.wins}-${info.losses}` : null,
    rating: info?.rating ?? null,
    rank: info?.rank ?? null,
  });

  return {
    sport: game.sport,
    game: `${game.awayTeam} @ ${game.homeTeam}`,
    tipoff: game.gameTime,
    ...(game.venue ? { venue: game.venue } : {}),
    ...(game.provider ? { line_source: game.provider } : {}),
    market: {
      home_moneyline: game.homeMoneyline,
      away_moneyline: game.awayMoneyline,
      ...(game.drawMoneyline !== undefined ? { draw_moneyline: game.drawMoneyline } : {}),
      ...(game.spread !== undefined ? { home_spread: game.spread } : {}),
      ...(game.spreadOdds !== undefined ? { home_spread_odds: game.spreadOdds } : {}),
      ...(game.total !== undefined ? { total: game.total } : {}),
      ...(game.totalOdds !== undefined ? { over_odds: game.totalOdds } : {}),
    },
    ...(game.conditions ? {
      conditions: {
        home_injuries: game.conditions.homeInjuries.map((i) => `${i.name} (${i.status}, impact ${i.impactScore}/10)`),
        away_injuries: game.conditions.awayInjuries.map((i) => `${i.name} (${i.status}, impact ${i.impactScore}/10)`),
        rest_days: game.conditions.restDays,
        notes: game.conditions.notes,
      },
    } : {}),
    team_quality: {
      home: teamState(game.homeTeam, ratings.home),
      away: teamState(game.awayTeam, ratings.away),
    },
    ...(research
      ? {
          research_profile: {
            summary: research.summary,
            key_factors: research.key_factors,
            home_notes: research.home_notes,
            away_notes: research.away_notes,
          },
        }
      : {}),
  };
}

function buildQuestions(game: TopPickGame) {
  const threeWay = game.drawMoneyline !== undefined;

  const questions: Record<string, unknown> = {
    winner: threeWay
      ? {
          type: 'choice',
          instructions:
            'Which outcome is most likely to win this match? This is a three-way 1X2 market: home win, draw, or away win. ' +
            'Use the records, ratings and research profile to assign calibrated probabilities for all three outcomes. Judge the teams, not the market price. ' +
            'Return calibrated decimals between 0.03 and 0.95 for each outcome — never 0 or 1.',
          criteria: {
            home: `${game.homeTeam} wins the match.`,
            draw: 'The match ends in a draw.',
            away: `${game.awayTeam} wins the match.`,
          },
        }
      : {
          type: 'choice',
          instructions:
            'Which team is more likely to win this game outright? Use the records, ratings and research profile to assign calibrated win probabilities. Judge the teams, not the market price. ' +
            'Return calibrated decimals between 0.05 and 0.95 for both sides — never 0, 1, or anything outside that range, even for heavy favorites.',
          criteria: {
            home: `${game.homeTeam} wins the game outright.`,
            away: `${game.awayTeam} wins the game outright.`,
          },
        },
    situational_edge: {
      type: 'score',
      instructions:
        'Considering form, schedule, venue and any situational factors present in the state, how does the non-team-quality edge lean for this game?',
      criteria: [
        `Clearly favors ${game.awayTeam}`,
        `Slightly favors ${game.awayTeam}`,
        'Neutral — no meaningful situational edge',
        `Slightly favors ${game.homeTeam}`,
        `Clearly favors ${game.homeTeam}`,
      ],
    },
  };

  if (game.spread !== undefined) {
    questions.home_covers = {
      type: 'noul',
      instructions: `Will ${game.homeTeam} cover a spread of ${formatLine(game.spread)}? Covering means winning by more than ${Math.abs(
        game.spread
      )} points (or losing by fewer if ${game.homeTeam} is the underdog at ${formatLine(game.spread)}).`,
      criteria: {
        true: `${game.homeTeam} covers the ${formatLine(game.spread)} line.`,
        false: `${game.homeTeam} fails to cover the ${formatLine(game.spread)} line.`,
      },
    };
  }

  if (game.total !== undefined) {
    questions.total_over = {
      type: 'noul',
      instructions: `Will the combined score of both teams be more than ${game.total}?`,
      criteria: {
        true: `The game goes Over ${game.total}.`,
        false: `The game stays Under ${game.total}.`,
      },
    };
  }

  return questions;
}

interface JevRaw {
  answers: Record<string, { type?: string; choice?: string; confidence?: number; probabilities?: Record<string, number>; noul?: number; score?: number }> | null;
  model?: string;
  usage?: { cost?: number };
}

async function runJev(game: TopPickGame, ratings: { home?: TeamInfo; away?: TeamInfo }, research: ResearchProfile | null): Promise<JevRaw | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  try {
    const response = await fetch(DECISIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
        'X-Title': 'KCMPICKS',
      },
      body: JSON.stringify({
        model: JEV_MODEL,
        state: buildState(game, ratings, research),
        questions: buildQuestions(game),
      }),
      signal: AbortSignal.timeout(45000),
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error('Jev API error:', response.status, (await response.text()).slice(0, 300));
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Jev call failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

// ============================================
// LAYER 3 — VALUE ENGINE
// ============================================
interface ValueInputs {
  game: TopPickGame;
  answers: NonNullable<JevRaw['answers']>;
  minEv: number;
}

function probabilityOfWinner(
  answers: JevRaw['answers'],
  threeWay = false
): { home: number; away: number; draw: number; confidence: number } {
  const winner = answers?.winner;
  const probs = (winner?.probabilities ?? {}) as Record<string, number>;
  const confidence = typeof winner?.confidence === 'number' ? winner.confidence : 0.5;

  const has = (key: string) => typeof probs[key] === 'number' && isFinite(probs[key]) && probs[key] >= 0;

  let home: number;
  let away: number;
  let draw = 0;

  if (threeWay && has('home') && has('away') && has('draw')) {
    home = probs.home;
    away = probs.away;
    draw = probs.draw;
  } else if (has('home') && has('away')) {
    home = probs.home;
    away = probs.away;
    if (threeWay && has('draw')) draw = probs.draw;
  } else if (has('home')) {
    home = probs.home;
    away = 1 - home;
  } else if (has('away')) {
    away = probs.away;
    home = 1 - away;
  } else if (threeWay && winner?.choice === 'draw') {
    draw = clamp(confidence, 0, 1);
    home = (1 - draw) / 2;
    away = 1 - draw - home;
  } else {
    home = winner?.choice === 'home' ? confidence : winner?.choice === 'away' ? 1 - confidence : 0.5;
    away = 1 - home;
  }

  const total = home + away + draw;
  if (total <= 0) return { home: threeWay ? 1 / 3 : 0.5, away: threeWay ? 1 / 3 : 0.5, draw: threeWay ? 1 / 3 : 0, confidence };

  // Jev's choice probabilities often saturate near 0/1 even when instructed
  // otherwise; clamp each raw prob before normalizing so the market-shrink
  // blend below starts from a calibrated range (mirrors the prompt bounds).
  const rawHome = clamp(home / total, 0.05, 0.95);
  const rawAway = clamp(away / total, 0.05, 0.95);
  const rawDraw = threeWay ? clamp(draw / total, 0.0, 0.9) : 0;
  const renorm = rawHome + rawAway + rawDraw;
  if (renorm <= 0) return { home: threeWay ? 1 / 3 : 0.5, away: threeWay ? 1 / 3 : 0.5, draw: threeWay ? 1 / 3 : 0, confidence };
  return { home: rawHome / renorm, away: rawAway / renorm, draw: rawDraw / renorm, confidence };
}

function marketShrink(): number {
  const raw = Number(process.env.JEV_MARKET_SHRINK);
  return Number.isFinite(raw) ? clamp(raw, 0, 1) : DEFAULT_MARKET_SHRINK;
}

function makeCandidate(params: {
  betType: BetType;
  selection: string;
  side: string;
  odds: number;
  oddsAssumed: boolean;
  probability: number;
  rawProbability?: number;
  marketRaw: number;
  fair: number;
  line?: number;
  minEv: number;
}): ValueCandidate {
  const expectedValue = params.probability * americanToDecimal(params.odds) - 1;
  const edge = (params.probability - params.fair) * 100;
  return {
    betType: params.betType,
    selection: params.selection,
    side: params.side,
    odds: params.odds,
    oddsAssumed: params.oddsAssumed,
    line: params.line,
    jevProbability: params.probability,
    rawJevProbability: params.rawProbability ?? params.probability,
    marketProbability: params.marketRaw,
    fairProbability: params.fair,
    edge: Math.round(edge * 10) / 10,
    expectedValue: Math.round(expectedValue * 1000) / 1000,
    valueBet: expectedValue >= params.minEv && params.probability >= 0.5,
  };
}

function buildCandidates({ game, answers, minEv }: ValueInputs): {
  candidates: ValueCandidate[];
  probabilities: TopPick['probabilities'];
  situationalEdge: number | null;
  jevConfidence: number;
} {
  const threeWay = game.drawMoneyline !== undefined;
  const { home, away, draw, confidence } = probabilityOfWinner(answers, threeWay);
  const shrink = marketShrink();

  const candidates: ValueCandidate[] = [];
  const probabilities: TopPick['probabilities'] = { homeWin: 0.5, awayWin: 0.5 };

  if (threeWay && game.drawMoneyline !== undefined) {
    // Soccer 1X2: devig all three legs so the draw's vig isn't dumped onto home/away.
    const fair = devigThreeWay(game.homeMoneyline, game.drawMoneyline, game.awayMoneyline);
    const rawHome = americanToImplied(game.homeMoneyline);
    const rawDraw = americanToImplied(game.drawMoneyline);
    const rawAway = americanToImplied(game.awayMoneyline);

    const pHome = fair.home + shrink * (home - fair.home);
    const pDraw = fair.draw + shrink * (draw - fair.draw);
    const pAway = fair.away + shrink * (away - fair.away);

    candidates.push(
      makeCandidate({
        betType: 'moneyline',
        selection: `${game.homeTeam} ML`,
        side: game.homeTeam,
        odds: game.homeMoneyline,
        oddsAssumed: false,
        probability: pHome,
        rawProbability: home,
        marketRaw: rawHome,
        fair: fair.home,
        minEv,
      }),
      makeCandidate({
        betType: 'moneyline',
        selection: 'Draw',
        side: 'Draw',
        odds: game.drawMoneyline,
        oddsAssumed: false,
        probability: pDraw,
        rawProbability: draw,
        marketRaw: rawDraw,
        fair: fair.draw,
        minEv,
      }),
      makeCandidate({
        betType: 'moneyline',
        selection: `${game.awayTeam} ML`,
        side: game.awayTeam,
        odds: game.awayMoneyline,
        oddsAssumed: false,
        probability: pAway,
        rawProbability: away,
        marketRaw: rawAway,
        fair: fair.away,
        minEv,
      })
    );

    probabilities.homeWin = pHome;
    probabilities.awayWin = pAway;
  } else {
    const fair = devigTwoWay(game.homeMoneyline, game.awayMoneyline);
    const rawHome = americanToImplied(game.homeMoneyline);
    const rawAway = americanToImplied(game.awayMoneyline);

    const pHome = fair.home + shrink * (home - fair.home);
    const pAway = fair.away + shrink * (away - fair.away);

    candidates.push(
      makeCandidate({
        betType: 'moneyline',
        selection: `${game.homeTeam} ML`,
        side: game.homeTeam,
        odds: game.homeMoneyline,
        oddsAssumed: false,
        probability: pHome,
        rawProbability: home,
        marketRaw: rawHome,
        fair: fair.home,
        minEv,
      }),
      makeCandidate({
        betType: 'moneyline',
        selection: `${game.awayTeam} ML`,
        side: game.awayTeam,
        odds: game.awayMoneyline,
        oddsAssumed: false,
        probability: pAway,
        rawProbability: away,
        marketRaw: rawAway,
        fair: fair.away,
        minEv,
      })
    );

    probabilities.homeWin = pHome;
    probabilities.awayWin = pAway;
  }

  if (game.spread !== undefined && typeof answers.home_covers?.noul === 'number') {
    const covers = clamp(answers.home_covers.noul, 0.05, 0.95);
    const homeSpreadOdds = game.spreadOdds ?? -110;
    const awaySpreadOdds = game.awaySpreadOdds ?? game.spreadOdds ?? -110;
    const awayLine = -game.spread;
    // Devig the two quoted prices so the fair cover prob reflects the actual book hold
    // (falls back to 0.5/0.5 when the price is assumed -110/-110).
    const fairSpread = devigTwoWay(homeSpreadOdds, awaySpreadOdds);
    probabilities.homeCovers = covers;

    candidates.push(
      makeCandidate({
        betType: 'spread',
        selection: `${game.homeTeam} ${formatLine(game.spread)}`,
        side: game.homeTeam,
        odds: homeSpreadOdds,
        oddsAssumed: game.spreadOdds === undefined,
        probability: fairSpread.home + shrink * (covers - fairSpread.home),
        rawProbability: covers,
        marketRaw: americanToImplied(homeSpreadOdds),
        fair: fairSpread.home,
        line: game.spread,
        minEv,
      }),
      makeCandidate({
        betType: 'spread',
        selection: `${game.awayTeam} ${formatLine(awayLine)}`,
        side: game.awayTeam,
        odds: awaySpreadOdds,
        oddsAssumed: game.awaySpreadOdds === undefined && game.spreadOdds === undefined,
        probability: fairSpread.away + shrink * (1 - covers - fairSpread.away),
        rawProbability: 1 - covers,
        marketRaw: americanToImplied(awaySpreadOdds),
        fair: fairSpread.away,
        line: awayLine,
        minEv,
      })
    );
  }

  if (game.total !== undefined && typeof answers.total_over?.noul === 'number') {
    const over = clamp(answers.total_over.noul, 0.05, 0.95);
    const overOdds = game.totalOdds ?? -110;
    const underOdds = game.underOdds ?? game.totalOdds ?? -110;
    const fairTotal = devigTwoWay(overOdds, underOdds);
    probabilities.overProb = over;

    candidates.push(
      makeCandidate({
        betType: 'total',
        selection: `Over ${game.total}`,
        side: 'Over',
        odds: overOdds,
        oddsAssumed: game.totalOdds === undefined,
        probability: fairTotal.home + shrink * (over - fairTotal.home),
        rawProbability: over,
        marketRaw: americanToImplied(overOdds),
        fair: fairTotal.home,
        line: game.total,
        minEv,
      }),
      makeCandidate({
        betType: 'total',
        selection: `Under ${game.total}`,
        side: 'Under',
        odds: underOdds,
        oddsAssumed: game.underOdds === undefined && game.totalOdds === undefined,
        probability: fairTotal.away + shrink * (1 - over - fairTotal.away),
        rawProbability: 1 - over,
        marketRaw: americanToImplied(underOdds),
        fair: fairTotal.away,
        line: game.total,
        minEv,
      })
    );
  }

  const score = answers.situational_edge?.score;
  const situationalEdge = typeof score === 'number' ? Math.round((score - 2) * 10) / 10 : null;

  return { candidates, probabilities, situationalEdge, jevConfidence: confidence };
}

function buildRationale(
  game: TopPickGame,
  candidate: ValueCandidate,
  probabilities: TopPick['probabilities'],
  situationalEdge: number | null,
  research: ResearchProfile | null
): string[] {
  const rationale: string[] = [];

  rationale.push(
    `Jev: ${candidate.side} at ${(candidate.jevProbability * 100).toFixed(1)}% vs ${(candidate.fairProbability * 100).toFixed(1)}% fair market implied ` +
      `(${candidate.odds > 0 ? '+' : ''}${candidate.odds}) → edge ${candidate.edge >= 0 ? '+' : ''}${candidate.edge.toFixed(1)}pts, EV ${
        candidate.expectedValue >= 0 ? '+' : ''
      }${(candidate.expectedValue * 100).toFixed(1)}%`
  );

  if (situationalEdge !== null) {
    const lean =
      situationalEdge > 0.4
        ? game.homeTeam
        : situationalEdge < -0.4
          ? game.awayTeam
          : 'neither side';
    rationale.push(`Situational edge score ${situationalEdge >= 0 ? '+' : ''}${situationalEdge} (leans ${lean})`);
  }

  if (research?.summary) rationale.push(`Research: ${research.summary}`);
  else if (research?.key_factors.length) rationale.push(`Research: ${research.key_factors[0]}`);

  if (Math.abs(candidate.rawJevProbability - candidate.jevProbability) > 0.015) {
    rationale.push(
      `Probability blended with market prior: Jev raw ${(candidate.rawJevProbability * 100).toFixed(1)}% → ${(candidate.jevProbability * 100).toFixed(1)}%`
    );
  }

  if (candidate.oddsAssumed) {
    rationale.push('Spread/total price assumed -110 (source quotes the line but not the price)');
  }

  if (probabilities.homeCovers !== undefined) {
    rationale.push(`Cover probability for ${game.homeTeam}: ${(probabilities.homeCovers * 100).toFixed(1)}%`);
  }
  if (probabilities.overProb !== undefined) {
    rationale.push(`Over probability: ${(probabilities.overProb * 100).toFixed(1)}%`);
  }

  return rationale
    .map((line) => sanitizeInput(line, 300))
    .filter(Boolean)
    .slice(0, 4);
}

// ============================================
// RATINGS LOOKUP (Supabase, service role)
// ============================================
async function fetchRatingsForSport(sport: string): Promise<Map<string, TeamInfo>> {
  const map = new Map<string, TeamInfo>();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return map;

  try {
    const supabase = createSupabaseClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await supabase
      .from('team_ratings')
      .select('team_name, rating, rank, wins, losses')
      .eq('sport', sport)
      .limit(500);
    if (error) throw error;
    for (const row of data ?? []) map.set(row.team_name.toLowerCase(), row as TeamInfo);
  } catch (error) {
    console.warn('Ratings lookup failed:', error instanceof Error ? error.message : error);
  }
  return map;
}

function matchRating(ratings: Map<string, TeamInfo>, teamName: string): TeamInfo | undefined {
  const direct = ratings.get(teamName.toLowerCase());
  if (direct) return direct;
  const needle = teamName.toLowerCase();
  for (const [name, info] of ratings) {
    if (name.includes(needle) || needle.includes(name)) return info;
  }
  return undefined;
}

// ============================================
// ORCHESTRATION
// ============================================
export async function generateTopPicks(
  games: TopPickGame[],
  options: GenerateOptions = {}
): Promise<TopPicksResult> {
  const useResearch = options.useResearch !== false;
  const limit = clamp(options.limit ?? DEFAULT_LIMIT, 1, 10);
  const minEv = typeof options.minEv === 'number' ? clamp(options.minEv, -0.05, 0.5) : DEFAULT_MIN_EV;

  const validGames = games
    .slice(0, MAX_GAMES)
    .map(sanitizeGame)
    .filter(
      (g) =>
        !!g.homeTeam &&
        !!g.awayTeam &&
        isFinite(g.homeMoneyline) &&
        isFinite(g.awayMoneyline) &&
        g.homeMoneyline !== 0 &&
        g.awayMoneyline !== 0
    );

  const ratingCache = new Map<string, Map<string, TeamInfo>>();
  for (const game of validGames) {
    if (!ratingCache.has(game.sport)) ratingCache.set(game.sport, await fetchRatingsForSport(game.sport));
  }

  let researchCost = 0;
  let jevCost = 0;

  const analyzed = await mapWithConcurrency(validGames, 4, async (game) => {
    const sportRatings = ratingCache.get(game.sport) ?? new Map<string, TeamInfo>();
    const ratings = {
      home: matchRating(sportRatings, game.homeTeam),
      away: matchRating(sportRatings, game.awayTeam),
    };

    let research: ResearchProfile | null = null;
    if (useResearch) {
      const result = await researchGame(game, ratings);
      research = result.profile;
      researchCost += result.cost;
    }

    const jev = await runJev(game, ratings, research);
    if (!jev?.answers) return null;
    jevCost += jev.usage?.cost ?? 0;

    const { candidates, probabilities, situationalEdge, jevConfidence } = buildCandidates({
      game,
      answers: jev.answers,
      minEv,
    });

    // Select best candidate by HIGHEST CONFIDENCE (jevProbability) instead of EV
    // This ensures the "top pick" is the one Jev is most confident about
    const best = [...candidates]
      .filter((c) => c.jevProbability >= 0.45)
      .sort((a, b) => b.jevProbability - a.jevProbability)[0];
    if (!best) return null;

    const confidence = clamp(
      Math.round(best.jevProbability * 50 + jevConfidence * 30 + Math.min(Math.max(best.edge, 0), 12) * 1.5),
      40,
      98
    );

    return {
      pick: {
        game: {
          id: game.id,
          sport: game.sport,
          homeTeam: game.homeTeam,
          awayTeam: game.awayTeam,
          gameTime: game.gameTime,
          homeMoneyline: game.homeMoneyline,
          awayMoneyline: game.awayMoneyline,
          drawMoneyline: game.drawMoneyline,
          spread: game.spread,
          total: game.total,
          spreadOdds: game.spreadOdds,
          awaySpreadOdds: game.awaySpreadOdds,
          totalOdds: game.totalOdds,
          underOdds: game.underOdds,
          venue: game.venue,
          provider: game.provider,
          homeLogo: game.homeLogo,
          awayLogo: game.awayLogo,
          homeAbbr: game.homeAbbr,
          awayAbbr: game.awayAbbr,
          openingHomeMoneyline: game.openingHomeMoneyline,
          openingAwayMoneyline: game.openingAwayMoneyline,
          openingSpread: game.openingSpread,
          openingHomeSpreadOdds: game.openingHomeSpreadOdds,
          openingAwaySpreadOdds: game.openingAwaySpreadOdds,
          openingTotal: game.openingTotal,
          openingOverOdds: game.openingOverOdds,
          openingUnderOdds: game.openingUnderOdds,
          openingOddsCapturedAt: game.openingOddsCapturedAt,
          conditions: game.conditions,
          bettingSplit: game.bettingSplit,
        },
        candidate: best,
        confidence,
        probabilities,
        situationalEdge,
        research,
        rationale: buildRationale(game, best, probabilities, situationalEdge, research),
      } satisfies TopPick,
      jevModel: jev.model || JEV_MODEL,
    };
  });

  const successful = analyzed.flatMap((x) => (x ? [x] : []));

  // Best model bet per game (top candidate by EV), before the minEv filter.
  // This is what we persist for calibration — measured on every prediction,
  // not only the ones that cleared the value threshold.
  const allPicks = successful
    .map((x) => x.pick)
    .sort((a, b) => b.candidate.expectedValue - a.candidate.expectedValue);

  // Returned bets: only those that cleared the +EV threshold.
  const picks = allPicks.filter((p) => p.candidate.valueBet).slice(0, limit);

  return {
    picks,
    allPicks,
    analyzed: successful.length,
    gamesWithoutOdds: games.length - validGames.length,
    models: {
      research: useResearch ? process.env.OPENROUTER_RESEARCH_MODEL || DEFAULT_RESEARCH_MODEL : null,
      jev: successful[0]?.jevModel || JEV_MODEL,
    },
    costs: {
      research: Math.round(researchCost * 100000) / 100000,
      jev: Math.round(jevCost * 100000) / 100000,
    },
    minEv,
    shrink: marketShrink(),
    generatedAt: new Date().toISOString(),
  };
}
