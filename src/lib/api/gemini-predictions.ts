// ============================================
// KCMPICKS - Gemini AI Prediction Service
// Uses Google Gemini for AI-powered game predictions.
// SERVER-ONLY: uses GEMINI_API_KEY. This file is not imported by client
// components; keep it that way to avoid exposing the key in the browser.
// ============================================

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

export interface GameContext {
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

export interface GeminiPrediction {
  pick: string;
  pickType: 'moneyline' | 'spread' | 'total';
  confidence: number;
  reasoning: string;
  factors: {
    positive: string[];
    negative: string[];
  };
  expectedValue?: number;
}

export async function getGeminiPrediction(context: GameContext): Promise<GeminiPrediction | null> {
  if (!GEMINI_API_KEY) {
    console.warn('No Gemini API key configured');
    return null;
  }

  const prompt = buildPredictionPrompt(context);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024,
          }
        })
      }
    );

    if (!response.ok) {
      console.error('Gemini API error:', response.status);
      return null;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    return parseGeminiResponse(text, context);
  } catch (error) {
    console.error('Error calling Gemini:', error);
    return null;
  }
}

function buildPredictionPrompt(context: GameContext): string {
  const { homeTeam, awayTeam, sport, homeOdds, awayOdds, homeRating, awayRating, homeWins, homeLosses, awayWins, awayLosses } = context;
  
  const homeRecord = homeWins !== undefined ? `${homeWins}-${homeLosses}` : 'N/A';
  const awayRecord = awayWins !== undefined ? `${awayWins}-${awayLosses}` : 'N/A';
  const ratingDiff = homeRating && awayRating ? `Rating difference: ${(homeRating - awayRating).toFixed(1)}` : '';

  return `
You are a sports betting analyst. Analyze the following game and provide a prediction.

GAME DETAILS:
- Sport: ${sport}
- Home Team: ${homeTeam} (Record: ${homeRecord})
- Away Team: ${awayTeam} (Record: ${awayRecord})
${ratingDiff}

BETTING ODDS:
- ${homeTeam} ML: ${homeOdds > 0 ? '+' : ''}${homeOdds}
- ${awayTeam} ML: ${awayOdds > 0 ? '+' : ''}${awayOdds}

Based on team performance, recent form, matchup history, and the betting odds, provide:

1. PICK: Which team to bet on (or "PASS" if no clear edge)
2. PICK TYPE: moneyline, spread, or total
3. CONFIDENCE: A number from 1-100
4. REASONING: Brief explanation (1-2 sentences)
5. KEY FACTORS: 3 positive factors and 2 negative factors
6. EXPECTED VALUE: Estimated % edge (optional)

Format your response as:
PICK: [home/away/pass]
PICK_TYPE: [moneyline/spread/total]
CONFIDENCE: [1-100]
REASONING: [brief explanation]
POSITIVE: [factor 1], [factor 2], [factor 3]
NEGATIVE: [factor 1], [factor 2]
EXPECTED_VALUE: [optional %]
`;
}

function parseGeminiResponse(text: string, context: GameContext): GeminiPrediction {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l);
  
  let pick = 'pass';
  let pickType: 'moneyline' | 'spread' | 'total' = 'moneyline';
  let confidence = 50;
  let reasoning = 'AI analysis complete';
  let positiveFactors: string[] = [];
  let negativeFactors: string[] = [];
  let expectedValue: number | undefined;

  for (const line of lines) {
    if (line.startsWith('PICK:')) {
      const value = line.replace('PICK:', '').trim().toLowerCase();
      if (value.includes('home')) pick = context.homeTeam;
      else if (value.includes('away')) pick = context.awayTeam;
      else pick = 'pass';
    }
    else if (line.startsWith('PICK_TYPE:')) {
      const value = line.replace('PICK_TYPE:', '').trim().toLowerCase();
      if (value.includes('spread')) pickType = 'spread';
      else if (value.includes('total')) pickType = 'total';
      else pickType = 'moneyline';
    }
    else if (line.startsWith('CONFIDENCE:')) {
      const match = line.match(/\d+/);
      if (match) confidence = Math.min(100, Math.max(1, parseInt(match[0])));
    }
    else if (line.startsWith('REASONING:')) {
      reasoning = line.replace('REASONING:', '').trim();
    }
    else if (line.startsWith('POSITIVE:')) {
      positiveFactors = line.replace('POSITIVE:', '').split(',').map(s => s.trim()).filter(s => s);
    }
    else if (line.startsWith('NEGATIVE:')) {
      negativeFactors = line.replace('NEGATIVE:', '').split(',').map(s => s.trim()).filter(s => s);
    }
    else if (line.startsWith('EXPECTED_VALUE:')) {
      const match = line.match(/-?\d+/);
      if (match) expectedValue = parseFloat(match[0]);
    }
  }

  // If pass, set confidence low
  if (pick === 'pass') {
    confidence = 30;
  }

  return {
    pick,
    pickType,
    confidence,
    reasoning,
    factors: { positive: positiveFactors.slice(0, 3), negative: negativeFactors.slice(0, 2) },
    expectedValue,
  };
}

// ============================================
// BATCH PREDICTIONS WITH GEMINI
// ============================================
export async function getGeminiBatchPredictions(
  games: GameContext[]
): Promise<Map<string, GeminiPrediction>> {
  const predictions = new Map<string, GeminiPrediction>();
  
  // Process sequentially to avoid rate limits
  for (const game of games) {
    const key = `${game.homeTeam}-${game.awayTeam}`;
    const prediction = await getGeminiPrediction(game);
    if (prediction) {
      predictions.set(key, prediction);
    }
    // Small delay between calls
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  return predictions;
}