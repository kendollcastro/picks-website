// ============================================
// KCMPICKS - API Services Index
// ============================================

export { API_CONFIG, SPORTS_CONFIG, PREDICTION_WEIGHTS, CACHE_DURATION } from './config';

export {
  PredictionEngine,
  fetchPredictions,
  type PredictionInput,
  type PredictionResult,
} from './predictions';

export {
  ESPNScoresService,
  TheSportsDBService,
  BallDontLieService,
  type LiveGame,
} from './scores';

export {
  TheOddsAPIService,
  OddsUtils,
  type GameOdds,
  type BookmakerOdds,
} from './odds';

export {
  ESPNTeamAssets,
  TheSportsDBAssets,
  SPORT_ICONS,
  getSportIcon,
  getTeamLogoWithFallback,
  type TeamAsset,
} from './assets';
