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

function parsePickSelection(selection: string, pickType: string): { team?: string; isOver?: boolean; line?: number; side?: string } {
  const parts = selection.split(' ');
  
  if (pickType === 'moneyline') {
    return { team: selection.replace(' ML', '').trim() };
  }
  
  if (pickType === 'spread') {
    const team = parts[0];
    const spread = parseFloat(parts[1] || '0');
    return { team, side: spread > 0 ? 'underdog' : 'favorite' };
  }
  
  if (pickType === 'total') {
    const isOver = parts[0] === 'Over';
    const line = parseFloat(parts[1] || '0');
    return { isOver, line };
  }
  
  return {};
}

function settlePick(pick: Pick, game: { homeScore: number; awayScore: number; status: string; homeTeam: string; awayTeam: string; isLive: boolean }): 'won' | 'lost' | 'push' | null {
  if (game.status !== 'Final' || game.isLive) return null;
  
  const parsed = parsePickSelection(pick.selection, pick.pick_type);
  const homeWon = game.homeScore > game.awayScore;
  const awayWon = game.awayScore > game.homeScore;
  const isTie = game.homeScore === game.awayScore;
  
  if (pick.pick_type === 'moneyline') {
    if (parsed.team === game.homeTeam && homeWon) return 'won';
    if (parsed.team === game.awayTeam && awayWon) return 'won';
    if (isTie) return 'push';
    return 'lost';
  }
  
  if (pick.pick_type === 'spread') {
    const spreadValue = Math.abs(parseFloat(pick.selection.split(' ')[1] || '0'));
    let adjustedHomeScore = game.homeScore;
    let adjustedAwayScore = game.awayScore;
    
    if (pick.selection.includes(game.homeTeam)) {
      if (pick.selection.includes('+')) {
        adjustedHomeScore += spreadValue;
      } else {
        adjustedHomeScore -= spreadValue;
      }
    } else if (pick.selection.includes(game.awayTeam)) {
      if (pick.selection.includes('+')) {
        adjustedAwayScore += spreadValue;
      } else {
        adjustedAwayScore -= spreadValue;
      }
    }
    
    if (adjustedHomeScore > adjustedAwayScore) return 'won';
    if (adjustedAwayScore > adjustedHomeScore) return 'lost';
    return 'push';
  }
  
  if (pick.pick_type === 'total') {
    const totalScore = game.homeScore + game.awayScore;
    const line = parsed.line || 0;
    
    if (parsed.isOver && totalScore > line) return 'won';
    if (!parsed.isOver && totalScore < line) return 'won';
    if (totalScore === line) return 'push';
    return 'lost';
  }
  
  return null;
}

export function usePicks() {
  const [picks, setPicks] = useState<Pick[]>([]);
  const [stats, setStats] = useState<PickStats | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

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

  // Auto-settle picks based on game results
  const settlePicks = useCallback(async (gamesData: Record<string, { homeScore: number; awayScore: number; status: string; homeTeam: string; awayTeam: string; isLive: boolean }>) => {
    const pendingPicks = picks.filter(p => p.status === 'pending');
    if (pendingPicks.length === 0) return;

    for (const pick of pendingPicks) {
      const matchId = pick.match_id || `${pick.sport}-${pick.home_team}-${pick.away_team}`;
      const game = gamesData[matchId] || Object.values(gamesData).find(
        (g: { homeTeam: string; awayTeam: string }) => 
          (g.homeTeam === pick.home_team && g.awayTeam === pick.away_team) ||
          (g.homeTeam === pick.away_team && g.awayTeam === pick.home_team)
      );

      if (!game || game.status !== 'Final' || game.isLive) continue;

      const result = settlePick(pick, game);
      if (result) {
        const { error } = await supabase
          .from('picks')
          .update({
            status: result,
            home_score: game.homeScore,
            away_score: game.awayScore,
            settled_at: new Date().toISOString(),
          })
          .eq('id', pick.id);

        if (error) {
          console.error('Error settling pick:', error);
        }
      }
    }

    await fetchPicks();
  }, [picks, supabase, fetchPicks]);

  // Initial fetch - load data without showing initial loading spinner
  useEffect(() => {
    // Start with empty state, don't show loading
    const loadPicks = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setPicks([]);
          return;
        }
        
        const { data: picksData, error: picksError } = await supabase
          .from('picks')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (picksError) {
          console.warn('Error fetching picks:', picksError.message);
        }

        setPicks(picksData || []);
        setStats(calculateStats((picksData || []) as Pick[]));
      } catch (error) {
        console.error('Error fetching picks:', error);
      }
    };
    
    loadPicks();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    picks,
    stats,
    loading,
    createPick,
    updatePickStatus,
    deletePick,
    refresh: fetchPicks,
    settlePicks,
  };
}
