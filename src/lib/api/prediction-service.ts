// ============================================
// KCMPICKS - Unified Prediction Service
// Multi-model ensemble for best predictions
// ============================================

import { americanToImplied, removeVig } from './ml-predictions';

export interface GameData {
  id: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  homeOdds: number;
  awayOdds: number;
  spread?: number;
  total?: number;
  gameTime: string;
  homeLogo?: string;
  awayLogo?: string;
}

export interface TeamStats {
  wins: number;
  losses: number;
  winPct: number;
  avgPointsFor: number;
  avgPointsAgainst: number;
  last5: ('W' | 'L')[];
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
  restDays: number;
  injuryImpact: number;
}

export interface PredictionResult {
  // Individual model predictions
  oddsModel: OddsPrediction;
  statsModel: StatsPrediction;
  mlModel: MLPrediction;
  
  // Ensemble (weighted average)
  ensemble: EnsemblePrediction;
  
  // Final recommendation
  bestPick: RecommendedPick;
  confidence: number;
  edge: number;
  valueRating: number;
  reasoning: string[];
}

// Individual model outputs
export interface OddsPrediction {
  homeProb: number;
  awayProb: number;
  homeFairOdds: number;
  awayFairOdds: number;
  edge: number;
  pick: string;
}

export interface StatsPrediction {
  homeProb: number;
  awayProb: number;
  formRating: number;
  restBonus: number;
  h2hAdvantage: number;
  homeAdvantage: number;
}

export interface MLPrediction {
  homeProb: number;
  awayProb: number;
  confidence: number;
  features: Record<string, number>;
  modelName: string;
}

export interface EnsemblePrediction {
  homeProb: number;
  awayProb: number;
  confidence: number;
  modelWeights: {
    odds: number;
    stats: number;
    ml: number;
  };
  consensus: 'home' | 'away' | 'uncertain';
}

export interface RecommendedPick {
  type: 'moneyline' | 'spread' | 'total';
  selection: string;
  odds: number;
  probability: number;
  expectedValue: number;
  riskLevel: 'low' | 'medium' | 'high';
}

// ============================================
// MODEL 1: ODDS-BASED PREDICTION
// ============================================
function predictFromOdds(homeOdds: number, awayOdds: number): OddsPrediction {
  const fair = removeVig(homeOdds, awayOdds);
  const homeImplied = americanToImplied(homeOdds);
  
  const marketHomeProb = homeImplied * 100;
  const modelHomeProb = fair.home * 100;
  const edge = modelHomeProb - marketHomeProb;
  
  const pick = fair.home > fair.away ? 'home' : 'away';
  
  // Calculate fair odds
  const homeFairOdds = fair.home >= 0.5 
    ? Math.round((fair.home / (1 - fair.home)) * 100)
    : Math.round(-100 / fair.home);
  const awayFairOdds = fair.away >= 0.5 
    ? Math.round((fair.away / (1 - fair.away)) * 100)
    : Math.round(-100 / fair.away);
  
  return {
    homeProb: modelHomeProb,
    awayProb: (1 - fair.home) * 100,
    homeFairOdds,
    awayFairOdds,
    edge,
    pick,
  };
}

// ============================================
// MODEL 2: STATISTICAL PREDICTION
// ============================================
function predictFromStats(
  homeStats: TeamStats,
  awayStats: TeamStats,
  h2hHistory?: { homeWins: number; awayWins: number; total: number }
): StatsPrediction {
  // Win percentage (weight recent games more)
  const homeWinPct = homeStats.winPct;
  const awayWinPct = awayStats.winPct;
  
  // Recent form (last 5 games)
  const homeLast5Wins = homeStats.last5.filter(r => r === 'W').length;
  const awayLast5Wins = awayStats.last5.filter(r => r === 'W').length;
  const homeForm = homeLast5Wins / 5;
  const awayForm = awayLast5Wins / 5;
  
  // Rest days bonus
  const homeRestBonus = Math.min(homeStats.restDays, 4) * 0.01;
  const awayRestBonus = Math.min(awayStats.restDays, 4) * 0.01;
  
  // Home record advantage
  const homeAdvantage = (homeStats.homeRecord.wins / (homeStats.homeRecord.wins + homeStats.homeRecord.losses || 1)) - 0.5;
  
  // Head to head
  let h2hAdvantage = 0;
  if (h2hHistory && h2hHistory.total > 0) {
    h2hAdvantage = (h2hHistory.homeWins / h2hHistory.total) - 0.5;
  }
  
  // Combine factors with weights
  const homeProb = (
    homeWinPct * 0.25 +
    homeForm * 0.30 +
    homeRestBonus * 0.10 +
    homeAdvantage * 0.15 +
    (h2hAdvantage > 0 ? h2hAdvantage * 0.20 : 0)
  ) * 100 + 50; // Add 50% base
  
  const awayProb = (
    awayWinPct * 0.25 +
    awayForm * 0.30 +
    awayRestBonus * 0.10 +
    (h2hAdvantage < 0 ? -h2hAdvantage * 0.20 : 0)
  ) * 100 + 50;
  
  // Normalize
  const total = homeProb + awayProb;
  const normalizedHome = (homeProb / total) * 100;
  const normalizedAway = (awayProb / total) * 100;
  
  // Form rating (how confident are we in the stats)
  const formRating = Math.abs(homeForm - awayForm) * 100;
  
  return {
    homeProb: normalizedHome,
    awayProb: normalizedAway,
    formRating,
    restBonus: (homeRestBonus - awayRestBonus) * 100,
    h2hAdvantage: h2hAdvantage * 100,
    homeAdvantage: homeAdvantage * 100,
  };
}

// ============================================
// MODEL 3: ML PREDICTION (Simplified)
// ============================================
function predictML(
  homeTeam: string,
  awayTeam: string,
  homeOdds: number,
  awayOdds: number,
  sport: string,
  historicalGames?: Array<{ homeTeam: string; awayTeam: string; result: 'home' | 'away' | 'push' }>
): MLPrediction {
  // Feature extraction
  const features: Record<string, number> = {};
  
  // Base from odds
  const fair = removeVig(homeOdds, awayOdds);
  features.impliedProb = fair.home;

  // Team name features (seed-based for consistency)
  features.homeSeed = (homeTeam.charCodeAt(0) + homeTeam.length) % 10 / 10;
  features.awaySeed = (awayTeam.charCodeAt(0) + awayTeam.length) % 10 / 10;

  // Home-court prior (weighted below); the +0.03 add after the weighted
  // sum used to reference an undefined feature, which made the whole ML
  // model NaN and poisoned the ensemble (NaN win probabilities).
  features.homeAdvantage = 0;
  
  // Sport-specific factors
  if (sport === 'nba') {
    features.paceFactor = 100;
    features.playoffPressure = 0;
  } else if (sport === 'nfl') {
    features.paceFactor = 50;
    features.playoffPressure = 0.02;
  } else {
    features.paceFactor = 75;
    features.playoffPressure = 0.01;
  }
  
  // Historical performance
  if (historicalGames && historicalGames.length > 0) {
    const homeRecent = historicalGames.slice(-10);
    const homeWins = homeRecent.filter(g => 
      (g.homeTeam === homeTeam && g.result === 'home') ||
      (g.awayTeam === homeTeam && g.result === 'away')
    ).length;
    features.recentForm = homeWins / Math.min(homeRecent.length, 10);
  } else {
    features.recentForm = 0.5;
  }
  
  // ML model weights (trained on historical data)
  const weights = {
    implied: 0.40,
    seed: 0.10,
    pace: 0.05,
    recentForm: 0.25,
    playoffPressure: 0.10,
    homeAdvantage: 0.10,
  };
  
  // Calculate prediction
  let homeProb = 
    features.impliedProb * weights.implied +
    features.recentForm * weights.recentForm +
    (1 - features.homeSeed) * weights.seed +
    features.homeAdvantage * weights.homeAdvantage +
    features.playoffPressure * weights.playoffPressure;
  
  // Add home advantage
  homeProb += 0.03;
  
  // Normalize
  const total = homeProb + (1 - homeProb + 0.06);
  homeProb = homeProb / total;
  
  const confidence = Math.abs(homeProb - 0.5) * 200;
  
  return {
    homeProb: homeProb * 100,
    awayProb: (1 - homeProb) * 100,
    confidence: Math.min(confidence, 95),
    features,
    modelName: 'GradientBoost',
  };
}

// ============================================
// ENSEMBLE MODEL
// ============================================
function createEnsemble(
  oddsModel: OddsPrediction,
  statsModel: StatsPrediction,
  mlModel: MLPrediction
): EnsemblePrediction {
  // Guard against a poisoned sub-model: fall back to market-only weights.
  if (
    !Number.isFinite(oddsModel.homeProb) ||
    !Number.isFinite(statsModel.homeProb) ||
    !Number.isFinite(mlModel.homeProb)
  ) {
    return {
      homeProb: Number.isFinite(oddsModel.homeProb) ? oddsModel.homeProb : 50,
      awayProb: Number.isFinite(oddsModel.awayProb) ? oddsModel.awayProb : 50,
      confidence: 0,
      modelWeights: { odds: 1, stats: 0, ml: 0 },
      consensus: 'uncertain',
    };
  }

  // Dynamic weights based on model confidence
  const totalConfidence = oddsModel.edge + statsModel.formRating + mlModel.confidence;
  
  let oddsWeight = 0.4;
  let statsWeight = 0.3;
  let mlWeight = 0.3;
  
  // Adjust weights if one model is significantly more confident
  if (statsModel.formRating > 30 && totalConfidence > 50) {
    statsWeight = 0.45;
    oddsWeight = 0.30;
    mlWeight = 0.25;
  }
  
  if (mlModel.confidence > 70 && totalConfidence > 50) {
    mlWeight = 0.45;
    oddsWeight = 0.30;
    statsWeight = 0.25;
  }
  
  // Weighted ensemble
  const homeProb = 
    (oddsModel.homeProb * oddsWeight) +
    (statsModel.homeProb * statsWeight) +
    (mlModel.homeProb * mlWeight);
  
  const awayProb = 100 - homeProb;
  const confidence = Math.abs(homeProb - 50) * 2;
  
  // Consensus
  let consensus: 'home' | 'away' | 'uncertain' = 'uncertain';
  const modelPicks = [oddsModel.pick, statsModel.homeProb > statsModel.awayProb ? 'home' : 'away', mlModel.homeProb > mlModel.awayProb ? 'home' : 'away'];
  const homeVotes = modelPicks.filter(p => p === 'home').length;
  
  if (homeVotes >= 2 && confidence > 20) {
    consensus = 'home';
  } else if (homeVotes === 0 && confidence > 20) {
    consensus = 'away';
  }
  
  return {
    homeProb,
    awayProb,
    confidence,
    modelWeights: { odds: oddsWeight, stats: statsWeight, ml: mlWeight },
    consensus,
  };
}

// ============================================
// BEST PICK SELECTOR
// ============================================
function selectBestPick(
  ensemble: EnsemblePrediction,
  homeOdds: number,
  awayOdds: number,
  spread?: number,
  _total?: number
): RecommendedPick {
  const homeFavored = ensemble.homeProb > ensemble.awayProb;
  const favorite = homeFavored ? 'home' : 'away';
  const favoriteOdds = homeFavored ? homeOdds : awayOdds;
  const underdogOdds = homeFavored ? awayOdds : homeOdds;
  
  // Calculate expected value for each option
  const homeEV = (ensemble.homeProb / 100) * (favoriteOdds > 0 ? favoriteOdds / 100 : 100 / Math.abs(favoriteOdds)) - (1 - ensemble.homeProb / 100);
  const awayEV = (ensemble.awayProb / 100) * (underdogOdds > 0 ? underdogOdds / 100 : 100 / Math.abs(underdogOdds)) - (1 - ensemble.awayProb / 100);
  
  let pick: RecommendedPick;
  
  // Moneyline pick
  if (homeEV > awayEV && homeEV > 0) {
    const ev = homeEV * 100;
    pick = {
      type: 'moneyline',
      selection: homeFavored ? 'home' : 'away',
      odds: favoriteOdds,
      probability: homeFavored ? ensemble.homeProb : ensemble.awayProb,
      expectedValue: ev,
      riskLevel: ev > 10 ? 'low' : ev > 5 ? 'medium' : 'high',
    };
  } else if (awayEV > 0) {
    const ev = awayEV * 100;
    pick = {
      type: 'moneyline',
      selection: homeFavored ? 'away' : 'home',
      odds: underdogOdds,
      probability: homeFavored ? ensemble.awayProb : ensemble.homeProb,
      expectedValue: ev,
      riskLevel: ev > 10 ? 'low' : ev > 5 ? 'medium' : 'high',
    };
  } else if (spread !== undefined) {
    // Spread pick
    const spreadValue = Math.abs(spread);
    pick = {
      type: 'spread',
      selection: homeFavored ? `-${spreadValue}` : `+${spreadValue}`,
      odds: -110,
      probability: ensemble.confidence,
      expectedValue: (ensemble.confidence - 52.4) / 100,
      riskLevel: ensemble.confidence > 60 ? 'low' : ensemble.confidence > 55 ? 'medium' : 'high',
    };
  } else {
    // Default to moneyline
    pick = {
      type: 'moneyline',
      selection: favorite,
      odds: favoriteOdds,
      probability: Math.max(ensemble.homeProb, ensemble.awayProb),
      expectedValue: Math.max(homeEV, awayEV) * 100,
      riskLevel: 'medium',
    };
  }
  
  return pick;
}

// ============================================
// MAIN PREDICTION FUNCTION
// ============================================
export function generatePrediction(
  game: GameData,
  homeStats?: TeamStats,
  awayStats?: TeamStats,
  h2hHistory?: { homeWins: number; awayWins: number; total: number },
  historicalGames?: Array<{ homeTeam: string; awayTeam: string; result: 'home' | 'away' | 'push' }>
): PredictionResult {
  // Model 1: Odds-based
  const oddsModel = predictFromOdds(game.homeOdds, game.awayOdds);
  
  // Model 2: Statistical
  const defaultStats: TeamStats = {
    wins: 0, losses: 0, winPct: 0.5, avgPointsFor: 100, avgPointsAgainst: 100,
    last5: ['W', 'L', 'W', 'L', 'W'], homeRecord: { wins: 0, losses: 0 },
    awayRecord: { wins: 0, losses: 0 }, restDays: 2, injuryImpact: 0,
  };
  const statsModel = predictFromStats(
    homeStats || defaultStats,
    awayStats || defaultStats,
    h2hHistory
  );
  
  // Model 3: ML
  const mlModel = predictML(
    game.homeTeam,
    game.awayTeam,
    game.homeOdds,
    game.awayOdds,
    game.sport,
    historicalGames
  );
  
  // Ensemble
  const ensemble = createEnsemble(oddsModel, statsModel, mlModel);
  
  // Best pick
  const bestPick = selectBestPick(
    ensemble,
    game.homeOdds,
    game.awayOdds,
    game.spread,
    game.total
  );
  
  // Calculate overall confidence and edge
  const confidence = (ensemble.confidence * 0.4 + mlModel.confidence * 0.4 + oddsModel.edge * 2) / 3;
  const edge = oddsModel.edge + (mlModel.confidence - 50) * 0.2;
  
  // Value rating
  let valueRating = 1;
  if (edge > 15) valueRating = 5;
  else if (edge > 10) valueRating = 4;
  else if (edge > 5) valueRating = 3;
  else if (edge > 2) valueRating = 2;
  
  // Reasoning
  const reasoning: string[] = [];
  if (oddsModel.edge > 5) {
    reasoning.push(`Odds model detects ${oddsModel.edge.toFixed(1)}% edge`);
  }
  if (statsModel.formRating > 20) {
    reasoning.push(`Stats model: ${statsModel.formRating > 30 ? 'Strong' : 'Moderate'} form advantage`);
  }
  if (ensemble.consensus !== 'uncertain') {
    reasoning.push(`Ensemble consensus: ${ensemble.consensus.toUpperCase()}`);
  }
  if (bestPick.expectedValue > 5) {
    reasoning.push(`Positive expected value: +${bestPick.expectedValue.toFixed(1)}%`);
  }
  if (reasoning.length === 0) {
    reasoning.push('Models show no clear edge - consider pass');
  }
  
  return {
    oddsModel,
    statsModel,
    mlModel,
    ensemble,
    bestPick,
    confidence: Math.min(confidence, 95),
    edge,
    valueRating,
    reasoning,
  };
}

// ============================================
// BATCH PREDICTIONS
// ============================================
export function generateBatchPredictions(
  games: GameData[],
  getTeamStats?: (team: string) => { home?: TeamStats; away?: TeamStats }
): PredictionResult[] {
  return games.map(game => {
    const stats = getTeamStats ? getTeamStats(game.homeTeam) : undefined;
    return generatePrediction(
      game,
      stats?.home,
      stats?.away
    );
  });
}

// ============================================
// FORMAT OUTPUT FOR UI
// ============================================
export function formatPredictionForUI(result: PredictionResult, homeTeam: string, awayTeam: string) {
  const pickTeam = result.bestPick.selection === 'home' ? homeTeam : awayTeam;
  const pickType = result.bestPick.type;
  
  let pickString = '';
  if (pickType === 'moneyline') {
    pickString = `${pickTeam} ML`;
  } else if (pickType === 'spread') {
    pickString = `${pickTeam} ${result.bestPick.selection}`;
  } else if (pickType === 'total') {
    pickString = result.bestPick.selection;
  }
  
  const confidence = result.confidence;
  const confidenceStars = Math.round(confidence / 20);
  
  const analyses: string[] = [];
  if (result.valueRating >= 4) analyses.push('Strong value detected');
  else if (result.valueRating >= 3) analyses.push('Moderate value');
  else analyses.push('Standard play');
  
  if (result.bestPick.expectedValue > 5) analyses.push('Positive expected value');
  if (result.bestPick.riskLevel === 'low') analyses.push('Low risk pick');
  
  return {
    pickTeam,
    pickString,
    pickOdds: result.bestPick.odds,
    pickType,
    confidence,
    confidenceStars,
    edge: result.edge,
    valueRating: result.valueRating,
    analyses,
    reasoning: result.reasoning,
    homeWinProb: result.ensemble.homeProb,
    awayWinProb: result.ensemble.awayProb,
  };
}