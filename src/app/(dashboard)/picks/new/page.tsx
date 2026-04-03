'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  DollarSign,
  Target,
  Star,
  Loader2,
} from 'lucide-react';

const pickTypes = [
  { id: 'moneyline', name: 'Moneyline', description: 'Team to win' },
  { id: 'spread', name: 'Spread', description: 'Point spread' },
  { id: 'total', name: 'Over/Under', description: 'Total points' },
  { id: 'prop', name: 'Player Prop', description: 'Player performance' },
  { id: 'parlay', name: 'Parlay', description: 'Multiple picks' },
];

const confidenceLevels = [
  { level: 1, label: 'Low', color: 'text-on-surface-variant' },
  { level: 2, label: 'Medium', color: 'text-primary' },
  { level: 3, label: 'High', color: 'text-primary' },
  { level: 4, label: 'Very High', color: 'text-tertiary' },
  { level: 5, label: 'Lock 🔒', color: 'text-tertiary' },
];

function NewPickContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const sport = searchParams.get('sport') || 'nba';
  const homeTeam = searchParams.get('home') || 'Home Team';
  const awayTeam = searchParams.get('away') || 'Away Team';

  const [pickType, setPickType] = useState('moneyline');
  const [selectedTeam, setSelectedTeam] = useState<'home' | 'away' | null>(null);
  const [spread, setSpread] = useState('');
  const [total, setTotal] = useState('');
  const [odds, setOdds] = useState('');
  const [stake, setStake] = useState('');
  const [confidence, setConfidence] = useState(3);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const sportEmojis: Record<string, string> = {
    nba: '🏀', nfl: '🏈', mlb: '⚾', soccer: '⚽', ufc: '🥊',
    'college-football': '🏟️', 'college-basketball': '🎓', 'womens-basketball': '👩‍🏀',
  };

  const calculatePayout = () => {
    if (!stake || !odds) return null;
    const stakeNum = parseFloat(stake);
    const oddsNum = parseInt(odds);
    if (isNaN(stakeNum) || isNaN(oddsNum)) return null;

    if (oddsNum > 0) {
      return stakeNum + (stakeNum * (oddsNum / 100));
    } else {
      return stakeNum + (stakeNum * (100 / Math.abs(oddsNum)));
    }
  };

  const calculateProfit = () => {
    if (!stake || !odds) return null;
    const stakeNum = parseFloat(stake);
    const oddsNum = parseInt(odds);
    if (isNaN(stakeNum) || isNaN(oddsNum)) return null;

    if (oddsNum > 0) {
      return stakeNum * (oddsNum / 100);
    } else {
      return stakeNum * (100 / Math.abs(oddsNum));
    }
  };

  const getPickDescription = () => {
    if (pickType === 'moneyline' && selectedTeam) {
      return `${selectedTeam === 'home' ? homeTeam : awayTeam} ML`;
    }
    if (pickType === 'spread' && selectedTeam && spread) {
      const spreadNum = parseFloat(spread);
      const team = selectedTeam === 'home' ? homeTeam : awayTeam;
      const adjustedSpread = selectedTeam === 'home' ? spreadNum : -spreadNum;
      return `${team} ${adjustedSpread > 0 ? '+' : ''}${adjustedSpread}`;
    }
    if (pickType === 'total' && total) {
      return `Over/Under ${total}`;
    }
    return 'Select your pick';
  };

  const handleSubmit = async () => {
    if (!selectedTeam || !odds || !stake) return;

    setIsSubmitting(true);

    // Here you would save to Supabase
    // For now, just simulate success
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    router.push('/picks');
  };

  const payout = calculatePayout();
  const profit = calculateProfit();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-10 h-10 flex items-center justify-center rounded-xl bg-surface-container-high hover:bg-surface-variant transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-['Space_Grotesk'] text-xl font-bold">New Pick</h1>
          <p className="text-on-surface-variant text-xs flex items-center gap-1">
            <span>{sportEmojis[sport] || '🏀'}</span>
            {awayTeam} @ {homeTeam}
          </p>
        </div>
      </div>

      {/* Pick Type */}
      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Pick Type</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pickTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setPickType(type.id)}
              className={cn(
                'p-3 rounded-xl text-left transition-all',
                pickType === type.id
                  ? 'bg-primary-container text-on-primary-container border border-primary/20'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant border border-white/5'
              )}
            >
              <p className="font-['Space_Grotesk'] font-bold text-sm">{type.name}</p>
              <p className="text-[10px] opacity-70">{type.description}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Team Selection */}
      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Select Team</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setSelectedTeam('away')}
            className={cn(
              'p-4 rounded-xl transition-all',
              selectedTeam === 'away'
                ? 'bg-primary-container text-on-primary-container border border-primary/20'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant border border-white/5'
            )}
          >
            <p className="font-['Space_Grotesk'] font-bold text-lg">{awayTeam}</p>
            <p className="text-[10px] opacity-70 uppercase">Away</p>
          </button>
          <button
            onClick={() => setSelectedTeam('home')}
            className={cn(
              'p-4 rounded-xl transition-all',
              selectedTeam === 'home'
                ? 'bg-primary-container text-on-primary-container border border-primary/20'
                : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant border border-white/5'
            )}
          >
            <p className="font-['Space_Grotesk'] font-bold text-lg">{homeTeam}</p>
            <p className="text-[10px] opacity-70 uppercase">Home</p>
          </button>
        </div>
      </section>

      {/* Spread/Total Input */}
      {pickType === 'spread' && (
        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Spread</h3>
          <div className="flex items-center bg-surface-container-high rounded-xl border border-white/5 px-4 py-3">
            <Target size={18} className="text-on-surface-variant mr-3" />
            <input
              type="number"
              step="0.5"
              placeholder="-3.5"
              value={spread}
              onChange={(e) => setSpread(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface text-lg font-['Space_Grotesk'] font-bold placeholder:text-outline/50"
            />
          </div>
        </section>
      )}

      {pickType === 'total' && (
        <section>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Total Points</h3>
          <div className="flex items-center bg-surface-container-high rounded-xl border border-white/5 px-4 py-3">
            <Target size={18} className="text-on-surface-variant mr-3" />
            <input
              type="number"
              step="0.5"
              placeholder="214.5"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface text-lg font-['Space_Grotesk'] font-bold placeholder:text-outline/50"
            />
          </div>
        </section>
      )}

      {/* Odds & Stake */}
      <section className="grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Odds (American)</h3>
          <div className="flex items-center bg-surface-container-high rounded-xl border border-white/5 px-4 py-3">
            <span className="text-on-surface-variant mr-2 font-bold">+</span>
            <input
              type="number"
              placeholder="-110"
              value={odds}
              onChange={(e) => setOdds(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface text-lg font-['Space_Grotesk'] font-bold placeholder:text-outline/50"
            />
          </div>
        </div>
        <div>
          <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Stake ($)</h3>
          <div className="flex items-center bg-surface-container-high rounded-xl border border-white/5 px-4 py-3">
            <DollarSign size={18} className="text-on-surface-variant mr-1" />
            <input
              type="number"
              placeholder="100"
              value={stake}
              onChange={(e) => setStake(e.target.value)}
              className="bg-transparent border-none focus:ring-0 w-full text-on-surface text-lg font-['Space_Grotesk'] font-bold placeholder:text-outline/50"
            />
          </div>
        </div>
      </section>

      {/* Potential Payout */}
      {payout && (
        <div className="bg-surface-container-high rounded-xl p-4 border border-white/5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Potential Payout</p>
              <p className="text-xl font-['Space_Grotesk'] font-black text-on-surface mt-1">${payout.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Potential Profit</p>
              <p className="text-xl font-['Space_Grotesk'] font-black text-tertiary mt-1">+${profit?.toFixed(2)}</p>
            </div>
          </div>
        </div>
      )}

      {/* Confidence */}
      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Confidence Level</h3>
        <div className="flex gap-2">
          {confidenceLevels.map((level) => (
            <button
              key={level.level}
              onClick={() => setConfidence(level.level)}
              className={cn(
                'flex-1 py-3 rounded-xl text-center transition-all',
                confidence === level.level
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              )}
            >
              <div className="flex justify-center gap-0.5 mb-1">
                {Array(level.level).fill(0).map((_, i) => (
                  <Star key={i} size={10} fill="currentColor" />
                ))}
              </div>
              <p className="text-[9px] font-bold uppercase">{level.label}</p>
            </button>
          ))}
        </div>
      </section>

      {/* Notes */}
      <section>
        <h3 className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-3">Notes (Optional)</h3>
        <textarea
          placeholder="Why this pick? Any analysis..."
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="w-full bg-surface-container-high rounded-xl border border-white/5 px-4 py-3 text-sm text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 resize-none"
        />
      </section>

      {/* Pick Summary */}
      {selectedTeam && (
        <div className="bg-surface-container-low rounded-xl p-4 border border-primary/20">
          <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-2">Your Pick</p>
          <p className="font-['Space_Grotesk'] font-bold text-lg text-primary">{getPickDescription()}</p>
          {odds && <p className="text-sm text-on-surface-variant mt-1">Odds: {parseInt(odds) > 0 ? '+' : ''}{odds}</p>}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={!selectedTeam || !odds || !stake || isSubmitting}
        className={cn(
          "w-full py-4 rounded-xl font-['Space_Grotesk'] font-bold text-sm uppercase tracking-widest transition-all",
          selectedTeam && odds && stake
            ? 'cta-gradient text-on-primary-container shadow-[0_4px_24px_rgba(0,102,255,0.3)] active:scale-95'
            : 'bg-surface-container-high text-on-surface-variant cursor-not-allowed'
        )}
      >
        {isSubmitting ? 'Saving...' : 'Place Pick'}
      </button>
    </div>
  );
}

export default function NewPickPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-primary" /></div>}>
      <NewPickContent />
    </Suspense>
  );
}
