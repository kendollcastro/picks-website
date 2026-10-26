// ============================================
// KCMPICKS - Game Conditions Service
// Aggregates contextual factors that affect a game's outcome:
// injuries, rest days, travel/back-to-backs, weather (outdoor sports),
// and notable lineup statuses.
// ============================================

export interface GameConditions {
  homeInjuries: InjurySummary[];
  awayInjuries: InjurySummary[];
  restDays: { home: number; away: number };
  isBackToBack: { home: boolean; away: boolean };
  isOutdoor: boolean;
  weather: WeatherConditions | null;
  notes: string[];
}

export interface InjurySummary {
  id: string;
  name: string;
  position: string | null;
  status: string;
  impactScore: number; // 0-10
  comment: string | null;
}

export interface WeatherConditions {
  temperature: number; // Fahrenheit
  condition: string;
  windSpeed: number; // mph
  precipitationChance: number; // 0-100
}

export interface EspnInjuryEntry {
  id: string;
  name: string;
  position: string | null;
  team: string;
  teamAbbr: string | null;
  status: string;
  shortComment: string | null;
  longComment: string | null;
  returnDate: string | null;
  impactScore: number;
}

const OUTDOOR_SPORTS = new Set(['nfl', 'mlb', 'soccer', 'college-football']);

/**
 * Fetch injury report for a sport from our ESPN injuries proxy.
 */
export async function fetchInjuries(sport: string): Promise<EspnInjuryEntry[]> {
  try {
    const response = await fetch(`/api/espn/injuries?sport=${sport}`, { cache: 'no-store' });
    if (!response.ok) return [];
    const data = (await response.json()) as { injuries?: EspnInjuryEntry[] };
    return data.injuries ?? [];
  } catch (error) {
    console.warn('[game-conditions] failed to fetch injuries:', error);
    return [];
  }
}

/**
 * Compute rest days from the game's commence time and a reference "last game"
 * timestamp. When no prior game is known, we use a sport-specific default.
 */
export function computeRestDays(
  gameTime: string,
  homeLastGame?: string | null,
  awayLastGame?: string | null,
  sport?: string
): { home: number; away: number } {
  const defaults: Record<string, number> = {
    nba: 2,
    nfl: 7,
    mlb: 1,
    soccer: 5,
    ufc: 60,
    'college-football': 7,
    'college-basketball': 3,
    'womens-basketball': 3,
  };
  const fallback = defaults[sport ?? ''] ?? 2;

  const calc = (last?: string | null) => {
    if (!last) return fallback;
    const diffMs = new Date(gameTime).getTime() - new Date(last).getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return Math.max(0, Math.round(diffDays));
  };

  return { home: calc(homeLastGame), away: calc(awayLastGame) };
}

/**
 * Determine if a sport is typically played outdoors (weather-sensitive).
 */
export function isOutdoorSport(sport: string): boolean {
  return OUTDOOR_SPORTS.has(sport);
}

/**
 * Stub weather fetch. A real implementation would call Open-Meteo or a similar
 * free weather API using venue coordinates. For now we return null so the
 * pipeline doesn't block on a missing third-party key.
 */
export async function fetchWeather(_venue: string, _gameTime: string): Promise<WeatherConditions | null> {
  return null;
}

/**
 * Build a GameConditions object for a matchup by matching team names/abbrs
 * against the ESPN injury list.
 */
export async function buildGameConditions(
  sport: string,
  homeTeam: string,
  awayTeam: string,
  gameTime: string,
  opts?: {
    homeAbbr?: string | null;
    awayAbbr?: string | null;
    homeLastGame?: string | null;
    awayLastGame?: string | null;
    venue?: string | null;
    injuries?: EspnInjuryEntry[];
  }
): Promise<GameConditions> {
  const injuries = opts?.injuries ?? (await fetchInjuries(sport));
  const restDays = computeRestDays(gameTime, opts?.homeLastGame, opts?.awayLastGame, sport);

  const matchTeam = (teamName: string, abbr?: string | null) => (inj: EspnInjuryEntry) => {
    const normalizedTeam = teamName.toLowerCase();
    const normalizedInjTeam = inj.team.toLowerCase();
    const nameMatch =
      normalizedInjTeam.includes(normalizedTeam) ||
      normalizedTeam.includes(normalizedInjTeam) ||
      normalizedTeam.split(' ').some((word) => normalizedInjTeam.includes(word));
    const abbrMatch = abbr && inj.teamAbbr?.toLowerCase() === abbr.toLowerCase();
    return nameMatch || !!abbrMatch;
  };

  const homeInjuries = injuries
    .filter(matchTeam(homeTeam, opts?.homeAbbr))
    .sort((a, b) => b.impactScore - a.impactScore)
    .map((inj) => ({
      id: inj.id,
      name: inj.name,
      position: inj.position,
      status: inj.status,
      impactScore: inj.impactScore,
      comment: inj.shortComment ?? inj.longComment,
    }));

  const awayInjuries = injuries
    .filter(matchTeam(awayTeam, opts?.awayAbbr))
    .sort((a, b) => b.impactScore - a.impactScore)
    .map((inj) => ({
      id: inj.id,
      name: inj.name,
      position: inj.position,
      status: inj.status,
      impactScore: inj.impactScore,
      comment: inj.shortComment ?? inj.longComment,
    }));

  const notes: string[] = [];
  const highImpact = (arr: InjurySummary[]) => arr.filter((i) => i.impactScore >= 7);
  if (highImpact(homeInjuries).length > 0) {
    notes.push(`${homeTeam} missing ${highImpact(homeInjuries).length} key player(s)`);
  }
  if (highImpact(awayInjuries).length > 0) {
    notes.push(`${awayTeam} missing ${highImpact(awayInjuries).length} key player(s)`);
  }
  if (restDays.home <= 1) notes.push(`${homeTeam} on short rest (${restDays.home} day(s))`);
  if (restDays.away <= 1) notes.push(`${awayTeam} on short rest (${restDays.away} day(s))`);

  const weather = isOutdoorSport(sport) ? await fetchWeather(opts?.venue ?? '', gameTime) : null;

  return {
    homeInjuries,
    awayInjuries,
    restDays,
    isBackToBack: { home: restDays.home <= 1, away: restDays.away <= 1 },
    isOutdoor: isOutdoorSport(sport),
    weather,
    notes,
  };
}

/**
 * Apply injury/rest adjustments to a baseline win probability.
 * Returns adjusted home win probability (0..1). Injuries to higher-impact
 * players move the needle more; short rest penalizes the tired side.
 */
export function applyConditionsToProbability(
  homeWinProb: number,
  conditions: GameConditions
): number {
  let homeDelta = 0;
  let awayDelta = 0;

  for (const inj of conditions.homeInjuries) {
    homeDelta -= inj.impactScore * 0.005; // each impact point = 0.5%
  }
  for (const inj of conditions.awayInjuries) {
    awayDelta -= inj.impactScore * 0.005;
  }

  // Short rest / back-to-back penalty.
  if (conditions.restDays.home <= 1) homeDelta -= 0.02;
  if (conditions.restDays.away <= 1) awayDelta -= 0.02;

  // Convert deltas into probability space while keeping total ~1.
  const adjusted = homeWinProb + homeDelta - awayDelta;
  return Math.max(0.05, Math.min(0.95, adjusted));
}

/**
 * Convert a conditions object into a short human-readable summary for prompts.
 */
export function conditionsToSummary(conditions: GameConditions): string {
  const parts: string[] = [];
  if (conditions.homeInjuries.length > 0) {
    parts.push(`Home injuries: ${conditions.homeInjuries.map((i) => `${i.name} (${i.status})`).join(', ')}`);
  }
  if (conditions.awayInjuries.length > 0) {
    parts.push(`Away injuries: ${conditions.awayInjuries.map((i) => `${i.name} (${i.status})`).join(', ')}`);
  }
  parts.push(`Rest: home ${conditions.restDays.home}d, away ${conditions.restDays.away}d`);
  if (conditions.weather) {
    parts.push(`Weather: ${conditions.weather.temperature}°F, ${conditions.weather.condition}, wind ${conditions.weather.windSpeed}mph`);
  }
  if (conditions.notes.length > 0) {
    parts.push(`Notes: ${conditions.notes.join('; ')}`);
  }
  return parts.join('. ');
}
