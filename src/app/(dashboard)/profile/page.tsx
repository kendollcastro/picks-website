'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useUser } from '@/contexts/UserContext';
import { usePicks } from '@/hooks/usePicks';
import {
  Flame,
  ChevronRight,
  Loader2,
  Target,
  User,
} from 'lucide-react';

const sportEmojis: Record<string, string> = {
  nba: '🏀', nfl: '🏈', mlb: '⚾', soccer: '⚽', ufc: '🥊',
  'college-football': '🏟️', 'college-basketball': '🎓', 'womens-basketball': '👩‍🏀',
};

export default function ProfilePage() {
  const { user, profile, loading: userLoading } = useUser();
  const { picks, stats, loading: picksLoading } = usePicks();

  if (userLoading || picksLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <User size={48} className="text-on-surface-variant mb-4" />
        <p className="text-on-surface-variant">Please log in to view your profile</p>
      </div>
    );
  }

  const recentPicks = picks.slice(0, 5).map(pick => ({
    id: pick.id,
    emoji: sportEmojis[pick.sport] || '🏀',
    match: `${pick.away_team} @ ${pick.home_team}`,
    pick: pick.selection,
    isWin: pick.status === 'won',
    result: pick.status === 'won' ? 'WON' : pick.status === 'lost' ? 'LOSS' : pick.status === 'push' ? 'PUSH' : 'PENDING',
    time: new Date(pick.created_at).toLocaleDateString(),
  }));

  const username = profile?.username || user.email?.split('@')[0] || 'KCMUser';
  const initial = username.charAt(0).toUpperCase();

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Profile Header */}
      <section className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        <div className="relative shrink-0">
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-1 bg-gradient-to-tr from-primary via-tertiary to-primary-container shadow-[0_0_30px_rgba(0,102,255,0.2)]">
            <div className="w-full h-full rounded-full overflow-hidden border-4 border-surface bg-surface-container-high flex items-center justify-center">
              {profile?.avatar_url ? (
                <Image unoptimized src={profile.avatar_url} alt={username} fill className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl sm:text-4xl font-bold text-on-surface-variant">{initial}</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <h2 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight uppercase">{username}</h2>
          <div className="flex items-center justify-center md:justify-start gap-2 mt-2 flex-wrap">
            {stats && stats.current_streak >= 5 && (
              <span className="bg-tertiary/10 text-tertiary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-tertiary/20">
                {stats.current_streak} Win Streak
              </span>
            )}
            {stats && stats.win_rate >= 55 && (
              <span className="bg-primary-container/10 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-primary/20">
                Hot Hand
              </span>
            )}
          </div>
          <p className="text-on-surface-variant text-sm mt-3 max-w-md">
            Member since {user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'recently'}
          </p>
        </div>
      </section>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-surface-container-high rounded-xl p-3 sm:p-4 flex flex-col justify-between aspect-square border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Total Picks</span>
          <div>
            <div className="text-2xl sm:text-3xl font-['Space_Grotesk'] font-black text-primary">{stats?.total_picks || 0}</div>
            {stats?.pending !== undefined && stats.pending > 0 && (
              <div className="text-[10px] text-on-surface-variant mt-1">{stats.pending} pending</div>
            )}
          </div>
        </div>

        <div className="bg-surface-container-high rounded-xl p-3 sm:p-4 flex flex-col justify-between aspect-square border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Win Rate</span>
          <div>
            <div className="text-2xl sm:text-3xl font-['Space_Grotesk'] font-black text-white">{stats?.win_rate?.toFixed(1) || 0}%</div>
            <div className="h-1.5 w-full bg-white/10 rounded-full mt-2 sm:mt-3 overflow-hidden">
              <div 
                className="h-full bg-tertiary shadow-[0_0_10px_#00e479]" 
                style={{ width: `${Math.min(stats?.win_rate || 0, 100)}%` }} 
              />
            </div>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-xl p-3 sm:p-4 flex flex-col justify-between aspect-square border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Total Profit</span>
          <div>
            <div className={cn(
              "text-2xl sm:text-3xl font-['Space_Grotesk'] font-black",
              (stats?.total_profit || 0) >= 0 ? 'text-tertiary' : 'text-error'
            )}>
              {(stats?.total_profit || 0) >= 0 ? '+' : ''}${stats?.total_profit?.toFixed(0) || 0}
            </div>
            <div className={cn("text-[10px] mt-1", (stats?.roi || 0) >= 0 ? 'text-tertiary' : 'text-error')}>
              ROI: {(stats?.roi || 0) >= 0 ? '+' : ''}{(stats?.roi || 0).toFixed(1)}%
            </div>
          </div>
        </div>

        <div className="bg-surface-container-high rounded-xl p-3 sm:p-4 flex flex-col justify-between aspect-square border border-white/5">
          <span className="text-on-surface-variant text-[10px] font-bold uppercase tracking-widest">Record</span>
          <div className="flex items-end gap-2">
            <div className="text-2xl sm:text-3xl font-['Space_Grotesk'] font-black text-on-surface">
              {stats?.wins || 0}-{stats?.losses || 0}
            </div>
            {stats && stats.current_streak >= 3 && (
              <Flame size={24} className="text-tertiary animate-pulse mb-1" fill="currentColor" />
            )}
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 sm:gap-8">
        {/* Recent Activity */}
        <section className="lg:col-span-3 space-y-4">
          <div className="flex justify-between items-center px-1">
            <h3 className="font-['Space_Grotesk'] font-bold uppercase tracking-wider text-sm">Recent Picks</h3>
            <button className="text-primary text-[10px] font-bold uppercase tracking-widest hover:opacity-70 transition-opacity flex items-center gap-1">
              View All <ChevronRight size={12} />
            </button>
          </div>

          {picksLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : recentPicks.length > 0 ? (
            <div className="space-y-3">
              {recentPicks.map((pick) => (
                <div
                  key={pick.id}
                  className={cn(
                    'bg-surface-container-low rounded-xl p-3 sm:p-4 flex items-center justify-between border-l-4',
                    pick.isWin ? 'border-tertiary' : 'border-error'
                  )}
                >
                  <div className="flex gap-3 sm:gap-4 items-center">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-xl">
                      {pick.emoji}
                    </div>
                    <div>
                      <div className="text-sm font-bold">{pick.match}</div>
                      <div className="text-[10px] text-on-surface-variant uppercase tracking-wider font-medium">{pick.pick}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn('text-xs font-black uppercase tracking-tighter', pick.isWin ? 'text-tertiary' : 'text-error')}>
                      {pick.result}
                    </div>
                    <div className="text-[10px] text-on-surface-variant">{pick.time}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface-container-high rounded-xl p-8 text-center border border-white/5">
              <Target size={48} className="mx-auto text-on-surface-variant mb-4" />
              <p className="font-['Space_Grotesk'] font-bold text-lg">No picks yet</p>
              <p className="text-on-surface-variant text-sm mt-2">Start taking picks to track your performance!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}