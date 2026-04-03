// ============================================
// KCMPICKS - useAgents Hook
// React hook for AI agents
// ============================================

'use client';

import { useState, useEffect, useCallback } from 'react';
import { agentManager, type AgentMessage, type AgentContext } from '@/lib/agents';
import { usePicks } from './usePicks';
import { useLiveData, useOdds } from './useLiveData';

export function useAgents(sport: string = 'nba') {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const { picks } = usePicks();
  const { games } = useLiveData(sport);
  const { odds } = useOdds(sport);

  // Run all agents
  const runAgents = useCallback(async () => {
    setLoading(true);

    const context: AgentContext = {
      sport,
      currentPicks: picks,
      liveGames: games,
      odds: odds,
    };

    const results = await agentManager.runAll(context);
    setMessages(results);
    setLastRun(new Date());
    setLoading(false);
  }, [sport, picks, games, odds]);

  // Run specific agent
  const runAgent = useCallback(async (agentName: string) => {
    const context: AgentContext = {
      sport,
      currentPicks: picks,
      liveGames: games,
      odds: odds,
    };

    const results = await agentManager.runAgent(agentName, context);
    return results;
  }, [sport, picks, games, odds]);

  // Dismiss a message
  const dismissMessage = useCallback((messageId: string) => {
    setMessages(prev => prev.filter(m => m.id !== messageId));
  }, []);

  // Auto-run on mount and when data changes
  useEffect(() => {
    const run = async () => {
      setLoading(true);
      const context: AgentContext = {
        sport,
        currentPicks: picks,
        liveGames: games,
        odds: odds,
      };
      const results = await agentManager.runAll(context);
      setMessages(results);
      setLastRun(new Date());
      setLoading(false);
    };
    if (picks.length > 0 || odds.length > 0) {
      run();
    }
  }, [sport, picks.length, odds.length, picks, games, odds]);

  // Filter messages by type
  const predictions = messages.filter(m => m.type === 'prediction');
  const analyses = messages.filter(m => m.type === 'analysis');
  const recommendations = messages.filter(m => m.type === 'recommendation');
  const alerts = messages.filter(m => m.type === 'alert');
  const insights = messages.filter(m => m.type === 'insight');

  return {
    messages,
    predictions,
    analyses,
    recommendations,
    alerts,
    insights,
    loading,
    lastRun,
    runAgents,
    runAgent,
    dismissMessage,
  };
}

// Utility to format message age
export function formatMessageAge(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return date.toLocaleDateString();
}
