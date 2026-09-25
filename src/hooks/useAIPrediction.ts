// ============================================
// KCMPICKS - AI Prediction Hook
// Uses Jev (TypeSafe System One) via OpenRouter for AI-powered predictions.
// The route handler /api/ai/predictions keeps OPENROUTER_API_KEY server-side.
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import type { JevContext, JevPrediction } from '@/lib/api/jev-predictions';
import { getTeamRating } from '@/lib/api/massey-ratings';

interface GameInfo {
  homeTeam: string;
  awayTeam: string;
  sport: string;
  homeOdds: number;
  awayOdds: number;
}

export function useAIPrediction(game: GameInfo | null) {
  const [prediction, setPrediction] = useState<JevPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrediction = useCallback(async () => {
    if (!game) return;

    setLoading(true);
    setError(null);

    try {
      // Get Massey ratings for additional context
      const homeRating = await getTeamRating(game.sport, game.homeTeam);
      const awayRating = await getTeamRating(game.sport, game.awayTeam);

      const context: JevContext = {
        homeTeam: game.homeTeam,
        awayTeam: game.awayTeam,
        sport: game.sport,
        homeOdds: game.homeOdds,
        awayOdds: game.awayOdds,
        homeRating: homeRating?.rating,
        awayRating: awayRating?.rating,
        homeWins: homeRating?.wins,
        homeLosses: homeRating?.losses,
        awayWins: awayRating?.wins,
        awayLosses: awayRating?.losses,
      };

      const response = await fetch('/api/ai/predictions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });

      if (!response.ok) {
        throw new Error(`AI prediction request failed (${response.status})`);
      }

      const data = await response.json();
      setPrediction(data.prediction ?? null);
    } catch (err) {
      setError('Failed to get AI prediction');
      console.error('AI prediction error:', err);
    } finally {
      setLoading(false);
    }
  }, [game?.homeTeam, game?.awayTeam, game?.sport, game?.homeOdds, game?.awayOdds]);

  useEffect(() => {
    if (game) {
      fetchPrediction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game?.homeTeam, game?.awayTeam, game?.sport, game?.homeOdds, game?.awayOdds]);

  return { prediction, loading, error, refresh: fetchPrediction };
}

// ============================================
// COMBINE ALL PREDICTION SOURCES
// ============================================
export interface CombinedPrediction {
  jev?: JevPrediction;
  ensemble: {
    pick: string;
    confidence: number;
    edge: number;
    sources: string[];
  };
}