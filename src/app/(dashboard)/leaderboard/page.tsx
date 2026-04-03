'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Trophy,
  TrendingUp,
  Target,
  Flame,
} from 'lucide-react';

const leaderboardData = [
  { rank: 1, name: 'SharpKing', avatar: 'SK', winRate: 72, totalPicks: 312, profit: 8500, roi: 15, streak: 8, trend: 'up' as const },
  { rank: 2, name: 'BettingPro', avatar: 'BP', winRate: 68, totalPicks: 285, profit: 6200, roi: 12, streak: 5, trend: 'up' as const },
  { rank: 3, name: 'OddsMaster', avatar: 'OM', winRate: 65, totalPicks: 198, profit: 4800, roi: 11, streak: 3, trend: 'down' as const },
  { rank: 4, name: 'SharpBettor', avatar: 'SB', winRate: 64, totalPicks: 247, profit: 2450, roi: 8, streak: 5, trend: 'up' as const, isYou: true },
  { rank: 5, name: 'PicksWizard', avatar: 'PW', winRate: 62, totalPicks: 156, profit: 2100, roi: 9, streak: 2, trend: 'up' as const },
  { rank: 6, name: 'MoneyMaker', avatar: 'MM', winRate: 61, totalPicks: 320, profit: 1800, roi: 6, streak: 0, trend: 'down' as const },
  { rank: 7, name: 'BetChamp', avatar: 'BC', winRate: 60, totalPicks: 178, profit: 1500, roi: 7, streak: 4, trend: 'up' as const },
  { rank: 8, name: 'LuckyStreak', avatar: 'LS', winRate: 59, totalPicks: 210, profit: 1200, roi: 5, streak: 1, trend: 'up' as const },
  { rank: 9, name: 'ProPicker', avatar: 'PP', winRate: 58, totalPicks: 145, profit: 950, roi: 4, streak: 2, trend: 'up' as const },
  { rank: 10, name: 'SportsGuru', avatar: 'SG', winRate: 57, totalPicks: 189, profit: 800, roi: 3, streak: 0, trend: 'down' as const },
];

const timeFilters = ['This Week', 'This Month', 'All Time'] as const;

export default function LeaderboardPage() {
  const [selectedTime, setSelectedTime] = useState<typeof timeFilters[number]>('All Time');

  const top3 = [leaderboardData[1], leaderboardData[0], leaderboardData[2]]; // 2nd, 1st, 3rd for podium layout

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold">Leaderboard</h1>
          <p className="text-on-surface-variant text-sm mt-1">See how you rank against others</p>
        </div>
        <div className="flex gap-2">
          {timeFilters.map((f) => (
            <button
              key={f}
              onClick={() => setSelectedTime(f)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                selectedTime === f
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              )}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Top 3 Podium */}
      <div className="grid grid-cols-3 gap-3 items-end">
        {top3.map((user) => {
          const isFirst = user.rank === 1;
          const isSecond = user.rank === 2;
          const isThird = user.rank === 3;

          return (
            <div
              key={user.rank}
              className={cn(
                'bg-surface-container-high rounded-xl p-4 text-center border border-white/5 transition-all',
                isFirst && 'border-tertiary/30 bg-tertiary/5 pb-8',
                isSecond && 'border-primary/20 pb-4',
                isThird && 'border-kcm-orange/20 pb-2'
              )}
            >
              {/* Rank Badge */}
              <div className="flex justify-center mb-3">
                {isFirst && (
                  <div className="w-10 h-10 rounded-full bg-kcm-yellow/20 flex items-center justify-center">
                    <Trophy size={20} className="text-kcm-yellow" fill="currentColor" />
                  </div>
                )}
                {isSecond && (
                  <div className="w-10 h-10 rounded-full bg-gray-400/20 flex items-center justify-center">
                    <span className="text-gray-400 font-bold">2</span>
                  </div>
                )}
                {isThird && (
                  <div className="w-10 h-10 rounded-full bg-amber-600/20 flex items-center justify-center">
                    <span className="text-amber-600 font-bold">3</span>
                  </div>
                )}
              </div>

              {/* Avatar */}
              <div className={cn(
                'w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center font-bold text-lg',
                isFirst ? 'bg-tertiary/20 text-tertiary' : 'bg-surface-container-lowest text-on-surface-variant'
              )}>
                {user.avatar}
              </div>

              {/* Name */}
              <p className="font-['Space_Grotesk'] font-bold text-sm truncate">{user.name}</p>
              <p className="text-[10px] text-on-surface-variant">{user.totalPicks} picks</p>

              {/* Stats */}
              <div className="mt-3 space-y-1">
                <div className="flex items-center justify-center gap-1">
                  <Target size={10} className="text-primary" />
                  <span className="text-xs font-bold">{user.winRate}%</span>
                </div>
                <div className="flex items-center justify-center gap-1">
                  <TrendingUp size={10} className="text-tertiary" />
                  <span className="text-xs font-bold text-tertiary">+${user.profit.toLocaleString()}</span>
                </div>
                {user.streak > 0 && (
                  <div className="flex items-center justify-center gap-1">
                    <Flame size={10} className="text-kcm-orange" />
                    <span className="text-xs font-bold">{user.streak}W</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Full Rankings Table */}
      <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden">
        <div className="p-4 border-b border-white/5">
          <h3 className="font-['Space_Grotesk'] font-bold text-sm">Full Rankings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Rank</th>
                <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Player</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Picks</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Win %</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Profit</th>
                <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Streak</th>
              </tr>
            </thead>
            <tbody>
              {leaderboardData.map((user) => (
                <tr
                  key={user.rank}
                  className={cn(
                    'border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors',
                    user.isYou && 'bg-primary/5'
                  )}
                >
                  <td className="py-3 px-4">
                    <span className={cn(
                      'font-["Space_Grotesk"] font-black text-sm',
                      user.rank <= 3 ? 'text-tertiary' : 'text-on-surface-variant'
                    )}>
                      #{user.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-xs font-bold text-on-surface-variant">
                        {user.avatar}
                      </div>
                      <div>
                        <p className="font-bold text-sm">{user.name}</p>
                        {user.isYou && (
                          <span className="text-[9px] text-primary font-bold uppercase">You</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="text-center py-3 px-4 text-sm">{user.totalPicks}</td>
                  <td className="text-center py-3 px-4">
                    <span className={cn(
                      'text-sm font-bold',
                      user.winRate >= 60 ? 'text-tertiary' : user.winRate >= 55 ? 'text-kcm-yellow' : 'text-on-surface'
                    )}>
                      {user.winRate}%
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">
                    <span className="text-sm font-bold text-tertiary">+${user.profit.toLocaleString()}</span>
                  </td>
                  <td className="text-center py-3 px-4">
                    {user.streak > 0 ? (
                      <span className="bg-tertiary/10 text-tertiary px-2 py-0.5 rounded-full text-[10px] font-bold">
                        🔥 {user.streak}W
                      </span>
                    ) : (
                      <span className="text-on-surface-variant text-xs">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
