'use client';

import { cn } from '@/lib/utils';
import { Users, DollarSign, TrendingUp } from 'lucide-react';

interface SplitData {
  homeMoneyPct: number | null;
  awayMoneyPct: number | null;
  homeBetPct: number | null;
  awayBetPct: number | null;
  source: string;
}

interface BettingSplitsBadgeProps {
  split?: SplitData | null;
  homeTeam: string;
  awayTeam: string;
  selectedSide?: string;
  compact?: boolean;
}

export function BettingSplitsBadge({ split, homeTeam, awayTeam, selectedSide, compact = true }: BettingSplitsBadgeProps) {
  if (split == null) return null;

  const hasMoney = split.homeMoneyPct != null && split.awayMoneyPct != null;
  const hasBets = split.homeBetPct != null && split.awayBetPct != null;

  if (!hasMoney && !hasBets) return null;

  const isHomeSelected = selectedSide && (selectedSide.includes(homeTeam) || selectedSide === homeTeam);
  const isAwaySelected = selectedSide && (selectedSide.includes(awayTeam) || selectedSide === awayTeam);

  const formatPct = (v: number | null) => (v == null ? '--' : `${(v * 100).toFixed(0)}%`);

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {hasMoney && (
          <span
            className={cn(
              'flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold border',
              isHomeSelected && split.homeMoneyPct != null && split.homeMoneyPct > 0.5
                ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                : isAwaySelected && split.awayMoneyPct != null && split.awayMoneyPct > 0.5
                  ? 'bg-tertiary/10 text-tertiary border-tertiary/20'
                  : 'bg-surface-container-high text-on-surface-variant border-white/5'
            )}
            title="Public money / handle percentage"
          >
            <DollarSign size={10} />
            {homeTeam} {formatPct(split.homeMoneyPct)} · {awayTeam} {formatPct(split.awayMoneyPct)}
          </span>
        )}
        {hasBets && !hasMoney && (
          <span
            className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant border border-white/5 text-[9px] font-bold"
            title="Public bet tickets percentage"
          >
            <Users size={10} />
            {homeTeam} {formatPct(split.homeBetPct)} · {awayTeam} {formatPct(split.awayBetPct)}
          </span>
        )}
        {split.source && (
          <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-container-high text-on-surface-variant/70 border border-white/5 text-[8px] font-medium uppercase">
            <TrendingUp size={8} />
            {split.source}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-surface-container-low/50 p-3 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">Public Splits</span>
        <span className="text-[8px] text-on-surface-variant/70 uppercase">{split.source}</span>
      </div>
      {hasMoney && (
        <div className="space-y-1">
          <p className="text-[10px] text-on-surface-variant">Money / Handle</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary rounded-full"
                style={{ width: `${(split.homeMoneyPct ?? 0.5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold w-16 text-right">{formatPct(split.homeMoneyPct)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${(split.awayMoneyPct ?? 0.5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold w-16 text-right">{formatPct(split.awayMoneyPct)}</span>
          </div>
        </div>
      )}
      {hasBets && (
        <div className="space-y-1">
          <p className="text-[10px] text-on-surface-variant">Tickets / Bets</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-tertiary/70 rounded-full"
                style={{ width: `${(split.homeBetPct ?? 0.5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold w-16 text-right">{formatPct(split.homeBetPct)}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
              <div
                className="h-full bg-primary/70 rounded-full"
                style={{ width: `${(split.awayBetPct ?? 0.5) * 100}%` }}
              />
            </div>
            <span className="text-[10px] font-bold w-16 text-right">{formatPct(split.awayBetPct)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
