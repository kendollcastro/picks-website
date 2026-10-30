'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn, formatOdds, formatGameTime, formatGameDate, probabilityToAmericanOdds } from '@/lib/utils';
import { GameConditionsAlert } from '@/components/ui/GameConditionsAlert';
import { BettingSplitsBadge } from '@/components/ui/BettingSplitsBadge';
import { LineMovementAlert } from '@/components/ui/LineMovementAlert';
import { Zap, Target, ChevronDown, Star } from 'lucide-react';
import type { TopPick } from '@/lib/api/jev-top-picks';

interface RunnerUpCardProps {
  item: TopPick;
  rank: number;
  accentColor?: 'amber' | 'primary' | 'tertiary';
  onTakePick: () => void;
}

const ACCENTS = {
  amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', badge: 'bg-amber-500/20 text-amber-400 border-amber-500/30', hover: 'hover:border-amber-500/40' },
  primary: { bg: 'bg-primary/10', border: 'border-primary/20', text: 'text-primary', badge: 'bg-primary/20 text-primary border-primary/30', hover: 'hover:border-primary/40' },
  tertiary: { bg: 'bg-tertiary/10', border: 'border-tertiary/20', text: 'text-tertiary', badge: 'bg-tertiary/20 text-tertiary border-tertiary/30', hover: 'hover:border-tertiary/40' },
};

export function RunnerUpCard({ item, rank, accentColor = 'primary', onTakePick }: RunnerUpCardProps) {
  const [showRationale, setShowRationale] = useState(false);
  const { game, candidate, rationale } = item;
  const accent = ACCENTS[accentColor];
  const trueOdds = probabilityToAmericanOdds(candidate.jevProbability);
  const gameStarted = new Date(game.gameTime) < new Date();
  const timeStr = formatGameTime(game.gameTime);
  const dateStr = formatGameDate(game.gameTime);

  const openingOdds =
    candidate.betType === 'moneyline'
      ? candidate.selection === game.homeTeam
        ? game.openingHomeMoneyline
        : game.openingAwayMoneyline
      : candidate.betType === 'spread'
        ? candidate.selection === game.homeTeam
          ? game.openingHomeSpreadOdds
          : game.openingAwaySpreadOdds
        : candidate.selection === 'Over'
          ? game.openingOverOdds
          : game.openingUnderOdds;

  const lineMovement = calculateLineMovement(candidate.odds, openingOdds, candidate.selection);

  return (
    <div className={cn('rounded-xl bg-surface-container-low border border-surface-container-high/80 p-4 flex flex-col justify-between transition-all duration-300 group', accent.hover)}>
      <div>
        {/* Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-surface-container-high/60">
          <div className="flex items-center gap-2">
            <span className={cn('w-5 h-5 md:w-6 md:h-6 rounded-md md:rounded-lg font-mono font-black text-[10px] md:text-xs flex items-center justify-center', accent.bg, accent.text)}>
              #{rank}
            </span>
            <span className={cn('px-1.5 md:px-2 py-0.5 rounded text-[9px] md:text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 border', accent.badge)}>
              <Target size={10} />
              {candidate.betType}
            </span>
            {/* Confidence display (0-100) - matches HeroPickCard style */}
            <span className="flex items-center gap-1 text-[10px] md:text-xs font-mono font-semibold text-tertiary/90 tracking-wide">
              <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-tertiary fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              {item.confidence}/100
            </span>
          </div>
          <span className="text-[10px] font-mono text-outline truncate max-w-[50%]">{game.sport} • {dateStr} {timeStr}</span>
        </div>

        {/* Teams + selection */}
        <div className="mt-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <TeamLogo name={candidate.selection} logo={candidate.selection === game.homeTeam ? game.homeLogo : game.awayLogo} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-on-surface truncate">{candidate.selection}</div>
              <div className="text-[10px] font-mono text-outline truncate">vs {candidate.selection === game.homeTeam ? game.awayTeam : game.homeTeam}</div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-sm md:text-base font-mono font-bold text-on-surface">{formatOdds(candidate.odds)}</div>
            <div className="text-[10px] font-bold text-tertiary">+{(candidate.expectedValue * 100).toFixed(1)}% EV</div>
          </div>
        </div>

        {/* Compact metrics */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] md:text-xs font-mono">
          <div className="p-2 rounded-lg bg-surface-container-high/50 border border-white/5">
            <span className="text-outline block">True odds</span>
            <span className="text-on-surface font-bold">{trueOdds > 0 ? '+' : ''}{trueOdds}</span>
          </div>
          <div className="p-2 rounded-lg bg-surface-container-high/50 border border-white/5">
            <span className="text-outline block">Model prob</span>
            <span className="text-tertiary font-bold">{(candidate.jevProbability * 100).toFixed(1)}%</span>
          </div>
        </div>

        {/* Collapsible rationale */}
        <div className="mt-3 rounded-lg bg-surface-container-high/40 border border-white/5 overflow-hidden">
          <button
            onClick={() => setShowRationale((v) => !v)}
            className="w-full px-3 py-2 flex items-center justify-between gap-2 text-left hover:bg-white/[0.02] transition-colors"
            aria-expanded={showRationale}
          >
            <span className="text-[10px] md:text-xs font-mono font-bold uppercase text-on-surface-variant">AI Rationale ({rationale.length})</span>
            <ChevronDown size={13} className={cn('text-outline transition-transform shrink-0', showRationale && 'rotate-180')} />
          </button>
          <div className={cn('grid transition-all duration-300 ease-out', showRationale ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0')}>
            <div className="overflow-hidden">
              <div className="px-3 pb-3 space-y-1.5">
                {rationale.slice(0, 3).map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[11px] md:text-xs">
                    <span className="text-tertiary/80 font-bold shrink-0">{idx + 1}.</span>
                    <p className="text-on-surface-variant leading-snug">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Conditions */}
        <div className="mt-3 space-y-1.5">
          <GameConditionsAlert conditions={game.conditions} homeTeam={game.homeTeam} awayTeam={game.awayTeam} compact />
          <BettingSplitsBadge split={game.bettingSplit} homeTeam={game.homeTeam} awayTeam={game.awayTeam} selectedSide={candidate.selection} compact />
          <LineMovementAlert movement={lineMovement} />
        </div>
      </div>

      {/* CTA */}
      <div className="mt-4 pt-3 border-t border-surface-container-high/60">
        <button
          onClick={onTakePick}
          disabled={gameStarted}
          className="w-full py-2.5 px-4 rounded-xl bg-surface-container-high hover:bg-primary-container text-on-surface hover:text-white font-bold text-[11px] md:text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 group-hover:bg-primary-container group-hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Zap size={13} />
          TAKE PICK
        </button>
      </div>
    </div>
  );
}

function TeamLogo({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-white/5 flex items-center justify-center font-bold text-[10px] text-on-surface-variant uppercase shrink-0 overflow-hidden">
      {logo ? (
        <Image unoptimized src={logo} alt={name} width={22} height={22} className="w-[22px] h-[22px] object-contain" />
      ) : (
        <span>{name.substring(0, 3).toUpperCase()}</span>
      )}
    </div>
  );
}

function calculateLineMovement(currentOdds: number, openingOdds: number | undefined | null, selectionName?: string) {
  if (openingOdds == null || currentOdds === 0) {
    return { hasOpening: false as const, deltaProb: 0, text: '', direction: 'none' as const };
  }

  const currentProb = currentOdds > 0 ? 100 / (currentOdds + 100) : Math.abs(currentOdds) / (Math.abs(currentOdds) + 100);
  const openingProb = openingOdds > 0 ? 100 / (openingOdds + 100) : Math.abs(openingOdds) / (Math.abs(openingOdds) + 100);
  const deltaProb = currentProb - openingProb;
  const absPct = Math.abs(deltaProb * 100);
  const prefix = selectionName ? `${selectionName}: ` : '';

  if (absPct < 0.5) {
    return { hasOpening: true as const, deltaProb, text: `${prefix}Line stable since open`, direction: 'none' as const };
  }

  const direction = deltaProb > 0 ? ('favor' as const) : ('against' as const);
  const sign = deltaProb > 0 ? '+' : '-';
  const arrow = deltaProb > 0 ? '▲' : '▼';
  const text = `${prefix}${arrow} Line moved ${sign}${absPct.toFixed(1)}% (${formatOdds(openingOdds)} → ${formatOdds(currentOdds)})`;

  return { hasOpening: true as const, deltaProb, text, direction };
}
