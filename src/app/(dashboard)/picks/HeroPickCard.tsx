'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn, formatOdds, formatGameTime, formatGameDate, probabilityToAmericanOdds, type PickGrade } from '@/lib/utils';
import { GradeBadge } from '@/components/ui/GradeBadge';
import { GameConditionsAlert } from '@/components/ui/GameConditionsAlert';
import { BettingSplitsBadge } from '@/components/ui/BettingSplitsBadge';
import { LineMovementAlert } from '@/components/ui/LineMovementAlert';
import { Zap, Clock, Target, TrendingUp, ShieldCheck, ChevronDown } from 'lucide-react';
import type { TopPick } from '@/lib/api/jev-top-picks';

interface HeroPickCardProps {
  item: TopPick;
  rank?: number;
  onTakePick: () => void;
}

export function HeroPickCard({ item, rank = 1, onTakePick }: HeroPickCardProps) {
  const [showRationale, setShowRationale] = useState(false);
  const { game, candidate, confidence, rationale, research } = item;
  const trueOdds = probabilityToAmericanOdds(candidate.jevProbability);
  const grade: PickGrade = candidate.edge >= 7 ? 'A' : candidate.edge >= 4 ? 'B' : candidate.edge >= 2 ? 'C' : 'D';
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

  const gradeObj = {
    grade,
    label: grade === 'A' ? 'Strong Play' : grade === 'B' ? 'Good Value' : grade === 'C' ? 'Lean' : 'Thin Edge',
    color: grade === 'A' ? 'text-tertiary' : grade === 'B' ? 'text-primary' : grade === 'C' ? 'text-kcm-yellow' : 'text-on-surface-variant',
    bg: grade === 'A' ? 'bg-tertiary/15 border-tertiary/30' : grade === 'B' ? 'bg-primary/15 border-primary/30' : grade === 'C' ? 'bg-kcm-yellow/15 border-kcm-yellow/30' : 'bg-surface-container-high border-white/10',
  };

  return (
    <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#180e14] via-[#100d16] to-[#0d0f17] border border-tertiary/30 shadow-2xl shadow-black/40">
      {/* Soft ambient glow */}
      <div className="absolute -top-24 -left-24 w-72 h-72 bg-tertiary/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute top-1/2 -right-16 w-56 h-56 bg-primary/10 rounded-full blur-[70px] pointer-events-none" />

      {/* Top ribbon */}
      <div className="px-4 py-3 md:px-6 md:py-3.5 bg-gradient-to-r from-tertiary/20 via-surface-container-lowest/90 to-surface-container-lowest/60 border-b border-tertiary/20 flex flex-wrap items-center justify-between gap-3 relative z-10 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] md:text-xs font-mono font-black uppercase tracking-widest bg-gradient-to-r from-tertiary to-amber-500 text-white shadow-sm shadow-tertiary/30">
            <ShieldCheck size={12} />
            #{rank} TOP PICK
          </span>
          <span className="text-[10px] md:text-xs font-mono font-semibold text-tertiary/90 tracking-wide flex items-center gap-1">
            <StarIcon />
            {confidence}/100
          </span>
        </div>
        <div className="flex items-center gap-3 text-[10px] md:text-xs font-mono">
          <span className="text-on-surface-variant uppercase">{game.sport}</span>
          <span className="text-outline flex items-center gap-1">
            <Clock size={11} />
            {dateStr} • {timeStr}
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4 md:p-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8">
          {/* Left column */}
          <div className="lg:col-span-8 flex flex-col gap-4 md:gap-6">
            {/* Matchup card */}
            <div className="flex items-center justify-between gap-2 md:gap-3 p-3 md:p-5 rounded-xl bg-surface-container-lowest/80 border border-white/5 backdrop-blur-md">
              <TeamSide name={game.awayTeam} logo={game.awayLogo} sub="Away" />
              <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-widest text-outline px-1">VS</span>
              <TeamSide name={game.homeTeam} logo={game.homeLogo} sub="Home" align="right" />
            </div>

            {/* Pick trigger box */}
            <div className="p-4 md:p-6 rounded-xl bg-gradient-to-r from-tertiary/20 via-surface-container/60 to-surface-container-high/40 border border-tertiary/30 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              <div className="min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-tertiary font-bold flex items-center gap-1.5">
                  <Target size={12} />
                  RECOMMENDED SELECTION
                </span>
                <div className="flex flex-wrap items-baseline gap-2 md:gap-3 mt-1.5">
                  <span className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight break-words">{candidate.selection}</span>
                  <span className="text-base md:text-2xl font-mono font-bold text-on-surface-variant">{formatOdds(candidate.odds)}</span>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] md:text-xs font-mono text-on-surface-variant mt-1.5">
                  <span className="px-2 py-0.5 rounded bg-tertiary/15 border border-tertiary/30 text-tertiary font-bold">
                    +{(candidate.expectedValue * 100).toFixed(1)}% EV
                  </span>
                  <span>True <strong className="text-on-surface">{trueOdds > 0 ? '+' : ''}{trueOdds}</strong></span>
                  <span>Prob <strong className="text-tertiary">{(candidate.jevProbability * 100).toFixed(1)}%</strong></span>
                  <span>Edge <strong className="text-tertiary">+{candidate.edge.toFixed(1)}pts</strong></span>
                </div>
              </div>
              <button
                onClick={onTakePick}
                disabled={gameStarted}
                className="px-4 py-2.5 md:px-6 md:py-3.5 rounded-xl bg-gradient-to-r from-tertiary to-tertiary/80 text-white font-bold text-xs md:text-sm uppercase tracking-wider shadow-md shadow-tertiary/30 hover:shadow-tertiary/50 transition-all flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Zap size={14} />
                TAKE PICK
              </button>
            </div>

            {/* Rationale - collapsible */}
            <div className="rounded-xl bg-surface-container-lowest/60 border border-white/5 overflow-hidden">
              <button
                onClick={() => setShowRationale((v) => !v)}
                className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-white/[0.02] transition-colors"
                aria-expanded={showRationale}
              >
                <span className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-2">
                  <TrendingUp size={14} className="text-primary" />
                  AI Rationale
                  <span className="text-[10px] normal-case text-outline font-medium">({rationale.length} factors)</span>
                </span>
                <span className="flex items-center gap-1 text-[10px] font-mono text-outline shrink-0">
                  {showRationale ? 'Hide' : 'Show'}
                  <ChevronDown size={14} className={cn('transition-transform', showRationale && 'rotate-180')} />
                </span>
              </button>

              <div
                className={cn(
                  'grid transition-all duration-300 ease-out',
                  showRationale ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                )}
              >
                <div className="overflow-hidden">
                  <div className="px-4 pb-4 pt-0 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] md:text-xs">
                      {rationale.slice(0, 4).map((line, idx) => (
                        <div key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-surface-container-low/60">
                          <span className="w-4 h-4 md:w-5 md:h-5 rounded bg-primary/10 text-primary font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                            {idx + 1}
                          </span>
                          <p className="text-on-surface-variant leading-relaxed">{line}</p>
                        </div>
                      ))}
                    </div>
                    {research?.summary && (
                      <p className="text-[11px] md:text-xs text-on-surface-variant leading-relaxed pt-2 border-t border-white/5">
                        {research.summary}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="lg:col-span-4 flex flex-col gap-3 md:gap-4">
            {/* Grade + conditions */}
            <div className="p-4 md:p-5 rounded-xl bg-surface-container-lowest/80 border border-white/5 backdrop-blur-md">
              <div className="flex items-center justify-between mb-2.5">
                <h4 className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-on-surface">Pick Grade</h4>
                <GradeBadge grade={gradeObj} showLabel size="sm" />
              </div>
              <GameConditionsAlert conditions={game.conditions} homeTeam={game.homeTeam} awayTeam={game.awayTeam} compact />
              <div className="mt-1.5">
                <BettingSplitsBadge split={game.bettingSplit} homeTeam={game.homeTeam} awayTeam={game.awayTeam} selectedSide={candidate.selection} compact />
              </div>
            </div>

            {/* Smart money */}
            {game.bettingSplit && (game.bettingSplit.homeMoneyPct != null || game.bettingSplit.awayBetPct != null) && (
              <SmartMoneyGauge split={game.bettingSplit} homeTeam={game.homeTeam} />
            )}

            {/* Line movement */}
            <LineMovementAlert movement={calculateLineMovement(candidate.odds, openingOdds, candidate.selection)} />
          </div>
        </div>
      </div>
    </div>
  );
}

function TeamSide({ name, logo, sub, align = 'left' }: { name: string; logo?: string | null; sub: string; align?: 'left' | 'right' }) {
  return (
    <div className={cn('flex items-center gap-2 md:gap-3 flex-1 min-w-0', align === 'right' && 'flex-row-reverse justify-end md:justify-start')}>
      <TeamLogo name={name} logo={logo} />
      <div className={cn('min-w-0', align === 'right' && 'text-right')}>
        <h3 className="text-xs md:text-lg font-bold text-on-surface leading-tight break-words">{name}</h3>
        <p className="text-[10px] md:text-xs font-mono text-on-surface-variant">{sub}</p>
      </div>
    </div>
  );
}

function StarIcon() {
  return (
    <svg className="w-3 h-3 md:w-3.5 md:h-3.5 text-tertiary fill-current" viewBox="0 0 20 20">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
}

function TeamLogo({ name, logo }: { name: string; logo?: string | null }) {
  return (
    <div className="w-9 h-9 md:w-14 md:h-14 rounded-lg md:rounded-xl bg-surface-container-high border border-white/5 flex items-center justify-center font-black text-white text-xs md:text-xl shadow-md relative overflow-hidden shrink-0">
      {logo ? (
        <Image unoptimized src={logo} alt={name} width={32} height={32} className="w-7 h-7 md:w-10 md:h-10 object-contain relative z-10" />
      ) : (
        <span className="relative z-10">{name.substring(0, 3).toUpperCase()}</span>
      )}
    </div>
  );
}

function SmartMoneyGauge({ split, homeTeam }: { split: NonNullable<TopPick['game']['bettingSplit']>; homeTeam: string }) {
  const homeMoney = split.homeMoneyPct ?? 0.5;
  const homeBets = split.homeBetPct ?? 0.5;
  const sharpDivergence = Math.abs(homeMoney - homeBets) > 0.15;

  return (
    <div className="p-3 md:p-4 rounded-xl bg-surface-container-lowest/80 border border-white/5 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[10px] md:text-xs font-mono font-bold uppercase tracking-wider text-on-surface">Public Money Flow</span>
          <span className="text-[9px] md:text-[10px] font-mono text-on-surface-variant/80 uppercase truncate">{split.source}</span>
        </div>
        {sharpDivergence && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-primary/20 text-primary border border-primary/30 shrink-0">
            SHARP
          </span>
        )}
      </div>
      <div className="space-y-2">
        <GaugeRow label={`Handle: ${homeTeam}`} value={homeMoney} />
        <GaugeRow label={`Tickets: ${homeTeam}`} value={homeBets} color="outline" />
      </div>
    </div>
  );
}

function GaugeRow({ label, value, color = 'tertiary' }: { label: string; value: number; color?: 'tertiary' | 'outline' }) {
  const width = Math.max(2, Math.min(100, value * 100));
  const barColor = color === 'tertiary' ? 'bg-gradient-to-r from-amber-500 to-tertiary' : 'bg-outline';
  return (
    <div>
      <div className="flex justify-between text-[10px] md:text-xs font-mono mb-1">
        <span className="text-on-surface-variant truncate">{label}</span>
        <span className={cn('font-bold', color === 'tertiary' ? 'text-tertiary' : 'text-outline')}>{(value * 100).toFixed(0)}%</span>
      </div>
      <div className="h-1.5 md:h-2 w-full bg-surface-container-highest rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all duration-1000', barColor)} style={{ width: `${width}%` }} />
      </div>
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
