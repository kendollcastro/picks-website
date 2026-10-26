'use client';

import { cn } from '@/lib/utils';
import { AlertTriangle, Activity, Wind } from 'lucide-react';

interface GameConditionsAlertProps {
  conditions?: {
    homeInjuries: Array<{ name: string; status: string; impactScore: number }>;
    awayInjuries: Array<{ name: string; status: string; impactScore: number }>;
    restDays: { home: number; away: number };
    notes: string[];
  } | null;
  homeTeam: string;
  awayTeam: string;
  compact?: boolean;
}

export function GameConditionsAlert({ conditions, homeTeam, awayTeam, compact = false }: GameConditionsAlertProps) {
  if (!conditions) return null;

  const homeTotal = conditions.homeInjuries.length;
  const awayTotal = conditions.awayInjuries.length;

  if (homeTotal === 0 && awayTotal === 0 && conditions.notes.length === 0) return null;

  if (compact) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {homeTotal > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-error/10 text-error border border-error/20 text-[9px] font-bold">
            <Activity size={10} />
            {homeTeam}: {homeTotal} inj
          </span>
        )}
        {awayTotal > 0 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-error/10 text-error border border-error/20 text-[9px] font-bold">
            <Activity size={10} />
            {awayTeam}: {awayTotal} inj
          </span>
        )}
        {conditions.restDays.home <= 1 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-kcm-yellow/10 text-kcm-yellow border border-kcm-yellow/20 text-[9px] font-bold">
            <Wind size={10} />
            {homeTeam} B2B
          </span>
        )}
        {conditions.restDays.away <= 1 && (
          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-kcm-yellow/10 text-kcm-yellow border border-kcm-yellow/20 text-[9px] font-bold">
            <Wind size={10} />
            {awayTeam} B2B
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/5 bg-surface-container-low/50 p-3 space-y-2">
      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-on-surface-variant">
        <AlertTriangle size={11} />
        Game Conditions
      </div>

      {homeTotal > 0 && (
        <div>
          <p className="text-[10px] font-bold text-on-surface mb-1">{homeTeam} injuries</p>
          <div className="flex flex-wrap gap-1">
            {conditions.homeInjuries.slice(0, 4).map((inj) => (
              <span
                key={inj.name}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-medium border',
                  inj.impactScore >= 7
                    ? 'bg-error/10 text-error border-error/20'
                    : 'bg-surface-container-high text-on-surface-variant border-white/5'
                )}
              >
                {inj.name} ({inj.status})
              </span>
            ))}
          </div>
        </div>
      )}

      {awayTotal > 0 && (
        <div>
          <p className="text-[10px] font-bold text-on-surface mb-1">{awayTeam} injuries</p>
          <div className="flex flex-wrap gap-1">
            {conditions.awayInjuries.slice(0, 4).map((inj) => (
              <span
                key={inj.name}
                className={cn(
                  'px-1.5 py-0.5 rounded text-[9px] font-medium border',
                  inj.impactScore >= 7
                    ? 'bg-error/10 text-error border-error/20'
                    : 'bg-surface-container-high text-on-surface-variant border-white/5'
                )}
              >
                {inj.name} ({inj.status})
              </span>
            ))}
          </div>
        </div>
      )}

      {conditions.notes.length > 0 && (
        <ul className="space-y-1 pt-1">
          {conditions.notes.map((note, idx) => (
            <li key={idx} className="text-[10px] text-on-surface-variant flex gap-2">
              <span className="text-kcm-yellow">›</span>
              <span>{note}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
