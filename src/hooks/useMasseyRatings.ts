// ============================================
// KCMPICKS - Massey Ratings Hook
// ============================================

'use client';

import { useState, useEffect } from 'react';
import { fetchMasseyRankings, getTeamRating, getRankings, type TeamRating } from '@/lib/api/massey-ratings';

export function useMasseyRatings(sport: string = 'ncaab') {
  const [ratings, setRatings] = useState<TeamRating[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRatings = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // First try to get from database
      const dbRatings = await getRankings(sport);
      
      if (dbRatings.length > 0) {
        setRatings(dbRatings);
      } else {
        // Fetch from Massey if no data in DB
        const freshRatings = await fetchMasseyRankings(sport);
        setRatings(freshRatings);
      }
    } catch (err) {
      setError('Failed to load ratings');
      console.error('Massey ratings error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRatings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sport]);

  return { ratings, loading, error, refresh: loadRatings };
}

export function useTeamRating(sport: string, teamName: string) {
  const [rating, setRating] = useState<TeamRating | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRating = async () => {
      setLoading(true);
      const data = await getTeamRating(sport, teamName);
      setRating(data);
      setLoading(false);
    };
    
    if (teamName) {
      fetchRating();
    }
  }, [sport, teamName]);

  return { rating, loading };
}

// ============================================
// HELPER: Get rating features for ML model
// ============================================
export function getRatingFeatures(
  homeRating: TeamRating | null,
  awayRating: TeamRating | null
): {
  homeRatingValue: number;
  awayRatingValue: number;
  ratingDiff: number;
  homeWinProb: number;
  homeForm: number;
} {
  const homeRatingValue = homeRating?.rating || 0;
  const awayRatingValue = awayRating?.rating || 0;
  const ratingDiff = homeRatingValue - awayRatingValue;
  
  // Convert rating difference to probability
  // Using logistic function: 1 / (1 + e^(-ratingDiff/constant))
  const constant = 20; // Typical for college sports
  const homeWinProb = 1 / (1 + Math.exp(-ratingDiff / constant)) * 100;
  
  // Calculate recent form from W-L
  const homeForm = homeRating 
    ? (homeRating.wins / (homeRating.wins + homeRating.losses || 1)) * 100 
    : 50;
  
  return {
    homeRatingValue,
    awayRatingValue,
    ratingDiff,
    homeWinProb,
    homeForm,
  };
}