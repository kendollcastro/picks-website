// ============================================
// KCMPICKS - Jev AI Prediction Service
// Jev (TypeSafe System One) via OpenRouter Decisions API
// SERVER-ONLY: uses OPENROUTER_API_KEY. Never import from a
// client component without `import type` — the key stays on the server.
// https://openrouter.ai/docs/api/api-reference/alphadecisions/submit-a-decisions-request
// ============================================

const DECISIONS_URL = 'https://openrouter.ai/api/alpha/decisions';
const JEV_MODEL = '~typesafe/jev-latest';

export interface JevContext {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  homeOdds: number;
  awayOdds: number;
  homeRating?: number;
  awayRating?: number;
  homeWins?: number;
  homeLosses?: number;
  awayWins?: number;
  awayLosses?: number;
  recentForm?: string;
}

export interface JevPrediction {
  pick: string;
  pickType: 'moneyline';
  confidence: number;
  reasoning: string;
  factors: {
    positive: string[];
    negative: string[];
  };
  expectedValue?: number;
  homeWinProbability: number;
  awayWinProbability: number;
  edge: number;
  edgeProbability: number;
  model: string;
  cost?: number;
}

// ============================================
// ODDS MATH (American odds)
// ============================================
export function americanToImplied(odds: number): number {
  if (!isFinite(odds) || odds === 0) return 0.5;
  if (odds > 0) return 100 / (odds + 100);
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

export function americanToDecimal(odds: number): number {
  if (!isFinite(odds) || odds === 0) return 2;
  if (odds > 0) return 1 + odds / 100;
  return 1 + 100 / Math.abs(odds);
}

// ============================================
// JEV REQUEST BUILDERS
// ============================================
function buildState(context: JevContext) {
  const record =
    (wins?: number, losses?: number) =>
      wins !== undefined && losses !== undefined ? `${wins}-${losses}` : undefined;

  return {
    sport: context.sport,
    game: `${context.awayTeam} @ ${context.homeTeam}`,
    home_team: context.homeTeam,
    away_team: context.awayTeam,
    home_moneyline: context.homeOdds,
    away_moneyline: context.awayOdds,
    home_rating: context.homeRating,
    away_rating: context.awayRating,
    home_record: record(context.homeWins, context.homeLosses),
    away_record: record(context.awayWins, context.awayLosses),
    recent_form: context.recentForm,
  };
}

function buildQuestions(context: JevContext) {
  return {
    winner: {
      type: 'choice',
      instructions:
        'Which team is more likely to win this game outright? Consider team quality, ratings, records, and any home-court advantage. Report your calibrated win probabilities independent of the market odds.',
      criteria: {
        home: `The home team, ${context.homeTeam}, wins the game outright.`,
        away: `The away team, ${context.awayTeam}, wins the game outright.`,
      },
    },
    edge: {
      type: 'noul',
      instructions:
        'Is the market moneyline mispriced relative to the true win probability of the favored team? In other words, is there a meaningful betting edge on the favorite right now?',
      criteria: {
        true: 'The market odds undervalue the likely winner; there is a clear betting edge on the favorite.',
        false: 'The market odds fairly reflect the true win probability; there is no meaningful edge.',
      },
    },
  };
}

// ============================================
// JEV CALL
// ============================================
export async function getJevPrediction(context: JevContext): Promise<JevPrediction | null> {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    console.warn('No OPENROUTER_API_KEY configured; Jev prediction unavailable');
    return null;
  }

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
        state: buildState(context),
        questions: buildQuestions(context),
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const body = await response.text();
      console.error('Jev API error:', response.status, body.slice(0, 500));
      return null;
    }

    const data = await response.json();
    return mapAnswersToPrediction(context, data?.answers, data);
  } catch (error) {
    console.error('Error calling Jev:', error);
    return null;
  }
}

// ============================================
// ANSWER MAPPING
// ============================================
interface JevAnswerShape {
  type?: string;
  choice?: string;
  confidence?: number;
  probabilities?: Record<string, number | undefined>;
  noul?: number;
}

export function mapAnswersToPrediction(
  context: JevContext,
  answers: Record<string, JevAnswerShape> | null | undefined,
  meta?: { model?: string; usage?: { cost?: number } }
): JevPrediction | null {
  if (!answers?.winner) return null;

  const model = meta?.model || JEV_MODEL;
  const cost = meta?.usage?.cost;
  const winner = answers.winner;
  const edgeNoul = typeof answers.edge?.noul === 'number' ? answers.edge.noul : 0.5;

  const probs = winner.probabilities ?? {};
  let homeProb =
    typeof probs.home === 'number' ? probs.home : typeof probs[context.homeTeam] === 'number' ? probs[context.homeTeam] : undefined;
  let awayProb =
    typeof probs.away === 'number' ? probs.away : typeof probs[context.awayTeam] === 'number' ? probs[context.awayTeam] : undefined;

  const confidenceRaw =
    typeof winner.confidence === 'number' ? Math.max(0, Math.min(1, winner.confidence)) : 0.5;

  if (homeProb === undefined && awayProb === undefined) {
    homeProb = winner.choice === 'home' ? confidenceRaw : 1 - confidenceRaw;
    awayProb = 1 - homeProb;
  } else {
    homeProb = homeProb ?? 1 - (awayProb ?? 0.5);
    awayProb = awayProb ?? 1 - homeProb;
  }

  const pick =
    winner.choice === 'home' ? context.homeTeam : winner.choice === 'away' ? context.awayTeam : 'pass';

  const homeImplied = americanToImplied(context.homeOdds);
  const awayImplied = americanToImplied(context.awayOdds);
  const pickProb = pick === context.homeTeam ? homeProb : pick === context.awayTeam ? awayProb : 0.5;
  const pickImplied = pick === context.homeTeam ? homeImplied : pick === context.awayTeam ? awayImplied : 0.5;
  const edge = pick === 'pass' ? 0 : (pickProb - pickImplied) * 100;
  const hasEdge = edgeNoul >= 0.5 && edge >= 1;

  if (pick === 'pass' || !hasEdge) {
    const favored = homeProb >= awayProb ? context.homeTeam : context.awayTeam;
    const favoredProb = Math.max(homeProb, awayProb);
    const favoredImplied = homeProb >= awayProb ? homeImplied : awayImplied;
    return {
      pick: 'pass',
      pickType: 'moneyline',
      confidence: 30,
      reasoning: `Jev (${model}) sees no clear edge: ${favored} at ${(favoredProb * 100).toFixed(0)}% vs ${(favoredImplied * 100).toFixed(0)}% implied by the moneyline. System One structured decision — no generated text.`,
      factors: {
        positive: ['Model win probability tracks the market implied probability within ~1 point'],
        negative: ['No meaningful value between Jev probability and the market line'],
      },
      homeWinProbability: homeProb,
      awayWinProbability: awayProb,
      edge,
      edgeProbability: edgeNoul,
      model,
      cost,
    };
  }

  const pickOdds = pick === context.homeTeam ? context.homeOdds : context.awayOdds;
  const expectedValue = (pickProb * americanToDecimal(pickOdds) - 1) * 100;
  const confidence = Math.round(Math.min(98, Math.max(40, confidenceRaw * 100)));

  const positive: string[] = [];
  const negative: string[] = [];

  positive.push(
    `Jev assigns ${pick} a ${(pickProb * 100).toFixed(0)}% win probability vs ${(pickImplied * 100).toFixed(0)}% implied by the moneyline (${pickOdds > 0 ? '+' : ''}${pickOdds})`
  );
  if (confidenceRaw >= 0.7) positive.push(`High model confidence: ${(confidenceRaw * 100).toFixed(0)}%`);
  if (edgeNoul >= 0.7) positive.push(`Edge signal strong (${(edgeNoul * 100).toFixed(0)}%)`);
  if (context.homeRating !== undefined && context.awayRating !== undefined) {
    const diff = context.homeRating - context.awayRating;
    positive.push(`Rating edge ${Math.abs(diff).toFixed(1)} ${diff >= 0 ? 'favoring the home team' : 'favoring the away team'}`);
  }
  if (pick === context.homeTeam && context.homeWins !== undefined && context.homeLosses !== undefined) {
    positive.push(`Home record: ${context.homeWins}-${context.homeLosses}`);
  }

  negative.push('Jev returns structured decisions, not narrative analysis — verify with your own research');
  if (confidenceRaw < 0.75) negative.push(`Moderate model confidence: ${(confidenceRaw * 100).toFixed(0)}%`);
  if (edge < 3) negative.push(`Edge is thin (${edge.toFixed(1)}pts) — sizing should be conservative`);

  return {
    pick,
    pickType: 'moneyline',
    confidence,
    reasoning: `Jev (${model}) picks ${pick} with ${(pickProb * 100).toFixed(0)}% win probability, an edge of ${edge.toFixed(1)}pts over the moneyline implied ${(pickImplied * 100).toFixed(0)}%. System One structured decision — no generated text.`,
    factors: { positive: positive.slice(0, 3), negative: negative.slice(0, 2) },
    expectedValue: Math.round(expectedValue * 10) / 10,
    homeWinProbability: homeProb,
    awayWinProbability: awayProb,
    edge: Math.round(edge * 10) / 10,
    edgeProbability: edgeNoul,
    model,
    cost,
  };
}