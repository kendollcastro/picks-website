'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useLiveData, usePredictions, type LiveGame, type Prediction } from '@/hooks/useLiveData';
import { useUser } from '@/contexts/UserContext';
import { usePicks } from '@/hooks/usePicks';
import {
  TrendingUp,
  TrendingDown,
  Flame,
  ChevronRight,
  RefreshCw,
  Loader2,
  Star,
  Activity,
  Target,
  DollarSign,
  Sparkles,
  Clock,
} from 'lucide-react';

const sports = [
  { id: 'nba', name: 'NBA' },
  { id: 'nfl', name: 'NFL' },
  { id: 'mlb', name: 'MLB' },
  { id: 'soccer', name: 'Soccer' },
  { id: 'ufc', name: 'UFC' },
  { id: 'college-football', name: 'CFB' },
  { id: 'college-basketball', name: 'CBB' },
  { id: 'womens-basketball', name: 'WNBA' },
];

export default function DashboardPage() {
  const [selectedSport, setSelectedSport] = useState('nba');
  const { user, profile } = useUser();
  const { stats: userStats } = usePicks();
  const { games, loading: gamesLoading, refresh: refreshGames } = useLiveData(selectedSport);
  const { predictions, loading: predsLoading, refresh: refreshPreds } = usePredictions(selectedSport);

  const liveGames = games.filter(g => g.isLive);
  const scheduledGames = games.filter(g => !g.isLive && g.status !== 'Final');

  const handleRefresh = () => {
    refreshGames();
    refreshPreds();
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div 
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="font-['Space_Grotesk'] text-2xl sm:text-3xl font-bold tracking-tight">
            {user ? `Welcome back, ${profile?.username || user.email?.split('@')[0] || 'Bettor'}` : 'Dashboard'}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-tertiary"></span>
            </span>
            <p className="text-on-surface-variant text-sm">Live data from ESPN</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={gamesLoading || predsLoading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-container-high border border-white/10 hover:bg-surface-container-highest hover:border-white/15 transition-all text-sm font-medium group"
        >
          {(gamesLoading || predsLoading) ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <RefreshCw size={16} className="group-hover:rotate-180 transition-transform duration-500" />
          )}
          Refresh
        </button>
      </motion.div>

      {/* Sport Selector */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            Today&apos;s Games
          </h2>
          <span className="text-xs text-on-surface-variant uppercase tracking-widest font-medium">
            {games.length} games
          </span>
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 -mx-2 px-2">
          {sports.map((sport, i) => (
            <motion.button
              key={sport.id}
              onClick={() => setSelectedSport(sport.id)}
              className="shrink-0"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
            >
              <div
                className={cn(
                  'px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200 whitespace-nowrap',
                  selectedSport === sport.id
                    ? 'bg-primary text-on-primary-container shadow-lg shadow-primary/20'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant hover:text-on-surface'
                )}
              >
                {sport.name}
              </div>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Stats Bento - User Stats - Redesigned with Hero Card */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex justify-between items-end mb-4">
          <h2 className="font-['Space_Grotesk'] text-xl font-bold tracking-tight">
            Your Performance
          </h2>
          <Link href="/stats" className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1 font-medium">
            View Details <ChevronRight size={12} />
          </Link>
        </div>
        
        {/* Hero Layout - Profit takes center stage */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Hero Card - 30D Profit (spans 2 cols) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="col-span-2 glass-card rounded-2xl p-6 bg-gradient-to-br from-tertiary/10 to-transparent border border-tertiary/20 relative overflow-hidden"
          >
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-tertiary/10 rounded-full blur-2xl" />
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-tertiary/20 text-tertiary flex items-center justify-center">
                <DollarSign size={24} />
              </div>
              <div className={cn(
                'flex items-center gap-1 text-sm font-bold px-3 py-1 rounded-full',
                (userStats?.roi ?? 0) >= 0 ? 'bg-tertiary/20 text-tertiary' : 'bg-error/20 text-error'
              )}>
                {(userStats?.roi ?? 0) >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                ROI: {(userStats?.roi ?? 0) >= 0 ? '+' : ''}{(userStats?.roi ?? 0).toFixed(1)}%
              </div>
            </div>
            <h3 className={cn(
              "font-['Space_Grotesk'] text-4xl md:text-5xl font-black mb-2",
              (userStats?.total_profit ?? 0) >= 0 ? 'text-tertiary' : 'text-error'
            )}>
              {(userStats?.total_profit ?? 0) >= 0 
                ? `+$${Math.abs(userStats?.total_profit ?? 0).toFixed(0)}`
                : `-$${Math.abs(userStats?.total_profit ?? 0).toFixed(0)}`}
            </h3>
            <p className="text-readable text-on-surface-variant font-medium">30 Day Profit</p>
          </motion.div>

          {/* Supporting Stats - 3 smaller cards */}
          {/* Win Rate */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-card rounded-2xl p-4 group hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <Target size={18} />
              </div>
            </div>
            <h3 className="font-['Space_Grotesk'] text-2xl font-black mb-1">
              {userStats?.win_rate?.toFixed(0) || '--'}%
            </h3>
            <p className="text-readable text-on-surface-variant">Win Rate</p>
          </motion.div>

          {/* Streak */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="glass-card rounded-2xl p-4 group hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-kcm-orange/10 text-kcm-orange flex items-center justify-center">
                <Flame size={18} />
              </div>
              {userStats?.current_streak && userStats.current_streak >= 3 && (
                <span className="text-kcm-orange text-sm">🔥</span>
              )}
            </div>
            <h3 className="font-['Space_Grotesk'] text-2xl font-black mb-1">
              {userStats?.current_streak || '0'}{userStats?.streak_type === 'win' ? 'W' : 'L'}
            </h3>
            <p className="text-readable text-on-surface-variant">Streak</p>
          </motion.div>

          {/* Total Picks - smaller */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card rounded-2xl p-4 group hover:border-white/15 transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-9 h-9 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                <Activity size={18} />
              </div>
            </div>
            <h3 className="font-['Space_Grotesk'] text-2xl font-black mb-1">
              {userStats?.total_picks || 0}
            </h3>
            <p className="text-readable text-on-surface-variant">Total Picks</p>
          </motion.div>
        </div>
      </motion.section>

      {/* Live Games */}
      {liveGames.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Activity size={20} className="text-error" />
              <h2 className="font-['Space_Grotesk'] text-xl font-bold">Live Now</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-error/10 text-error text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
              </span>
              {liveGames.length} Live
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {liveGames.slice(0, 4).map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 + i * 0.05 }}
              >
                <LiveGameCard game={game} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* AI Predictions */}
      {predictions.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Sparkles size={20} className="text-primary" />
              <h2 className="font-['Space_Grotesk'] text-xl font-bold">AI Predictions</h2>
            </div>
            <span className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
              {predictions.length} Picks
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predictions.slice(0, 4).map((pred, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <PredictionCard prediction={pred} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Scheduled Games */}
      {scheduledGames.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-['Space_Grotesk'] text-xl font-bold mb-4">Upcoming Games</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scheduledGames.slice(0, 4).map((game, i) => (
              <motion.div
                key={game.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 + i * 0.05 }}
              >
                <ScheduledGameCard game={game} />
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* No Games Message */}
      {games.length === 0 && !gamesLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-12 text-center"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-container-high flex items-center justify-center">
            <Clock size={32} className="text-on-surface-variant" />
          </div>
          <h3 className="font-['Space_Grotesk'] text-xl font-bold mb-2">
            No Games Today
          </h3>
          <p className="text-on-surface-variant max-w-md mx-auto">
            No games scheduled for {selectedSport.toUpperCase()} today. Try selecting a different sport.
          </p>
        </motion.div>
      )}
    </div>
  );
}

// ============================================
// COMPONENTS
// ============================================

function LiveGameCard({ game }: { game: LiveGame }) {
  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden group hover:border-white/15 transition-all duration-300">
      {/* Live Indicator */}
      <div className="absolute top-4 right-4 px-3 py-1 rounded-full bg-error/10 border border-error/20 text-error text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
        </span>
        LIVE
      </div>

      {/* Teams */}
      <div className="flex justify-between items-center mt-2">
        {/* Home Team */}
        <div className="flex flex-col items-center gap-3 w-24">
          {game.homeLogo ? (
            <Image unoptimized src={game.homeLogo} alt={game.homeTeam} width={56} height={56} className="w-14 h-14 object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-2xl font-bold text-on-surface-variant">
              {game.homeTeam.charAt(0)}
            </div>
          )}
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{game.homeTeam}</span>
        </div>

        {/* Score */}
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-3">
            <span className="font-['Space_Grotesk'] text-4xl font-black text-on-surface">{game.homeScore}</span>
            <span className="text-on-surface-variant text-lg">:</span>
            <span className="font-['Space_Grotesk'] text-4xl font-black text-on-surface-variant">{game.awayScore}</span>
          </div>
          <div className="mt-2 px-3 py-1 rounded-full bg-surface-container-high text-xs font-bold text-on-surface-variant">
            {game.period} • {game.clock}
          </div>
        </div>

        {/* Away Team */}
        <div className="flex flex-col items-center gap-3 w-24">
          {game.awayLogo ? (
            <Image unoptimized src={game.awayLogo} alt={game.awayTeam} width={56} height={56} className="w-14 h-14 object-contain" />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-surface-container-high flex items-center justify-center text-2xl font-bold text-on-surface-variant">
              {game.awayTeam.charAt(0)}
            </div>
          )}
          <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{game.awayTeam}</span>
        </div>
      </div>
    </div>
  );
}

function ScheduledGameCard({ game }: { game: LiveGame }) {
  const gameTime = new Date(game.gameTime);
  const timeStr = gameTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

  return (
    <div className="glass-card rounded-2xl p-5 hover:border-white/15 transition-all duration-300 group">
      <div className="flex items-center justify-between">
        {/* Home Team */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-lg font-bold text-on-surface-variant">
            {game.homeTeam.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <span className="font-['Space_Grotesk'] font-bold">{game.homeTeam}</span>
            <p className="text-xs text-on-surface-variant">Home</p>
          </div>
        </div>

        {/* Time */}
        <div className="flex flex-col items-center px-4">
          <span className="text-xs text-on-surface-variant uppercase tracking-wider">vs</span>
          <span className="mt-1 px-3 py-1 rounded-lg bg-primary/10 text-primary text-sm font-bold">
            {timeStr}
          </span>
        </div>

        {/* Away Team */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-['Space_Grotesk'] font-bold">{game.awayTeam}</span>
            <p className="text-xs text-on-surface-variant">Away</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center text-lg font-bold text-on-surface-variant">
            {game.awayTeam.substring(0, 2).toUpperCase()}
          </div>
        </div>
      </div>
    </div>
  );
}

function PredictionCard({ prediction }: { prediction: Prediction }) {
  const stars = Array(5).fill(0).map((_, i) => (
    <Star
      key={i}
      size={14}
      className={i < prediction.valueRating ? 'text-tertiary' : 'text-surface-container-highest'}
      fill={i < prediction.valueRating ? 'currentColor' : 'none'}
    />
  ));

  return (
    <div className="glass-card rounded-2xl p-5 border group hover:border-white/15 transition-all duration-300">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={14} className="text-primary" />
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">AI Prediction</p>
          </div>
          <p className="font-['Space_Grotesk'] font-bold">
            {prediction.homeTeam} <span className="text-on-surface-variant">vs</span> {prediction.awayTeam}
          </p>
        </div>
        <div className="flex gap-0.5">{stars}</div>
      </div>

      {/* Win Probability Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-on-surface-variant">{prediction.homeTeam}</span>
          <span className="text-xs text-on-surface-variant">{prediction.awayTeam}</span>
        </div>
        <div className="relative h-3 bg-surface-container-high rounded-full overflow-hidden">
          <div 
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-primary to-primary-container rounded-full transition-all duration-500"
            style={{ width: `${prediction.homeWinProb}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[10px] font-bold text-on-surface">
              {prediction.homeWinProb.toFixed(0)}% - {prediction.awayWinProb.toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Pick */}
      <div className={cn(
        'px-4 py-3 rounded-xl text-center font-bold',
        prediction.valueRating >= 4 
          ? 'bg-tertiary/10 text-tertiary border border-tertiary/20' 
          : prediction.valueRating >= 3 
            ? 'bg-primary/10 text-primary border border-primary/20'
            : 'bg-surface-container-high text-on-surface-variant border border-white/5'
      )}>
        {prediction.pick}
      </div>
    </div>
  );
}