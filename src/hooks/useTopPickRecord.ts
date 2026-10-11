'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ModelRecord } from '@/lib/api/top-picks-settle';

export interface TopPickRecordResponse {
  record: ModelRecord | null;
  lastSettle: { settled: number; won: number; lost: number; push: number; void: number } | null;
  error: string | null;
}

// Fetches the model's running win-rate / ROI from /api/ai/top-picks (GET).
// The GET also settles any picks whose games have finalized, so the record
// is always up to date when we read it.
export function useTopPickRecord() {
  const [data, setData] = useState<TopPickRecordResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/top-picks', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData((await res.json()) as TopPickRecordResponse);
    } catch (err) {
      console.error('useTopPickRecord failed:', err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { data, loading, refresh };
}
