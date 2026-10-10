// ============================================
// KCMPICKS - Jev Top Picks Hook
// Runs the server pipeline (OpenRouter research → Jev → value engine)
// for a batch of games and returns ranked +EV picks.
// The route keeps OPENROUTER_API_KEY server-side; only types are imported.
// ============================================

'use client';

import { useState, useCallback } from 'react';
import type { TopPickGame, TopPicksResult } from '@/lib/api/jev-top-picks';

interface RunOptions {
  useResearch?: boolean;
  limit?: number;
  minEv?: number;
}

export function useTopPicks() {
  const [result, setResult] = useState<TopPicksResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(async (games: TopPickGame[], options: RunOptions = {}) => {
    if (games.length === 0) {
      setError('No games with odds available to analyze');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/top-picks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ games, ...options }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || `AI analysis failed (${response.status})`);
      }

      setResult(data as TopPicksResult);
      return data as TopPicksResult;
    } catch (err) {
      console.error('Top picks error:', err);
      setError(err instanceof Error ? err.message : 'AI analysis failed');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { result, loading, error, run, reset };
}
