'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useLiveData, type LiveGame } from '@/hooks/useLiveData';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Loader2,
  Radio,
  Clock,
  Star,
  Zap,
  Activity,
  Flame,
} from 'lucide-react';

const sports = [
  { id: 'nba', name: 'NBA', emoji: '🏀' },
  { id: 'nfl', name: 'NFL', emoji: '🏈' },
  { id: 'mlb', name: 'MLB', emoji: '⚾' },
  { id: 'soccer', name: 'Soccer', emoji: '⚽' },
  { id: 'ufc', name: 'UFC', emoji: '🥊' },
  { id: 'college-football', name: 'CFB', emoji: '🏟️' },
  { id: 'college-basketball', name: 'CBB', emoji: '🎓' },
];

export default function LivePage() {
  const [selectedSport, setSelectedSport] = useState('nba');
  const { games, loading, refresh } = useLiveData(selectedSport);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  const liveGames = games.filter(g => g.isLive);
  const upcomingGames = games.filter(g => !g.isLive);

  useEffect(() => {
    const interval = setInterval(() => {
      refresh();
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [refresh]);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
            <Radio size={28} className="text-error animate-pulse" />
            Live Scores
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Real-time updates • {liveGames.length} games live
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-on-surface-variant">
            Updated {lastUpdate.toLocaleTimeString()}
          </span>
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-surface-container-high hover:bg-surface-variant transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span className="text-xs font-medium">Refresh</span>
          </button>
        </div>
      </div>

      {/* Sport Selector */}
      <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
        <div className="flex gap-2 min-w-max">
          {sports.map((sport) => (
            <button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className={cn(
                "px-4 py-2.5 rounded-xl font-semibold text-sm transition-all whitespace-nowrap",
                selectedSport === sport.id
                  ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              )}
            >
              {sport.emoji} {sport.name}
            </button>
          ))}
        </div>
      </div>

      {loading && games.length === 0 ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Live Games */}
          {liveGames.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-error animate-pulse" />
                <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold tracking-tight uppercase">
                  Live Now ({liveGames.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {liveGames.map((game) => (
                  <LiveGameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}

          {/* Upcoming Games */}
          {upcomingGames.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-on-surface-variant" />
                <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold tracking-tight uppercase">
                  Upcoming ({upcomingGames.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {upcomingGames.slice(0, 6).map((game) => (
                  <UpcomingGameCard key={game.id} game={game} />
                ))}
              </div>
            </section>
          )}

          {/* Empty State */}
          {games.length === 0 && (
            <div className="bg-surface-container-high rounded-2xl p-8 text-center border border-white/5">
              <Radio size={48} className="mx-auto text-on-surface-variant mb-4" />
              <p className="font-['Space_Grotesk'] font-bold text-lg">No games available</p>
              <p className="text-on-surface-variant text-sm mt-2">
                Check back later or select a different sport
              </p>
            </div>
          )}
        </>
      )}

      {/* Trending Section */}
      <section className="space-y-4">
        <h2 className="font-['Space_Grotesk'] text-lg sm:text-xl font-bold tracking-tight uppercase flex items-center gap-2">
          <Flame size={20} className="text-kcm-orange" />
          Trending Picks
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { Icon: Zap, label: 'Hot Pick', desc: 'High confidence AI recommendation', odds: '+185', confidence: 82 },
            { Icon: Activity, label: 'Value Play', desc: 'Positive expected value detected', odds: '+120', confidence: 75 },
            { Icon: Star, label: 'Expert Pick', desc: 'Analyzed by multiple models', odds: '-110', confidence: 88 },
          ].map((pick, i) => (
            <div key={i} className="bg-surface-container-low rounded-2xl p-4 border border-white/5 space-y-3 hover:border-primary/20 transition-colors">
              <div className="flex items-center gap-2">
                <pick.Icon size={16} className="text-tertiary" />
                <span className="text-[10px] font-bold text-tertiary uppercase tracking-widest">{pick.label}</span>
                <span className="ml-auto text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                  {pick.confidence}%
                </span>
              </div>
              <p className="text-sm font-medium">{pick.desc}</p>
              <div className="flex items-center justify-between">
                <span className="text-xl font-black font-['Space_Grotesk'] text-tertiary">{pick.odds}</span>
                <button className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-bold hover:bg-primary/20 transition-colors">
                  View Pick
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LiveGameCard({ game }: { game: LiveGame }) {
  return (
    <div className="glass-card rounded-2xl p-5 border-l-4 border-l-error/50 overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <span className="text-[10px] font-bold bg-error/10 text-error px-2.5 py-1 rounded-lg uppercase tracking-widest flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-error animate-pulse" />
          LIVE
        </span>
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">
          {game.status}
        </span>
      </div>

      {/* Teams & Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center mx-auto mb-2 text-sm font-black text-on-surface-variant uppercase">
            {game.awayTeam.substring(0, 2)}
          </div>
          <p className="font-semibold text-xs truncate">{game.awayTeam}</p>
          <p className={cn(
            "text-3xl font-black font-['Space_Grotesk'] mt-1",
            game.awayScore > game.homeScore ? 'text-tertiary' : 'text-on-surface-variant'
          )}>
            {game.awayScore}
          </p>
        </div>

        <div className="px-4">
          <span className="text-on-surface-variant font-bold text-lg">@</span>
        </div>

        <div className="flex-1 text-center">
          <div className="w-14 h-14 rounded-2xl bg-surface-container-lowest flex items-center justify-center mx-auto mb-2 text-sm font-black text-on-surface-variant uppercase">
            {game.homeTeam.substring(0, 2)}
          </div>
          <p className="font-semibold text-xs truncate">{game.homeTeam}</p>
          <p className={cn(
            "text-3xl font-black font-['Space_Grotesk'] mt-1",
            game.homeScore > game.awayScore ? 'text-tertiary' : 'text-on-surface-variant'
          )}>
            {game.homeScore}
          </p>
        </div>
      </div>

      {/* Betting Options */}
      <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/5">
        <button className="py-2.5 px-3 rounded-xl bg-surface-container-lowest border border-white/5 hover:bg-surface-variant transition-colors flex items-center justify-between">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">Spread</span>
          <div className="flex items-center gap-1">
            <TrendingUp size={12} className="text-tertiary" />
            <span className="text-xs font-bold">-3.5</span>
          </div>
        </button>
        <button className="py-2.5 px-3 rounded-xl bg-surface-container-lowest border border-white/5 hover:bg-surface-variant transition-colors flex items-center justify-between">
          <span className="text-[10px] font-bold text-on-surface-variant uppercase">Total</span>
          <div className="flex items-center gap-1">
            <TrendingDown size={12} className="text-error" />
            <span className="text-xs font-bold">225.5</span>
          </div>
        </button>
      </div>
    </div>
  );
}

function UpcomingGameCard({ game }: { game: LiveGame }) {
  const gameTime = new Date(game.gameTime);
  const timeStr = gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dateStr = gameTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="bg-surface-container-high rounded-xl p-4 border border-white/5 hover:border-primary/20 transition-colors">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={12} className="text-on-surface-variant" />
        <span className="text-[10px] text-on-surface-variant">
          {dateStr} • {timeStr}
        </span>
      </div>

      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-[10px] font-black text-on-surface-variant uppercase">
            {game.awayTeam.substring(0, 2)}
          </div>
          <span className="text-xs font-semibold">{game.awayTeam}</span>
        </div>
        <span className="text-on-surface-variant text-sm">@</span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold">{game.homeTeam}</span>
          <div className="w-8 h-8 rounded-lg bg-surface-container-lowest flex items-center justify-center text-[10px] font-black text-on-surface-variant uppercase">
            {game.homeTeam.substring(0, 2)}
          </div>
        </div>
      </div>

      <button className="w-full py-2 rounded-lg bg-surface-container-low text-[10px] font-bold uppercase tracking-wider hover:bg-surface-variant transition-colors">
        Set Alert
      </button>
    </div>
  );
}
