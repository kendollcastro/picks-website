// ============================================
// KCMPICKS - usePicks Hook (Supabase Connected)
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface Pick {
  id: string;
  user_id: string;
  sport: string;
  home_team: string;
  away_team: string;
  pick_type: 'moneyline' | 'spread' | 'total' | 'prop' | 'parlay';
  selection: string;
  odds: number;
  stake: number;
  potential_payout: number;
  confidence: number;
  status: 'pending' | 'won' | 'lost' | 'push' | 'void';
  notes: string | null;
  home_score: number | null;
  away_score: number | null;
  game_date: string;
  match_id: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePickInput {
  sport: string;
  home_team: string;
  away_team: string;
  pick_type: Pick['pick_type'];
  selection: string;
  odds: number;
  stake: number;
  confidence: number;
  notes?: string;
  game_date: string;
  match_id?: string;
}

export interface PickStats {
  total_picks: number;
  wins: number;
  losses: number;
  pushes: number;
  pending: number;
  win_rate: number;
  total_profit: number;
  total_staked: number;
  roi: number;
  current_streak: number;
  streak_type: 'win' | 'loss';
}

export function usePicks() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stats, setStats] = useState<PickStats | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  // Calculate stats from picks
  const calculateStats = (picksData: Pick[]): PickStats => {
    const wins = picksData.filter(p => p.status === 'won').length;
    const losses = picksData.filter(p => p.status === 'lost').length;
    const pushes = picksData.filter(p => p.status === 'push').length;
    const pending = picksData.filter(p => p.status === 'pending').length;
    const settled = wins + losses;

    let totalProfit = 0;
    let totalStaked = 0;

    for (const pick of picksData) {
      if (pick.status !== 'pending' && pick.status !== 'void') {
        totalStaked += pick.stake;
        if (pick.status === 'won') {
          totalProfit += pick.potential_payout - pick.stake;
        } else if (pick.status === 'lost') {
          totalProfit -= pick.stake;
        }
      }
    }

    // Calculate streak
    let currentStreak = 0;
    let streakType: 'win' | 'loss' = 'win';

    for (const pick of picksData) {
      if (pick.status === 'pending' || pick.status === 'push' || pick.status === 'void') continue;

      if (currentStreak === 0) {
        streakType = pick.status === 'won' ? 'win' : 'loss';
        currentStreak = 1;
      } else if (
        (streakType === 'win' && pick.status === 'won') ||
        (streakType === 'loss' && pick.status === 'lost')
      ) {
        currentStreak++;
      } else {
        break;
      }
    }

    return {
      total_picks: picksData.length,
      wins,
      losses,
      pushes,
      pending,
      win_rate: settled > 0 ? (wins / settled) * 100 : 0,
      total_profit: totalProfit,
      total_staked: totalStaked,
      roi: totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0,
      current_streak: currentStreak,
      streak_type: streakType,
    };
  };

  // Fetch all picks for current user
  const fetchPicks = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('picks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching picks:', error);
        setLoading(false);
        return;
      }

      const picksData = (data || []) as Pick[];
      setPicks(picksData);
      setStats(calculateStats(picksData));
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  }, [supabase]);

  // Create a new pick
  const createPick = async (input: CreatePickInput): Promise<Pick | null> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        return null;
      }

      // Calculate potential payout
      let potentialPayout: number;
      if (input.odds > 0) {
        potentialPayout = input.stake + (input.stake * (input.odds / 100));
      } else {
        potentialPayout = input.stake + (input.stake * (100 / Math.abs(input.odds)));
      }

      const newPick = {
        user_id: user.id,
        sport: input.sport,
        home_team: input.home_team,
        away_team: input.away_team,
        match_name: `${input.away_team} @ ${input.home_team}`,
        pick_type: input.pick_type,
        selection: input.selection,
        odds: input.odds,
        stake: input.stake,
        potential_payout: Math.round(potentialPayout * 100) / 100,
        confidence: input.confidence,
        status: 'pending',
        notes: input.notes || null,
        home_score: null,
        away_score: null,
        game_date: input.game_date,
        match_id: input.match_id || null,
      };

      const { data, error } = await supabase
        .from('picks')
        .insert(newPick)
        .select()
        .single();

      if (error) {
        console.error('Error creating pick:', JSON.stringify(error, null, 2), newPick);
        return null;
      }

      // Refresh picks
      await fetchPicks();
      return data as Pick;
    } catch (error) {
      console.error('Error:', error);
      return null;
    }
  };

  // Update pick status (manual settle)
  const updatePickStatus = async (
    pickId: string,
    status: 'won' | 'lost' | 'push' | 'void',
    homeScore?: number,
    awayScore?: number
  ) => {
    try {
      const updateData: Record<string, unknown> = {
        status,
        settled_at: new Date().toISOString(),
      };

      if (homeScore !== undefined) updateData.home_score = homeScore;
      if (awayScore !== undefined) updateData.away_score = awayScore;

      const { error } = await supabase
        .from('picks')
        .update(updateData)
        .eq('id', pickId);

      if (error) {
        console.error('Error updating pick:', error);
        return false;
      }

      await fetchPicks();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Delete a pick
  const deletePick = async (pickId: string) => {
    try {
      const { error } = await supabase
        .from('picks')
        .delete()
        .eq('id', pickId);

      if (error) {
        console.error('Error deleting pick:', error);
        return false;
      }

      await fetchPicks();
      return true;
    } catch (error) {
      console.error('Error:', error);
      return false;
    }
  };

  // Initial fetch
  useEffect(() => {
    const loadPicks = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (picksError) throw picksError;
        
        const { data: statsData } = await supabase
          .from('pick_stats')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        setPicks(picksData || []);
        if (statsData) setStats(statsData);
      } catch (error) {
        console.error('Error fetching picks:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPicks();
  }, [supabase]);

  return {
    picks,
    stats,
    loading,
    createPick,
    updatePickStatus,
    deletePick,
    refresh: fetchPicks,
  };
}

// Utility functions
export function formatOdds(american: number): string {
  if (american > 0) return `+${american}`;
  return `${american}`;
}

export function calculatePayout(stake: number, odds: number): number {
  if (odds > 0) {
    return stake + (stake * (odds / 100));
  }
  return stake + (stake * (100 / Math.abs(odds)));
}

export function calculateProfit(stake: number, odds: number): number {
  if (odds > 0) {
    return stake * (odds / 100);
  }
  return stake * (100 / Math.abs(odds));
}
