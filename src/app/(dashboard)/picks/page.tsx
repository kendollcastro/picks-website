'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { cn, formatGameTime, formatGameDate } from '@/lib/utils';
import { useLiveData, formatOdds, type LiveGame } from '@/hooks/useLiveData';
import { usePicks, type CreatePickInput } from '@/hooks/usePicks';
import {
  RefreshCw,
  Loader2,
  Clock,
  Star,
  Bolt,
  Target,
  Sparkles,
  X,
  Check,
  DollarSign,
  TrendingUp,
  Hash,
  Scale,
} from 'lucide-react';

const sports = [
  { id: 'nba', name: 'NBA', emoji: '🏀' },
  { id: 'nfl', name: 'NFL', emoji: '🏈' },
  { id: 'mlb', name: 'MLB', emoji: '⚾' },
  { id: 'soccer', name: 'Soccer', emoji: '⚽' },
  { id: 'ufc', name: 'UFC', emoji: '🥊' },
  { id: 'college-football', name: 'CFB', emoji: '🏟️' },
  { id: 'college-basketball', name: 'CBB', emoji: '🎓' },
  { id: 'womens-basketball', name: 'WNBA', emoji: '👩‍🏀' },
];

// Sports that support Over/Under totals
const sportsWithTotals = ['nba', 'nfl', 'mlb', 'soccer', 'college-football', 'college-basketball', 'womens-basketball'];

// Total lines by sport type
const totalLines: Record<string, { line: number; label: string }> = {
  nba: { line: 225.5, label: 'PTS' },
  nfl: { line: 48.5, label: 'PTS' },
  mlb: { line: 8.5, label: 'RUNS' },
  soccer: { line: 2.5, label: 'GOALS' },
  'college-football': { line: 55.5, label: 'PTS' },
  'college-basketball': { line: 145.5, label: 'PTS' },
  'womens-basketball': { line: 140.5, label: 'PTS' },
};

// Simple prediction calculation
function calculatePrediction(homeTeam: string, awayTeam: string, sport: string) {
  const seed = (homeTeam.length + awayTeam.length) % 5;
  const homeOddsOptions = [-150, -130, -110, -200, +100, +120, +150];
  const homeOdds = homeOddsOptions[seed];
  const awayOdds = -homeOdds;

  // Calculate implied probability
  const homeImplied = homeOdds > 0 ? 100 / (homeOdds + 100) : Math.abs(homeOdds) / (Math.abs(homeOdds) + 100);
  const awayImplied = awayOdds > 0 ? 100 / (awayOdds + 100) : Math.abs(awayOdds) / (Math.abs(awayOdds) + 100);

  const total = homeImplied + awayImplied;
  const rawHomeProb = (homeImplied / total) * 100 + 3;
  const rawAwayProb = (awayImplied / total) * 100 - 3;

  // Normalize
  const totalProb = rawHomeProb + rawAwayProb;
  const homeProb = (rawHomeProb / totalProb) * 100;
  const awayProb = (rawAwayProb / totalProb) * 100;

  const pickTeam = homeProb > awayProb ? homeTeam : awayTeam;
  const pickOdds = homeProb > awayProb ? homeOdds : awayOdds;
  const pickProb = Math.max(homeProb, awayProb);
  const edge = pickProb - (homeProb > awayProb ? homeImplied * 100 : awayImplied * 100);

  let confidence = 3;
  if (edge > 10) confidence = 5;
  else if (edge > 7) confidence = 4;
  else if (edge > 4) confidence = 3;
  else if (edge > 2) confidence = 2;
  else confidence = 1;

  const analyses: string[] = [];
  if (edge > 5) analyses.push('Strong value detected');
  else if (edge > 2) analyses.push('Moderate value');
  else analyses.push('Standard moneyline play');

  if (pickOdds > 150) analyses.push('Plus odds = higher risk/reward');
  if (pickOdds < -180) analyses.push('Heavy favorite - consider spread');

  // Build recommendations
  const recommendations: Array<{
    type: string;
    pick: string;
    reason: string;
    odds: number;
    pickType: string;
  }> = [
    { 
      type: 'Moneyline', 
      pick: `${pickTeam} ML`, 
      reason: confidence >= 4 ? 'Best value play' : 'Solid pick',
      odds: pickOdds,
      pickType: 'moneyline',
    },
    { 
      type: 'Spread', 
      pick: `${pickTeam} ${homeProb > awayProb ? '-3.5' : '+3.5'}`, 
      reason: 'Better odds, similar edge',
      odds: -110,
      pickType: 'spread',
    },
  ];

  // Add Over/Under for supported sports
  const hasTotals = sportsWithTotals.includes(sport);
  if (hasTotals) {
    const totalInfo = totalLines[sport] || { line: 0, label: 'PTS' };
    const totalSeed = (homeTeam.length * awayTeam.length) % 3;
    const overUnderOdds = [-115, -110, -105][totalSeed];
    const totalDirection = totalSeed === 0 ? 'Over' : totalSeed === 1 ? 'Under' : 'Over';
    const overReason = totalDirection === 'Over' ? 'High-scoring matchup expected' : 'Defensive battle expected';
    
    recommendations.push({
      type: 'Total',
      pick: `${totalDirection} ${totalInfo.line} ${totalInfo.label}`,
      reason: overReason,
      odds: overUnderOdds,
      pickType: 'total',
    });
  }

  // Calculate value score for each recommendation
  // Higher odds (more positive) = better value, -110 is baseline
  const recommendationsWithScore = recommendations.map(rec => {
    let valueScore = 0;
    
    // Base score from edge/confidence
    valueScore += confidence * 10;
    
    // Bonus for positive odds (plus money)
    if (rec.odds > 0) {
      valueScore += (rec.odds - 100) / 10;
    }
    
    // Bonus for odds close to even (-110 to -105)
    if (rec.odds >= -115 && rec.odds <= -105) {
      valueScore += 5;
    }
    
    // Bonus for moneyline if high edge
    if (rec.pickType === 'moneyline' && edge > 5) {
      valueScore += 10;
    }
    
    return { ...rec, valueScore };
  });

  // Sort by value score (highest first)
  recommendationsWithScore.sort((a, b) => b.valueScore - a.valueScore);

  return {
    pickTeam,
    pickOdds,
    pickType: 'moneyline' as const,
    homeWinProb: homeProb,
    awayWinProb: awayProb,
    confidence,
    edge: Math.abs(edge),
    analyses,
    recommendations: recommendationsWithScore,
  };
}

type TabType = 'ai-picks' | 'my-picks';

interface PickModalData {
  game: LiveGame;
  prediction: ReturnType<typeof calculatePrediction>;
  selectedRec: number;
}

export default function SportsPage() {
  const [selectedSport, setSelectedSport] = useState('nba');
  const [activeTab, setActiveTab] = useState<TabType>('ai-picks');
  const [gameFilter, setGameFilter] = useState<'all' | 'live' | 'upcoming'>('all');
  const [modalData, setModalData] = useState<PickModalData | null>(null);
  const [stake, setStake] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { games, loading: gamesLoading, refresh: refreshGames } = useLiveData(selectedSport);
  const { picks: myPicks, stats: pickStats, loading: picksLoading, createPick } = usePicks();

  const liveGames = games.filter(g => g.isLive);
  const upcomingGames = games.filter(g => !g.isLive && g.status !== 'Final');
  const nonFinalGames = games.filter(g => g.status !== 'Final');

  const filteredGames = gameFilter === 'live' ? liveGames :
    gameFilter === 'upcoming' ? upcomingGames : nonFinalGames;

  // Generate predictions for all games
  const gamesWithPredictions = filteredGames.map(game => {
    const prediction = calculatePrediction(game.homeTeam, game.awayTeam, selectedSport);
    return { ...game, prediction };
  });

  const handleRefresh = () => {
    refreshGames();
  };

  const handleTakePick = (game: typeof gamesWithPredictions[0]) => {
    setModalData({
      game,
      prediction: game.prediction,
      selectedRec: 0,
    });
    setStake('100');
    setErrorMessage(null);
  };

  const handleConfirmPick = async () => {
    if (!modalData) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    const rec = modalData.prediction.recommendations[modalData.selectedRec];
    const stakeNum = parseFloat(stake);

    if (isNaN(stakeNum) || stakeNum <= 0) {
      setErrorMessage('Please enter a valid stake amount');
      setIsSubmitting(false);
      return;
    }

    const input: CreatePickInput = {
      sport: selectedSport,
      home_team: modalData.game.homeTeam,
      away_team: modalData.game.awayTeam,
      pick_type: rec.pickType as CreatePickInput['pick_type'],
      selection: rec.pick,
      odds: rec.odds,
      stake: stakeNum,
      confidence: modalData.prediction.confidence,
      notes: modalData.prediction.analyses[0],
      game_date: modalData.game.gameTime,
      match_id: modalData.game.id,
    };

    try {
      const result = await createPick(input);

      if (result) {
        setIsSubmitting(false);
        setShowSuccess(true);
        setTimeout(() => {
          setModalData(null);
          setShowSuccess(false);
        }, 1500);
      } else {
        setErrorMessage('Failed to save pick. Please check if you are logged in.');
        setIsSubmitting(false);
      }
    } catch (error) {
      console.error('Error saving pick:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');
      setIsSubmitting(false);
    }
  };

  const calculatePayout = () => {
    if (!modalData || !stake) return { payout: 0, profit: 0 };
    const rec = modalData.prediction.recommendations[modalData.selectedRec];
    const odds = rec.odds;
    const stakeNum = parseFloat(stake);
    if (isNaN(stakeNum)) return { payout: 0, profit: 0 };

    const profit = odds > 0 ? stakeNum * (odds / 100) : stakeNum * (100 / Math.abs(odds));
    return { payout: stakeNum + profit, profit };
  };

  const { payout, profit } = calculatePayout();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold">Picks</h1>
          <p className="text-on-surface-variant text-sm mt-1">AI-powered picks & tracking</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={gamesLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-white/5 hover:bg-white/10 transition-colors"
        >
          {gamesLoading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      {/* Tabs - Segmented Control Style */}
      <div className="flex bg-surface-container-high rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveTab('ai-picks')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-['Space_Grotesk'] font-bold text-sm transition-all duration-200",
            activeTab === 'ai-picks'
              ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          )}
        >
          <Sparkles size={16} />
          AI Picks
        </button>
        <button
          onClick={() => setActiveTab('my-picks')}
          className={cn(
            "flex items-center gap-2 px-5 py-2.5 rounded-lg font-['Space_Grotesk'] font-bold text-sm transition-all duration-200 relative",
            activeTab === 'my-picks'
              ? 'bg-secondary text-on-secondary shadow-lg shadow-secondary/20'
              : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
          )}
        >
          <Target size={16} />
          My Picks
          {myPicks.filter(p => p.status === 'pending').length > 0 && (
            <span className={cn(
              "ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold",
              activeTab === 'my-picks' 
                ? 'bg-white/20 text-white' 
                : 'bg-secondary/20 text-secondary'
            )}>
              {myPicks.filter(p => p.status === 'pending').length}
            </span>
          )}
        </button>
      </div>

      {/* AI Picks Tab */}
      {activeTab === 'ai-picks' && (
        <>
          {/* Sport Selector */}
          <div className="overflow-x-auto no-scrollbar -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {sports.map((sport) => (
                <button
                  key={sport.id}
                  onClick={() => setSelectedSport(sport.id)}
                  className="shrink-0"
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
                </button>
              ))}
            </div>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-2">
            {[
              { id: 'all' as const, label: `All (${nonFinalGames.length})` },
              { id: 'live' as const, label: `Live (${liveGames.length})` },
              { id: 'upcoming' as const, label: `Upcoming (${upcomingGames.length})` },
            ].map((filter) => (
              <button
                key={filter.id}
                onClick={() => setGameFilter(filter.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-xs font-bold transition-colors',
                  gameFilter === filter.id
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
                )}
              >
                {filter.label}
              </button>
            ))}
          </div>

          {/* Games with AI Predictions - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {gamesLoading && games.length === 0 ? (
              <>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-full bg-surface-container-low skeleton" />
                        <div className="space-y-2">
                          <div className="w-20 h-4 bg-surface-container-low rounded skeleton" />
                          <div className="w-16 h-3 bg-surface-container-low rounded skeleton" />
                        </div>
                      </div>
                      <div className="w-16 h-6 bg-surface-container-low rounded-full skeleton" />
                    </div>
                    <div className="space-y-3">
                      <div className="h-12 bg-surface-container-low rounded-lg skeleton" />
                      <div className="h-10 bg-surface-container-low rounded-lg skeleton" />
                    </div>
                  </div>
                ))}
              </>
            ) : gamesWithPredictions.length === 0 ? (
              <div className="col-span-full bg-surface-container-high rounded-xl p-8 text-center border border-white/5">
                <p className="text-on-surface-variant">No games available for this sport</p>
              </div>
            ) : (
              gamesWithPredictions.map((game) => (
                <AIPredictionCard
                  key={game.id}
                  game={game}
                  prediction={game.prediction}
                  onTakePick={() => handleTakePick(game)}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* My Picks Tab */}
      {activeTab === 'my-picks' && (
        <MyPicksView picks={myPicks} stats={pickStats} loading={picksLoading} onSwitchTab={() => setActiveTab('ai-picks')} />
      )}

      {/* ============================================ */}
      {/* TAKE PICK MODAL */}
      {/* ============================================ */}
      {modalData && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => !isSubmitting && (setModalData(null), setErrorMessage(null))}
          />

          {/* Modal */}
          <div className="relative w-full max-w-lg mx-4 mb-4 sm:mb-0 bg-surface-container-high rounded-2xl border border-white/5 overflow-hidden max-h-[90vh] overflow-y-auto">
            {/* Success State */}
            {showSuccess ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center mx-auto mb-4">
                  <Check size={32} className="text-tertiary" />
                </div>
                <h3 className="font-['Space_Grotesk'] text-xl font-bold">Pick Saved!</h3>
                <p className="text-on-surface-variant text-sm mt-2">Tracking your bet...</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                  <div className="flex items-center gap-2">
                    <Sparkles size={18} className="text-primary" />
                    <h3 className="font-['Space_Grotesk'] font-bold">Take This Pick</h3>
                  </div>
                  <button
                    onClick={() => (setModalData(null), setErrorMessage(null))}
                    className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Content */}
                <div className="p-4 space-y-4">
                  {/* Hero Pick Card */}
                  <div className="bg-gradient-to-br from-primary/10 to-secondary/10 rounded-2xl p-5 border border-primary/20">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-readable-sm text-on-surface-variant">
                        {modalData.game.awayTeam} @ {modalData.game.homeTeam}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-tertiary/20 text-tertiary text-xs font-bold flex items-center gap-1">
                        <TrendingUp size={12} />
                        +{modalData.prediction.edge.toFixed(1)}% Edge
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-readable-sm text-on-surface-variant uppercase font-bold tracking-wider">
                          Recommended Pick
                        </span>
                        <p className="font-['Space_Grotesk'] text-2xl font-black text-on-surface mt-1">
                          {modalData.prediction.pickTeam}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex gap-0.5 mb-1">
                          {Array(5).fill(0).map((_, i) => (
                            <Star
                              key={i}
                              size={16}
                              className={i < modalData.prediction.confidence ? 'text-tertiary' : 'text-surface-container-high'}
                              fill={i < modalData.prediction.confidence ? 'currentColor' : 'none'}
                            />
                          ))}
                        </div>
                        <p className="text-readable-sm text-on-surface-variant">Confidence</p>
                      </div>
                    </div>
                  </div>

                  {/* Simple Analysis */}
                  <div className="bg-surface-container-lowest rounded-xl p-4">
                    <p className="text-readable text-on-surface leading-relaxed">
                      {modalData.prediction.analyses[0] || 'AI analysis suggests value on this pick based on historical data and current odds.'}
                    </p>
                  </div>

                  {/* Bet Type Selection - Simplified */}
                  <div>
                    <h4 className="text-readable-sm font-bold text-on-surface-variant mb-3">Select Bet Type</h4>
                    <div className="grid grid-cols-3 gap-2">
                      {modalData.prediction.recommendations.slice(0, 3).map((rec, i) => {
                        const isRecommended = i === 0;
                        const TypeIcon = rec.type === 'Moneyline' ? Target : rec.type === 'Spread' ? Scale : Hash;
                        return (
                          <button
                            key={i}
                            onClick={() => setModalData({ ...modalData, selectedRec: i })}
                            className={cn(
                              'p-3 rounded-xl text-center transition-all',
                              modalData.selectedRec === i
                                ? 'bg-primary text-on-primary-container shadow-lg'
                                : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant border border-white/5'
                            )}
                          >
                            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mx-auto mb-2">
                              <TypeIcon size={18} />
                            </div>
                            <p className="font-bold text-sm mb-1">{rec.type}</p>
                            <p className="text-readable-sm font-black">{formatOdds(rec.odds)}</p>
                            {isRecommended && modalData.selectedRec !== i && (
                              <span className="text-[9px] text-tertiary font-bold mt-1 block">BEST VALUE</span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Stake & Payout */}
                  <div className="space-y-3">
                    <div>
                      <h4 className="text-readable-sm font-bold text-on-surface-variant mb-2">Stake Amount</h4>
                      <div className="flex items-center bg-surface-container-lowest rounded-xl border border-white/10 px-4 py-3">
                        <DollarSign size={20} className="text-on-surface-variant mr-2" />
                        <input
                          type="number"
                          placeholder="100"
                          value={stake}
                          onChange={(e) => setStake(e.target.value)}
                          className="bg-transparent border-none focus:ring-0 w-full text-on-surface text-2xl font-['Space_Grotesk'] font-black placeholder:text-outline/50"
                        />
                      </div>
                      <div className="flex gap-2 mt-2">
                        {['25', '50', '100', '250'].map((amount) => (
                          <button
                            key={amount}
                            onClick={() => setStake(amount)}
                            className={cn(
                              'flex-1 py-2 rounded-lg text-readable-sm font-bold transition-colors',
                              stake === amount
                                ? 'bg-primary text-on-primary-container'
                                : 'bg-surface-container text-on-surface-variant hover:bg-surface-variant'
                            )}
                          >
                            ${amount}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Payout Preview - Larger */}
                    <div className="bg-surface-container-lowest rounded-2xl p-5 border border-white/5">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-readable-sm text-on-surface-variant mb-1">Payout</p>
                          <p className="font-['Space_Grotesk'] text-3xl font-black text-on-surface">${payout.toFixed(2)}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-readable-sm text-on-surface-variant mb-1">Profit</p>
                          <p className="font-['Space_Grotesk'] text-3xl font-black text-tertiary">+${profit.toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/5">
                  <button
                    onClick={handleConfirmPick}
                    disabled={!stake || isSubmitting}
                    className={cn(
                      "w-full py-4 rounded-xl font-['Space_Grotesk'] font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2",
                      stake
                        ? 'cta-gradient text-on-primary-container shadow-[0_4px_24px_rgba(0,102,255,0.3)] active:scale-[0.98]'
                        : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                    )}
                  >
                    {isSubmitting ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        <Bolt size={18} />
                        Confirm Pick - ${stake || '0'}
                      </>
                    )}
                  </button>
                  {errorMessage && (
                    <div className="mt-2 p-2 rounded-lg bg-error/10 border border-error/20">
                      <p className="text-[11px] text-error text-center">{errorMessage}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// AI PREDICTION CARD
// ============================================
function AIPredictionCard({
  game,
  prediction,
  onTakePick,
}: {
  game: LiveGame;
  prediction: ReturnType<typeof calculatePrediction>;
  onTakePick: () => void;
}) {
  const timeStr = formatGameTime(game.gameTime);
  const dateStr = formatGameDate(game.gameTime);

  const bestPick = prediction.recommendations[0];
  const isHighValue = prediction.edge > 5;
  const gameStarted = game.isLive || (new Date(game.gameTime) < new Date());

  return (
    <div className="glass-card rounded-2xl overflow-hidden group hover:border-white/15 transition-all duration-300 flex flex-col min-h-[380px]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-surface-container-low/50 border-b border-white/5">
        <div className="flex items-center gap-2">
          {game.isLive ? (
            <div className="flex items-center gap-2">
              <span className="bg-error/10 text-error px-2.5 py-1 rounded-full text-[10px] font-bold uppercase flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-error opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-error"></span>
                </span>
                LIVE
              </span>
              {game.status && (
                <span className="text-[10px] font-bold text-error/80 bg-error/5 px-2 py-0.5 rounded">
                  {game.status}
                </span>
              )}
            </div>
          ) : (
            <span className="text-[11px] text-on-surface-variant flex items-center gap-1.5">
              <Clock size={11} />
              {dateStr} • {timeStr}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <Sparkles size={12} className="text-primary" />
          <span className="text-[10px] font-bold text-primary">AI PICK</span>
        </div>
      </div>

      {/* Game Info - Fixed Height */}
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-3">
          {/* Away Team */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-2 text-sm font-black text-on-surface-variant uppercase overflow-hidden">
              {game.awayLogo ? (
                <Image unoptimized src={game.awayLogo} alt={game.awayTeam} width={32} height={32} className="w-8 h-8 object-contain" />
              ) : (
                <span className="truncate">{game.awayTeam.substring(0, 3)}</span>
              )}
            </div>
            <p className="font-semibold text-xs text-center w-full px-1 truncate">{game.awayTeam}</p>
            {game.isLive && (
              <p className={cn(
                "text-2xl font-black font-['Space_Grotesk'] mt-1",
                game.awayScore > game.homeScore ? 'text-tertiary' : 'text-on-surface-variant'
              )}>
                {game.awayScore}
              </p>
            )}
          </div>

          <div className="px-3 flex flex-col items-center">
            <span className="text-on-surface-variant font-bold text-sm">@</span>
            {!game.isLive && (
              <span className="text-[9px] text-on-surface-variant mt-1">VS</span>
            )}
          </div>

          {/* Home Team */}
          <div className="flex-1 flex flex-col items-center min-w-0">
            <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center mb-2 text-sm font-black text-on-surface-variant uppercase overflow-hidden">
              {game.homeLogo ? (
                <Image unoptimized src={game.homeLogo} alt={game.homeTeam} width={32} height={32} className="w-8 h-8 object-contain" />
              ) : (
                <span className="truncate">{game.homeTeam.substring(0, 3)}</span>
              )}
            </div>
            <p className="font-semibold text-xs text-center w-full px-1 truncate">{game.homeTeam}</p>
            {game.isLive && (
              <p className={cn(
                "text-2xl font-black font-['Space_Grotesk'] mt-1",
                game.homeScore > game.awayScore ? 'text-tertiary' : 'text-on-surface-variant'
              )}>
                {game.homeScore}
              </p>
            )}
          </div>
        </div>

        {/* BEST AI Pick - Featured - Fixed Height Container */}
        <div className={cn(
          'rounded-xl p-3 border-2 flex flex-col flex-grow',
          isHighValue 
            ? 'bg-gradient-to-br from-tertiary/20 to-tertiary/5 border-tertiary/40' 
            : 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/30'
        )}>
          {/* Header Row */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className={cn(
                'w-6 h-6 rounded-lg flex items-center justify-center',
                isHighValue ? 'bg-tertiary/20 text-tertiary' : 'bg-primary/20 text-primary'
              )}>
                <Sparkles size={12} />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-on-surface-variant">Best Pick</p>
            </div>
            <div className="flex gap-0.5">
              {Array(5).fill(0).map((_, i) => (
                <Star
                  key={i}
                  size={11}
                  className={i < prediction.confidence ? 'text-tertiary' : 'text-surface-container-highest'}
                  fill={i < prediction.confidence ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>
          
          {/* Main Pick Row */}
          <div className="flex items-center justify-between mb-2">
            <p className={cn(
              'font-black text-lg',
              isHighValue ? 'text-tertiary' : 'text-primary'
            )}>
              {bestPick.pick}
            </p>
            <span className="px-2 py-0.5 rounded bg-white/10 text-xs font-bold">
              {formatOdds(bestPick.odds)}
            </span>
          </div>
          
          {/* Edge Badge & Reason Row */}
          <div className="flex items-center justify-between mt-auto">
            {prediction.edge > 3 ? (
              <span className={cn(
                'px-2 py-0.5 rounded text-[9px] font-bold',
                isHighValue ? 'bg-tertiary/30 text-tertiary' : 'bg-primary/30 text-primary'
              )}>
                +{prediction.edge.toFixed(1)}% EDGE
              </span>
            ) : (
              <span />
            )}
            <p className="text-[10px] text-on-surface-variant text-right truncate max-w-[120px]">{bestPick.reason}</p>
          </div>
        </div>

        {/* Other Options - Always 2 columns, empty slot if needed */}
        <div className="mt-3">
          <p className="text-[9px] font-bold text-on-surface-variant uppercase tracking-wider mb-2">Other Options</p>
          <div className="grid grid-cols-2 gap-2">
            {prediction.recommendations.slice(1, 3).map((rec, idx) => (
              <div 
                key={idx}
                className="bg-surface-container-high/50 rounded-lg p-2.5 border border-white/5 flex flex-col"
              >
                <p className={cn(
                  'text-[8px] font-bold uppercase tracking-wider mb-0.5',
                  rec.type === 'Spread' ? 'text-secondary' : 'text-tertiary'
                )}>
                  {rec.type}
                </p>
                <p className="font-semibold text-xs line-clamp-1">{rec.pick}</p>
                <p className="text-[9px] text-on-surface-variant mt-auto">{formatOdds(rec.odds)}</p>
              </div>
            ))}
            {/* Empty slots if less than 2 options */}
            {prediction.recommendations.length < 3 && (
              <div className="bg-surface-container-high/20 rounded-lg p-2.5 border border-dashed border-white/10">
                <p className="text-[8px] text-on-surface-variant/50 uppercase">No additional picks</p>
              </div>
            )}
          </div>
        </div>

        {/* Take Pick Button - Only show if game hasn't started */}
        {!gameStarted && (
          <button
            onClick={onTakePick}
            className="w-full py-2.5 bg-gradient-to-r from-primary to-primary-container rounded-xl font-bold text-xs uppercase tracking-wider text-on-primary-container shadow-lg shadow-primary/20 hover:shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 mt-3"
          >
            <Bolt size={14} />
            Take Pick
          </button>
        )}
        {gameStarted && (
          <div className="w-full py-2.5 bg-surface-container-low rounded-xl text-center mt-3">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-wider">
              {game.isLive ? 'Game in progress' : 'Game ended'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// MY PICKS VIEW
// ============================================
function MyPicksView({
  picks,
  stats: _stats,
  loading,
  onSwitchTab,
}: {
  picks: ReturnType<typeof usePicks>['picks'];
  stats: ReturnType<typeof usePicks>['stats'];
  loading: boolean;
  onSwitchTab: () => void;
}) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'won' | 'lost' | 'push'>('all');
  const [sportFilter, setSportFilter] = useState<string>('all');
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');

  const sportEmojis: Record<string, string> = {
    nba: '🏀', nfl: '🏈', mlb: '⚾', soccer: '⚽', ufc: '🥊',
    'college-football': '🏟️', 'college-basketball': '🎓', 'womens-basketball': '👩‍🏀',
  };

  const statusFilters = [
    { id: 'all' as const, label: 'All', count: picks.length },
    { id: 'pending' as const, label: 'Pending', count: picks.filter(p => p.status === 'pending').length },
    { id: 'won' as const, label: 'Won', count: picks.filter(p => p.status === 'won').length },
    { id: 'lost' as const, label: 'Lost', count: picks.filter(p => p.status === 'lost').length },
    { id: 'push' as const, label: 'Push', count: picks.filter(p => p.status === 'push').length },
  ];

  const getSportsUsed = () => {
    const sports = new Set(picks.map(p => p.sport));
    return Array.from(sports);
  };

  const filteredPicks = picks.filter(pick => {
    if (statusFilter !== 'all' && pick.status !== statusFilter) return false;
    if (sportFilter !== 'all' && pick.sport !== sportFilter) return false;
    
    if (timeFilter !== 'all') {
      const pickDate = new Date(pick.created_at);
      const now = new Date();
      if (timeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        if (pickDate < weekAgo) return false;
      } else if (timeFilter === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        if (pickDate < monthAgo) return false;
      }
    }
    return true;
  });

  const settledPicks = filteredPicks.filter(p => p.status !== 'pending' && p.status !== 'void');
  const wins = settledPicks.filter(p => p.status === 'won').length;
  const losses = settledPicks.filter(p => p.status === 'lost').length;
  const pushes = filteredPicks.filter(p => p.status === 'push').length;
  const totalSettled = wins + losses;
  const winRate = totalSettled > 0 ? (wins / totalSettled) * 100 : 0;
  const totalProfit = settledPicks.reduce((acc, p) => {
    if (p.status === 'won') return acc + (p.potential_payout - p.stake);
    if (p.status === 'lost') return acc - p.stake;
    return acc;
  }, 0);

  const getPickProfit = (pick: typeof picks[0]) => {
    if (pick.status === 'won') return pick.potential_payout - pick.stake;
    if (pick.status === 'lost') return -pick.stake;
    return null;
  };

  const getSportStats = () => {
    const sportMap: Record<string, { wins: number; losses: number; total: number }> = {};
    filteredPicks.filter(p => p.status !== 'pending' && p.status !== 'void').forEach(pick => {
      if (!sportMap[pick.sport]) {
        sportMap[pick.sport] = { wins: 0, losses: 0, total: 0 };
      }
      sportMap[pick.sport].total++;
      if (pick.status === 'won') sportMap[pick.sport].wins++;
      else if (pick.status === 'lost') sportMap[pick.sport].losses++;
    });
    return sportMap;
  };

  const getPickTypeStats = () => {
    const typeMap: Record<string, { wins: number; losses: number; total: number }> = {};
    filteredPicks.filter(p => p.status !== 'pending' && p.status !== 'void').forEach(pick => {
      const type = pick.pick_type || 'other';
      if (!typeMap[type]) {
        typeMap[type] = { wins: 0, losses: 0, total: 0 };
      }
      typeMap[type].total++;
      if (pick.status === 'won') typeMap[type].wins++;
      else if (pick.status === 'lost') typeMap[type].losses++;
    });
    return typeMap;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (picks.length === 0) {
    return (
      <div className="bg-surface-container-high rounded-xl p-8 text-center border border-white/5">
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Target size={40} className="text-primary" />
        </div>
        <p className="font-['Space_Grotesk'] font-bold text-xl mb-2">No picks yet</p>
        <p className="text-on-surface-variant text-readable mb-6 max-w-sm mx-auto">
          Start tracking your sports betting performance with AI-powered picks
        </p>
        <button
          onClick={onSwitchTab}
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20"
        >
          <Sparkles size={18} />
          Take Your First Pick
        </button>
      </div>
    );
  }

  const sportStats = getSportStats();
  const pickTypeStats = getPickTypeStats();

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-surface-container-high rounded-xl p-4 border border-white/5 space-y-4">
        {/* Status Filters */}
        <div>
          <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Status</p>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setStatusFilter(filter.id)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  statusFilter === filter.id
                    ? filter.id === 'won' ? 'bg-tertiary/20 text-tertiary border border-tertiary/30' :
                      filter.id === 'lost' ? 'bg-error/20 text-error border border-error/30' :
                      filter.id === 'pending' ? 'bg-primary/20 text-primary border border-primary/30' :
                      'bg-secondary/20 text-secondary border border-secondary/30'
                    : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-variant'
                )}
              >
                {filter.label} ({filter.count})
              </button>
            ))}
          </div>
        </div>

        {/* Sport & Time Filters */}
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[150px]">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Sport</p>
            <select
              value={sportFilter}
              onChange={(e) => setSportFilter(e.target.value)}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface"
            >
              <option value="all">All Sports</option>
              {getSportsUsed().map((sport) => (
                <option key={sport} value={sport}>
                  {sportEmojis[sport]} {sport.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[150px]">
            <p className="text-[10px] text-on-surface-variant uppercase tracking-widest font-bold mb-2">Time Period</p>
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as 'all' | 'week' | 'month')}
              className="w-full bg-surface-container-lowest border border-white/10 rounded-lg px-3 py-1.5 text-xs text-on-surface"
            >
              <option value="all">All Time</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Wins/Losses Big Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gradient-to-br from-tertiary/20 to-tertiary/5 rounded-xl p-4 border border-tertiary/20 text-center">
          <p className="text-[10px] text-tertiary uppercase tracking-widest font-bold mb-1">Wins</p>
          <p className="text-4xl font-['Space_Grotesk'] font-black text-tertiary">{wins}</p>
        </div>
        <div className="bg-gradient-to-br from-error/20 to-error/5 rounded-xl p-4 border border-error/20 text-center">
          <p className="text-[10px] text-error uppercase tracking-widest font-bold mb-1">Losses</p>
          <p className="text-4xl font-['Space_Grotesk'] font-black text-error">{losses}</p>
        </div>
        <div className="bg-gradient-to-br from-kcm-yellow/20 to-kcm-yellow/5 rounded-xl p-4 border border-kcm-yellow/20 text-center">
          <p className="text-[10px] text-kcm-yellow uppercase tracking-widest font-bold mb-1">Pushes</p>
          <p className="text-4xl font-['Space_Grotesk'] font-black text-kcm-yellow">{pushes}</p>
        </div>
      </div>

      {/* Win Rate & Profit */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-surface-container-high rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Win Rate</p>
            <p className="text-2xl font-['Space_Grotesk'] font-black text-on-surface">{winRate.toFixed(1)}%</p>
          </div>
          <div className="h-3 w-full bg-surface-container-lowest rounded-full overflow-hidden flex">
            <div
              className="h-full bg-tertiary transition-all duration-500"
              style={{ width: `${Math.min(winRate, 100)}%` }}
            />
            <div
              className="h-full bg-error transition-all duration-500"
              style={{ width: `${Math.min(100 - winRate, 100)}%` }}
            />
          </div>
          <p className="text-[9px] text-on-surface-variant mt-2">
            {wins}W - {losses}L {pushes > 0 && `- ${pushes}P`}
          </p>
        </div>
        <div className="bg-surface-container-high rounded-xl p-4 border border-white/5 text-center">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Profit</p>
          <p className={cn(
            "text-3xl font-['Space_Grotesk'] font-black",
            totalProfit >= 0 ? 'text-tertiary' : 'text-error'
          )}>
            {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
          </p>
          <p className="text-[9px] text-on-surface-variant mt-1">
            {filteredPicks.filter(p => p.status !== 'pending').length} settled picks
          </p>
        </div>
      </div>

      {/* Performance by Sport */}
      {Object.keys(sportStats).length > 0 && (
        <div className="bg-surface-container-high rounded-xl p-4 border border-white/5">
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">By Sport</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {Object.entries(sportStats).map(([sport, data]) => {
              const wr = data.total > 0 ? (data.wins / data.total) * 100 : 0;
              return (
                <div key={sport} className="bg-surface-container-lowest rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-base">{sportEmojis[sport] || '🏆'}</span>
                    <span className="text-[10px] font-bold uppercase">{sport}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-['Space_Grotesk'] font-black">{data.wins}-{data.losses}</p>
                    <p className={cn('text-xs font-bold', wr >= 55 ? 'text-tertiary' : wr >= 50 ? 'text-kcm-yellow' : 'text-on-surface-variant')}>
                      {wr.toFixed(0)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Performance by Pick Type */}
      {Object.keys(pickTypeStats).length > 0 && (
        <div className="bg-surface-container-high rounded-xl p-4 border border-white/5">
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">By Pick Type</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
            {Object.entries(pickTypeStats).map(([type, data]) => {
              const wr = data.total > 0 ? (data.wins / data.total) * 100 : 0;
              return (
                <div key={type} className="bg-surface-container-lowest rounded-lg p-3 text-center">
                  <p className="text-[9px] font-bold uppercase text-on-surface-variant mb-1">{type}</p>
                  <p className="text-lg font-['Space_Grotesk'] font-black">{data.wins}-{data.losses}</p>
                  <p className={cn('text-[10px] font-semibold', wr >= 55 ? 'text-tertiary' : wr >= 50 ? 'text-kcm-yellow' : 'text-on-surface-variant')}>
                    {wr.toFixed(0)}%
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Picks List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-['Space_Grotesk'] font-bold text-sm uppercase tracking-wider">
            {filteredPicks.length} {filteredPicks.length === 1 ? 'Pick' : 'Picks'}
          </h3>
          {filteredPicks.length !== picks.length && (
            <button
              onClick={() => { setStatusFilter('all'); setSportFilter('all'); setTimeFilter('all'); }}
              className="text-[10px] text-primary hover:underline"
            >
              Clear Filters
            </button>
          )}
        </div>
        {filteredPicks.length === 0 ? (
          <div className="bg-surface-container-high rounded-xl p-8 text-center border border-white/5">
            <p className="text-on-surface-variant">No picks match your filters</p>
          </div>
        ) : (
          filteredPicks.slice(0, 50).map((pick) => {
            const profit = getPickProfit(pick);
            return (
              <div
                key={pick.id}
                className={cn(
                  'bg-surface-container-high rounded-xl p-3 border-l-4 hover:bg-surface-variant transition-colors',
                  pick.status === 'won' ? 'border-tertiary' :
                  pick.status === 'lost' ? 'border-error' :
                  pick.status === 'push' ? 'border-kcm-yellow' :
                  'border-primary'
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-surface-container-lowest flex items-center justify-center text-lg shrink-0">
                      {sportEmojis[pick.sport] || '🏀'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate max-w-[160px]">{pick.home_team}</p>
                        <span className="text-on-surface-variant text-xs">@</span>
                        <p className="font-semibold text-sm truncate max-w-[160px]">{pick.away_team}</p>
                        <span className={cn(
                          'text-[8px] font-bold uppercase px-1.5 py-0.5 rounded shrink-0',
                          pick.pick_type === 'moneyline' ? 'bg-primary/20 text-primary' :
                          pick.pick_type === 'spread' ? 'bg-secondary/20 text-secondary' :
                          'bg-tertiary/20 text-tertiary'
                        )}>
                          {pick.pick_type}
                        </span>
                      </div>
                      <p className="text-[10px] text-on-surface-variant">
                        {pick.selection} • {pick.odds > 0 ? '+' : ''}{pick.odds} • ${pick.stake}
                      </p>
                    </div>
                  </div>
                  <div className="text-right ml-3 shrink-0">
                    <span className={cn(
                      'text-[9px] font-black uppercase',
                      pick.status === 'won' ? 'text-tertiary' :
                      pick.status === 'lost' ? 'text-error' :
                      pick.status === 'push' ? 'text-kcm-yellow' :
                      'text-primary'
                    )}>
                      {pick.status}
                    </span>
                    {profit !== null && (
                      <p className={cn('text-sm font-bold', profit >= 0 ? 'text-tertiary' : 'text-error')}>
                        {profit >= 0 ? '+' : ''}${profit.toFixed(2)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        {filteredPicks.length > 50 && (
          <p className="text-center text-[10px] text-on-surface-variant">
            Showing 50 of {filteredPicks.length} picks
          </p>
        )}
      </div>
    </div>
  );
}
