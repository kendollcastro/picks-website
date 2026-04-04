import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
    timeZone: 'America/New_York',
  }).format(new Date(date));
}

export function formatTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  }).format(new Date(date));
}

export function formatDateTime(date: string | Date): string {
  return `${formatDate(date)} ${formatTime(date)}`;
}

export function formatGameDate(date: string | Date): string {
  let d: Date;
  
  if (typeof date === 'string') {
    d = new Date(date + (date.includes('Z') ? '' : 'Z'));
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return 'TBD';
  
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    timeZone: 'America/New_York',
  }).format(d);
}

export function formatGameTime(date: string | Date): string {
  let d: Date;
  
  if (typeof date === 'string') {
    d = new Date(date + (date.includes('Z') ? '' : 'Z'));
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return 'TBD';
  
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
    timeZone: 'America/New_York',
  }).format(d);
}

export function isGameToday(date: string | Date): boolean {
  let d: Date;
  
  if (typeof date === 'string') {
    d = new Date(date + (date.includes('Z') ? '' : 'Z'));
  } else {
    d = date;
  }
  
  if (isNaN(d.getTime())) return false;
  
  const now = new Date();
  
  const gameDateStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
  }).format(d);
  
  const nowStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
  }).format(now);
  
  return gameDateStr === nowStr;
}

export function isGameInFuture(date: string | Date): boolean {
  let d: Date;
  
  if (typeof date === 'string') {
    d = new Date(date + (date.includes('Z') ? '' : 'Z'));
  } else {
    d = date;
  }
  
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
