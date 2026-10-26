'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { cn, formatOdds, formatGameDate, formatGameTime } from '@/lib/utils';
import { Loader2, Target, TrendingUp, BarChart3, Filter, PieChart } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface HistoryEntry {
  id: string;
  gameId: string;
  sport: string;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string | null;
  betType: string;
  side: string;
  selection: string;
  line: number | null;
  odds: number;
  jevProbability: number | null;
  fairProbability: number | null;
  edge: number | null;
  expectedValue: number | null;
  confidence: number | null;
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  settledAt: string | null;
  createdAt: string;
}

interface HistoryStats {
  total: number;
  graded: number;
  won: number;
  lost: number;
  push: number;
  void: number;
  pending: number;
  winRate: number | null;
  roi: number | null;
  profit: number;
}

interface HistoryResponse {
  count: number;
  stats: HistoryStats;
  bySport: Array<HistoryStats & { sport: string }>;
  byBetType: Array<HistoryStats & { betType: string }>;
  picks: HistoryEntry[];
}

const sports = [
  { id: 'all', name: 'All Sports' },
  { id: 'nba', name: 'NBA' },
  { id: 'nfl', name: 'NFL' },
  { id: 'mlb', name: 'MLB' },
  { id: 'soccer', name: 'Soccer' },
  { id: 'ufc', name: 'UFC' },
  { id: 'college-football', name: 'CFB' },
  { id: 'college-basketball', name: 'CBB' },
  { id: 'womens-basketball', name: 'WNBA' },
];

const betTypes = [
  { id: 'all', name: 'All Markets' },
  { id: 'moneyline', name: 'Moneyline' },
  { id: 'spread', name: 'Spread' },
  { id: 'total', name: 'Total' },
];

const statuses = [
  { id: 'all', name: 'All' },
  { id: 'pending', name: 'Pending' },
  { id: 'won', name: 'Won' },
  { id: 'lost', name: 'Lost' },
  { id: 'push', name: 'Push' },
  { id: 'void', name: 'Void' },
];

const sportEmojis: Record<string, string> = {
  nba: '🏀', nfl: '🏈', mlb: '⚾', soccer: '⚽', ufc: '🥊',
  'college-football': '🏟️', 'college-basketball': '🎓', 'womens-basketball': '👩‍🏀',
};

export default function HistoryPage() {
  const [data, setData] = useState<HistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sportFilter, setSportFilter] = useState('all');
  const [betTypeFilter, setBetTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sportFilter !== 'all') params.set('sport', sportFilter);
      if (betTypeFilter !== 'all') params.set('betType', betTypeFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      params.set('limit', '200');

      const response = await fetch(`/api/model-history?${params.toString()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`Failed to load history: ${response.status}`);
      const json = (await response.json()) as HistoryResponse;
      setData(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [sportFilter, betTypeFilter, statusFilter]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold">Model History</h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Transparent AI pick record — every bet the model makes, win or lose.
          </p>
        </div>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-surface-container-high border border-white/5 hover:bg-white/10 transition-colors self-start"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Target size={16} />}
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <FilterGroup label="Sport" options={sports} value={sportFilter} onChange={setSportFilter} />
        <FilterGroup label="Market" options={betTypes} value={betTypeFilter} onChange={setBetTypeFilter} />
        <FilterGroup label="Status" options={statuses} value={statusFilter} onChange={setStatusFilter} />
      </div>

      {loading && !data && (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-primary" />
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 rounded-xl p-4 text-error text-sm">
          {error}
        </div>
      )}

      {!loading && !error && !data?.picks.length && (
        <div className="bg-surface-container-high rounded-xl p-12 text-center border border-white/5">
          <BarChart3 size={48} className="mx-auto text-on-surface-variant mb-4" />
          <p className="font-['Space_Grotesk'] font-bold text-lg">No model picks yet</p>
          <p className="text-on-surface-variant text-sm mt-2">
            Run the Jev analysis on the Picks page to start building a public record.
          </p>
        </div>
      )}

      {data?.picks.length ? (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              icon={<Target size={18} className="text-primary" />}
              label="Total Picks"
              value={String(stats?.total ?? 0)}
            />
            <StatCard
              icon={<TrendingUp size={18} className="text-tertiary" />}
              label="Win Rate"
              value={stats?.winRate != null ? `${(stats.winRate * 100).toFixed(1)}%` : '--'}
              positive={stats?.winRate != null ? stats.winRate >= 0.5 : undefined}
            />
            <StatCard
              icon={<BarChart3 size={18} className="text-secondary" />}
              label="Record"
              value={`${stats?.won ?? 0}-${stats?.lost ?? 0}-${stats?.push ?? 0}`}
            />
            <StatCard
              icon={<TrendingUp size={18} className={stats?.roi != null && stats.roi >= 0 ? 'text-tertiary' : 'text-error'} />}
              label="Flat-Stake ROI"
              value={stats?.roi != null ? `${stats.roi >= 0 ? '+' : ''}${(stats.roi * 100).toFixed(1)}%` : '--'}
              positive={stats?.roi != null ? stats.roi >= 0 : undefined}
            />
          </div>

          {/* Sport Breakdown */}
          {data.bySport.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Sport Cards */}
              <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-['Space_Grotesk'] font-bold text-sm">Performance by Sport</h3>
                </div>
                <div className="p-4 grid gap-3">
                  {data.bySport.map((row) => {
                    const winPct = row.graded > 0 ? (row.won / row.graded) * 100 : 0;
                    const sampleSize = row.graded >= 30 ? 'solid' : row.graded >= 10 ? 'small' : 'tiny';
                    return (
                      <div key={row.sport} className="bg-surface-container-low/50 rounded-xl p-3 border border-white/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{sportEmojis[row.sport] || '🏆'}</span>
                            <span className="font-bold text-sm capitalize">{row.sport}</span>
                          </div>
                          <span className={cn(
                            'text-[10px] font-bold uppercase px-1.5 py-0.5 rounded border',
                            sampleSize === 'solid' ? 'bg-tertiary/10 text-tertiary border-tertiary/20' :
                            sampleSize === 'small' ? 'bg-kcm-yellow/10 text-kcm-yellow border-kcm-yellow/20' :
                            'bg-error/10 text-error border-error/20'
                          )}>
                            {row.graded} graded
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-surface-container-high rounded-lg p-2">
                            <p className={cn('text-sm font-black', winPct >= 55 ? 'text-tertiary' : winPct >= 50 ? 'text-kcm-yellow' : 'text-error')}>
                              {winPct.toFixed(1)}%
                            </p>
                            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Win</p>
                          </div>
                          <div className="bg-surface-container-high rounded-lg p-2">
                            <p className={cn('text-sm font-black', (row.roi ?? 0) >= 0 ? 'text-tertiary' : 'text-error')}>
                              {row.roi != null ? `${row.roi >= 0 ? '+' : ''}${(row.roi * 100).toFixed(1)}%` : '--'}
                            </p>
                            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">ROI</p>
                          </div>
                          <div className="bg-surface-container-high rounded-lg p-2">
                            <p className="text-sm font-black text-on-surface">{row.won}-{row.lost}-{row.push}</p>
                            <p className="text-[9px] text-on-surface-variant uppercase tracking-wider">Record</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ROI by Sport Chart */}
              <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-white/5">
                  <h3 className="font-['Space_Grotesk'] font-bold text-sm">ROI by Sport</h3>
                </div>
                <div className="flex-1 min-h-[250px] p-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.bySport.filter((s) => s.graded > 0)} margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                      <XAxis dataKey="sport" tick={{ fill: 'currentColor', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                      <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fill: 'currentColor', fontSize: 10 }} stroke="rgba(255,255,255,0.1)" />
                      <Tooltip
                        formatter={(value) => [`${(Number(value) * 100).toFixed(1)}%`, 'ROI']}
                        contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                      />
                      <Bar dataKey="roi" radius={[4, 4, 0, 0]}>
                        {data.bySport.filter((s) => s.graded > 0).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={(entry.roi ?? 0) >= 0 ? '#4ade80' : '#f87171'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Market Breakdown */}
          {data.byBetType.length > 0 && (
            <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-['Space_Grotesk'] font-bold text-sm">Performance by Market</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Market</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Picks</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Record</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Win %</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.byBetType.map((row) => {
                      const winPct = row.graded > 0 ? (row.won / row.graded) * 100 : 0;
                      return (
                        <tr key={row.betType} className="border-b border-white/5 last:border-0">
                          <td className="py-3 px-4">
                            <span className="font-bold text-sm capitalize">{row.betType}</span>
                          </td>
                          <td className="text-center py-3 px-4 text-sm">{row.total}</td>
                          <td className="text-center py-3 px-4 text-sm">{row.won}-{row.lost}-{row.push}</td>
                          <td className="text-center py-3 px-4">
                            <span className={cn('text-sm font-bold', winPct >= 55 ? 'text-tertiary' : winPct >= 50 ? 'text-kcm-yellow' : 'text-error')}>
                              {winPct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={cn('text-sm font-bold', (row.roi ?? 0) >= 0 ? 'text-tertiary' : 'text-error')}>
                              {row.roi != null ? `${row.roi >= 0 ? '+' : ''}${(row.roi * 100).toFixed(1)}%` : '--'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Calibration */}
          <CalibrationSection picks={data.picks} />

          {/* Picks Table */}
          <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-['Space_Grotesk'] font-bold text-sm">All Model Picks</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Game</th>
                    <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Pick</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Model</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">True Odds</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Edge</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">+EV</th>
                    <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Result</th>
                  </tr>
                </thead>
                <tbody>
                  {data.picks.map((pick) => (
                    <tr key={pick.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{sportEmojis[pick.sport] || '🏆'}</span>
                          <div>
                            <p className="text-sm font-bold truncate max-w-[180px]">
                              {pick.awayTeam} @ {pick.homeTeam}
                            </p>
                            <p className="text-[10px] text-on-surface-variant">
                              {pick.commenceTime ? formatGameDate(pick.commenceTime) : formatGameDate(pick.createdAt)} · {pick.commenceTime ? formatGameTime(pick.commenceTime) : formatGameTime(pick.createdAt)}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-sm font-bold">{pick.selection}</p>
                        <p className="text-[10px] text-on-surface-variant">{formatOdds(pick.odds)}</p>
                      </td>
                      <td className="text-center py-3 px-4">
                        <p className="text-sm font-bold">{pick.jevProbability != null ? `${(pick.jevProbability * 100).toFixed(1)}%` : '--'}</p>
                      </td>
                      <td className="text-center py-3 px-4">
                        <p className="text-sm font-bold">
                          {pick.fairProbability != null
                            ? formatOdds(Math.round((pick.fairProbability >= 0.5 ? -100 * (pick.fairProbability / (1 - pick.fairProbability)) : 100 * ((1 - pick.fairProbability) / pick.fairProbability))))
                            : '--'}
                        </p>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={cn('text-sm font-bold', (pick.edge ?? 0) >= 0 ? 'text-tertiary' : 'text-error')}>
                          {pick.edge != null ? `${pick.edge >= 0 ? '+' : ''}${pick.edge.toFixed(1)}pts` : '--'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <span className={cn('text-sm font-bold', (pick.expectedValue ?? 0) >= 0 ? 'text-tertiary' : 'text-error')}>
                          {pick.expectedValue != null ? `${pick.expectedValue >= 0 ? '+' : ''}${(pick.expectedValue * 100).toFixed(1)}%` : '--'}
                        </span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <StatusBadge status={pick.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function CalibrationSection({ picks }: { picks: HistoryEntry[] }) {
  const buckets: Record<string, { lower: number; upper: number; total: number; won: number }> = {
    '50-55%': { lower: 0.5, upper: 0.55, total: 0, won: 0 },
    '55-60%': { lower: 0.55, upper: 0.6, total: 0, won: 0 },
    '60-65%': { lower: 0.6, upper: 0.65, total: 0, won: 0 },
    '65-70%': { lower: 0.65, upper: 0.7, total: 0, won: 0 },
    '70-75%': { lower: 0.7, upper: 0.75, total: 0, won: 0 },
    '75-80%': { lower: 0.75, upper: 0.8, total: 0, won: 0 },
    '80%+': { lower: 0.8, upper: 1.01, total: 0, won: 0 },
  };

  for (const pick of picks) {
    if (pick.status !== 'won' && pick.status !== 'lost') continue;
    const prob = pick.jevProbability ?? pick.fairProbability;
    if (prob == null) continue;
    const bucket = Object.entries(buckets).find(([, { lower, upper }]) => prob >= lower && prob < upper);
    if (!bucket) continue;
    const key = bucket[0];
    buckets[key].total += 1;
    if (pick.status === 'won') buckets[key].won += 1;
  }

  const rows = Object.entries(buckets)
    .filter(([, { total }]) => total > 0)
    .map(([label, { total, won }]) => ({
      label,
      total,
      actual: (won / total) * 100,
      expected: (() => {
        const [low, high] = label.replace('%', '').split('-');
        if (high) return ((parseFloat(low) + parseFloat(high)) / 2);
        return parseFloat(low);
      })(),
    }));

  if (rows.length < 2) return null;

  return (
    <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden">
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center gap-2">
          <PieChart size={16} className="text-primary" />
          <h3 className="font-['Space_Grotesk'] font-bold text-sm">Model Calibration</h3>
        </div>
        <p className="text-[11px] text-on-surface-variant mt-1">
          Compare predicted probability to actual win rate. A well-calibrated model hits close to the diagonal.
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/5">
              <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Predicted</th>
              <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Picks</th>
              <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Actual Win %</th>
              <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Calibration</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const diff = row.actual - row.expected;
              return (
                <tr key={row.label} className="border-b border-white/5 last:border-0">
                  <td className="py-3 px-4 text-sm font-bold">{row.label}</td>
                  <td className="text-center py-3 px-4 text-sm">{row.total}</td>
                  <td className="text-center py-3 px-4">
                    <span className={cn('text-sm font-bold', row.actual >= row.expected ? 'text-tertiary' : 'text-error')}>
                      {row.actual.toFixed(1)}%
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden border border-white/5">
                        <div
                          className={cn('h-full rounded-full', diff >= -2 ? 'bg-tertiary' : diff >= -5 ? 'bg-kcm-yellow' : 'bg-error')}
                          style={{ width: `${Math.min(Math.max(row.actual, 0), 100)}%` }}
                        />
                      </div>
                      <span className={cn('text-[10px] font-bold w-12', diff >= -2 ? 'text-tertiary' : diff >= -5 ? 'text-kcm-yellow' : 'text-error')}>
                        {diff >= 0 ? '+' : ''}{diff.toFixed(1)}%
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { id: string; name: string }[];
  value: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex items-center gap-2 bg-surface-container-high rounded-xl px-3 py-2 border border-white/5">
      <Filter size={14} className="text-on-surface-variant" />
      <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-sm font-bold text-on-surface outline-none cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.id} value={opt.id} className="bg-surface-container-high">
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  positive,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <div className="bg-surface-container-high rounded-xl p-3 sm:p-4 border border-white/5">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">{label}</span>
      </div>
      <p
        className={cn(
          'text-xl sm:text-2xl font-["Space_Grotesk"] font-black',
          positive !== undefined ? (positive ? 'text-tertiary' : 'text-error') : 'text-on-surface'
        )}
      >
        {value}
      </p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-primary/10 text-primary border-primary/20',
    won: 'bg-tertiary/10 text-tertiary border-tertiary/20',
    lost: 'bg-error/10 text-error border-error/20',
    push: 'bg-kcm-yellow/10 text-kcm-yellow border-kcm-yellow/20',
    void: 'bg-surface-container-high text-on-surface-variant border-white/10',
  };

  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-bold uppercase border', styles[status] ?? styles.pending)}>
      {status}
    </span>
  );
}
