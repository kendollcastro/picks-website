import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function getUserTimeZone(): string {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone || 'America/Costa_Rica';
  } catch {
    return 'America/Costa_Rica';
  }
}

export function formatOdds(odds: number): string {
  if (odds > 0) return `+${odds}`;
  return `${odds}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

export function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    return stake + stake * (odds / 100);
  }
  return stake + stake * (100 / Math.abs(odds));
}

export function calculateProfit(stake: number, odds: number): number {
  if (odds > 0) {
    return stake * (odds / 100);
  }
  return stake * (100 / Math.abs(odds));
}

export function calculateWinRate(wins: number, total: number): number {
  if (total === 0) return 0;
  return wins / total;
}

export function calculateROI(profit: number, totalStaked: number): number {
  if (totalStaked === 0) return 0;
  return profit / totalStaked;
}

export function getStreakEmoji(streak: number, type: 'win' | 'loss'): string {
  if (type === 'loss') return '❄️';
  if (streak >= 10) return '🔥🔥🔥';
  if (streak >= 5) return '🔥🔥';
  if (streak >= 3) return '🔥';
  return '✨';
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    timeZone: getUserTimeZone(),
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: getUserTimeZone(),
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function parseGameDate(dateStr: string): Date {
  if (!dateStr) return new Date(NaN);
  
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  if (dateStr.includes('Z') || dateStr.includes('+')) {
    d = new Date(dateStr);
  } else {
    d = new Date(dateStr + 'Z');
  }
  
  return d;
}

export function formatGameDate(date: string | Date): string {
  const d = typeof date === 'string' ? parseGameDate(date) : date;
  
  if (isNaN(d.getTime())) return 'TBD';
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: getUserTimeZone(),
  }).format(d);
}

export function formatGameTime(date: string | Date): string {
  const d = typeof date === 'string' ? parseGameDate(date) : date;
  
  if (isNaN(d.getTime())) return 'TBD';
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: getUserTimeZone(),
  }).format(d);
}

export function isGameToday(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseGameDate(date) : date;
  
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  const userTz = getUserTimeZone();
  
  const gameDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: userTz,
  }).format(d);
  
  const nowStr = new Intl.DateTimeFormat('en-US', {
    timeZone: userTz,
  }).format(now);
  
  return gameDateStr === nowStr;
}

export function isGameInFuture(date: string | Date): boolean {
  const d = typeof date === 'string' ? parseGameDate(date) : date;
  
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  return d > now;
}

export function getTimeUntil(date: string | Date): string {
  const now = new Date();
  const target = new Date(date);
  const diff = target.getTime() - now.getTime();

  if (diff < 0) return 'Started';

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  }

  return `${hours}h ${minutes}m`;
}

export function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

// ============================================
// PICK GRADING
// ============================================
export type PickGrade = 'A' | 'B' | 'C' | 'D' | 'F';

export interface PickGradeResult {
  grade: PickGrade;
  label: string;
  color: string;
  bg: string;
}

/**
 * Map model edge / expected value / confidence into a letter grade.
 * A: elite edge (>=10 pts or EV >= 8%)
 * B: strong edge (>=7 pts or EV >= 5%)
 * C: playable edge (>=4 pts or EV >= 2%)
 * D: thin edge (>=2 pts or EV >= 0%)
 * F: pass / no edge
 */
export function getPickGrade(
  edge: number,
  expectedValue = 0,
  _confidence = 50
): PickGradeResult {
  if (edge >= 10 || expectedValue >= 0.08) {
    return { grade: 'A', label: 'Strong Play', color: 'text-tertiary', bg: 'bg-tertiary/15 border-tertiary/30' };
  }
  if (edge >= 7 || expectedValue >= 0.05) {
    return { grade: 'B', label: 'Good Value', color: 'text-primary', bg: 'bg-primary/15 border-primary/30' };
  }
  if (edge >= 4 || expectedValue >= 0.02) {
    return { grade: 'C', label: 'Lean', color: 'text-kcm-yellow', bg: 'bg-kcm-yellow/15 border-kcm-yellow/30' };
  }
  if (edge >= 2 || expectedValue >= 0) {
    return { grade: 'D', label: 'Thin Edge', color: 'text-on-surface-variant', bg: 'bg-surface-container-high border-white/10' };
  }
  return { grade: 'F', label: 'Pass', color: 'text-error', bg: 'bg-error/10 border-error/20' };
}

/**
 * Convert a 1-5 star valueRating into a letter grade.
 */
export function getValueRatingGrade(valueRating: number): PickGradeResult {
  if (valueRating >= 5) return { grade: 'A', label: 'Strong Play', color: 'text-tertiary', bg: 'bg-tertiary/15 border-tertiary/30' };
  if (valueRating >= 4) return { grade: 'B', label: 'Good Value', color: 'text-primary', bg: 'bg-primary/15 border-primary/30' };
  if (valueRating >= 3) return { grade: 'C', label: 'Lean', color: 'text-kcm-yellow', bg: 'bg-kcm-yellow/15 border-kcm-yellow/30' };
  if (valueRating >= 2) return { grade: 'D', label: 'Thin Edge', color: 'text-on-surface-variant', bg: 'bg-surface-container-high border-white/10' };
  return { grade: 'F', label: 'Pass', color: 'text-error', bg: 'bg-error/10 border-error/20' };
}

/**
 * Format American odds from a probability (0..1).
 */
export function probabilityToAmericanOdds(probability: number): number {
  if (probability <= 0 || probability >= 1) return -100000;
  const p = probability;
  if (p >= 0.5) {
    return Math.round(-100 * (p / (1 - p)));
  }
  return Math.round(100 * ((1 - p) / p));
}

// ============================================
// LINE MOVEMENT
// ============================================
export interface LineMovement {
  hasOpening: boolean;
  /** Probability points moved from opening to current (positive = market favors the pick more). */
  deltaProb: number;
  /** Human-readable sentence for UI. */
  text: string;
  /** Direction class suffix. */
  direction: 'favor' | 'against' | 'none';
}

/**
 * Compare current American odds to opening odds for a selected side.
 * Returns how the line has moved in terms of implied probability.
 */
export function calculateLineMovement(
  currentOdds: number,
  openingOdds: number | undefined | null,
  selectionName?: string
): LineMovement {
  if (openingOdds == null || currentOdds === 0) {
    return { hasOpening: false, deltaProb: 0, text: '', direction: 'none' };
  }

  const currentProb = americanToImpliedProbability(currentOdds);
  const openingProb = americanToImpliedProbability(openingOdds);
  const deltaProb = currentProb - openingProb;

  const absPct = Math.abs(deltaProb * 100);
  const prefix = selectionName ? `${selectionName}: ` : '';

  if (absPct < 0.5) {
    return { hasOpening: true, deltaProb, text: `${prefix}Line stable since open`, direction: 'none' };
  }

  const direction = deltaProb > 0 ? 'favor' : 'against';
  const sign = deltaProb > 0 ? '+' : '-';
  const arrow = deltaProb > 0 ? '▲' : '▼';
  const text = `${prefix}${arrow} Line moved ${sign}${absPct.toFixed(1)}% (${formatOdds(openingOdds)} → ${formatOdds(currentOdds)})`;

  return { hasOpening: true, deltaProb, text, direction };
}

function americanToImpliedProbability(odds: number): number {
  if (odds > 0) {
    return 100 / (odds + 100);
  }
  return Math.abs(odds) / (Math.abs(odds) + 100);
}

/**
 * Sanitize free-text input before sending to LLMs or rendering.
 * - Trims whitespace
 * - Strips control characters (except normal whitespace)
 * - Collapses internal whitespace
 * - Caps length to avoid prompt bloat/injection
 */
export function sanitizeInput(value: string | null | undefined, maxLength = 100): string {
  if (value == null) return '';
  return value
    .replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, '')
    .replace(/[\t\n\r]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
