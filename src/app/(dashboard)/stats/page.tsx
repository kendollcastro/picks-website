'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { usePicks, type Pick } from '@/hooks/usePicks';
import { useUser } from '@/contexts/UserContext';
import {
  TrendingUp,
  Target,
  DollarSign,
  BarChart3,
  Flame,
  Loader2,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts';

type TimeFilter = 'week' | 'month' | '3months' | 'all';

const sportEmojis: Record<string, string> = {
  nba: '🏀', nfl: '🏈', mlb: '⚾', soccer: '⚽', ufc: '🥊',
  'college-football': '🏟️', 'college-basketball': '🎓', 'womens-basketball': '👩‍🏀',
};

export default function StatsPage() {
  const { user, loading: userLoading } = useUser();
  const { picks, loading } = usePicks();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');

  const filterPicksByTime = (picksData: Pick[]): Pick[] => {
    if (timeFilter === 'all') return picksData;
    
    const now = new Date();
    let startDate: Date;
    
    switch (timeFilter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '3months':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        return picksData;
    }
    
    return picksData.filter(pick => new Date(pick.created_at) >= startDate);
  };

  const filteredPicks = filterPicksByTime(picks);
  
  const calculateStatsFromPicks = (picksData: Pick[]) => {
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
    };
  };

  const timeFilteredStats = calculateStatsFromPicks(filteredPicks);

  const generateProfitData = () => {
    const weeklyData: Record<string, { profit: number; count: number }> = {};
    
    filteredPicks.forEach(pick => {
      const date = new Date(pick.created_at);
      const weekKey = `${date.getFullYear()}-W${Math.ceil(date.getDate() / 7)}`;
      
      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { profit: 0, count: 0 };
      }
      
      if (pick.status === 'won') {
        weeklyData[weekKey].profit += pick.potential_payout - pick.stake;
      } else if (pick.status === 'lost') {
        weeklyData[weekKey].profit -= pick.stake;
      }
      weeklyData[weekKey].count++;
    });
    
    const sortedWeeks = Object.entries(weeklyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-8);
    
    let cumulative = 0;
    return sortedWeeks.map(([week, data]) => {
      cumulative += data.profit;
      return {
        date: week,
        profit: Math.round(data.profit),
        cumulative: Math.round(cumulative),
        picks: data.count,
      };
    });
  };

  const generateMonthlyData = () => {
    const monthlyData: Record<string, number> = {};
    
    filteredPicks.forEach(pick => {
      const date = new Date(pick.created_at);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short' });
      
      if (pick.status === 'won') {
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (pick.potential_payout - pick.stake);
      } else if (pick.status === 'lost') {
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) - pick.stake;
      }
    });
    
    return Object.entries(monthlyData).map(([month, profit]) => ({
      month,
      profit: Math.round(profit),
    }));
  };

  const generateSportStats = () => {
    const sportMap: Record<string, { wins: number; losses: number; pushes: number; profit: number; total: number }> = {};
    
    filteredPicks
      .filter(p => p.status !== 'pending' && p.status !== 'void')
      .forEach(pick => {
        if (!sportMap[pick.sport]) {
          sportMap[pick.sport] = { wins: 0, losses: 0, pushes: 0, profit: 0, total: 0 };
        }
        sportMap[pick.sport].total++;
        
        if (pick.status === 'won') {
          sportMap[pick.sport].wins++;
          sportMap[pick.sport].profit += pick.potential_payout - pick.stake;
        } else if (pick.status === 'lost') {
          sportMap[pick.sport].losses++;
          sportMap[pick.sport].profit -= pick.stake;
        } else if (pick.status === 'push') {
          sportMap[pick.sport].pushes++;
        }
      });
    
    return Object.entries(sportMap).map(([sport, data]) => ({
      sport,
      emoji: sportEmojis[sport] || '🏆',
      name: sport,
      picks: data.total,
      wins: data.wins,
      losses: data.losses,
      pushes: data.pushes,
      profit: data.profit,
      roi: data.total > 0 ? (data.profit / filteredPicks.filter(p => p.sport === sport).reduce((sum, p) => sum + p.stake, 0)) * 100 : 0,
    }));
  };

  const generatePickTypeStats = () => {
    const typeMap: Record<string, { wins: number; losses: number; profit: number; total: number }> = {};
    
    filteredPicks
      .filter(p => p.status !== 'pending' && p.status !== 'void')
      .forEach(pick => {
        const type = pick.pick_type || 'other';
        if (!typeMap[type]) {
          typeMap[type] = { wins: 0, losses: 0, profit: 0, total: 0 };
        }
        typeMap[type].total++;
        
        if (pick.status === 'won') {
          typeMap[type].wins++;
          typeMap[type].profit += pick.potential_payout - pick.stake;
        } else if (pick.status === 'lost') {
          typeMap[type].losses++;
          typeMap[type].profit -= pick.stake;
        }
      });
    
    return Object.entries(typeMap).map(([type, data]) => ({
      type,
      picks: data.total,
      wins: data.wins,
      winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0,
      profit: data.profit,
    }));
  };

  const profitData = generateProfitData();
  const monthlyData = generateMonthlyData();
  const sportStatsData = generateSportStats();
  const pickTypeStatsData = generatePickTypeStats();

  const timeFilters: { value: TimeFilter; label: string }[] = [
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: '3months', label: '3 Months' },
    { value: 'all', label: 'All Time' },
  ];

  if (userLoading || loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Target size={48} className="text-on-surface-variant mb-4" />
        <p className="text-on-surface-variant">Please log in to view your statistics</p>
      </div>
    );
  }

  const hasData = picks.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-['Space_Grotesk'] text-xl sm:text-2xl font-bold">Statistics</h1>
          <p className="text-on-surface-variant text-sm mt-1">Deep dive into your performance</p>
        </div>
        <div className="flex gap-2">
          {timeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTimeFilter(f.value)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-bold transition-colors',
                timeFilter === f.value
                  ? 'bg-primary-container text-on-primary-container'
                  : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-variant'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {!hasData ? (
        <div className="bg-surface-container-high rounded-xl p-12 text-center border border-white/5">
          <BarChart3 size={48} className="mx-auto text-on-surface-variant mb-4" />
          <p className="font-['Space_Grotesk'] font-bold text-lg">No data yet</p>
          <p className="text-on-surface-variant text-sm mt-2">Start taking picks to see your statistics!</p>
        </div>
      ) : (
        <>
          {/* Overview Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <StatCard 
              icon={<Target size={18} className="text-primary" />} 
              label="Total Picks" 
              value={timeFilteredStats.total_picks.toString()} 
            />
            <StatCard 
              icon={<TrendingUp size={18} className="text-tertiary" />} 
              label="Win Rate" 
              value={`${timeFilteredStats.win_rate.toFixed(1)}%`} 
            />
            <StatCard 
              icon={<BarChart3 size={18} className="text-secondary" />} 
              label="Record" 
              value={`${timeFilteredStats.wins}-${timeFilteredStats.losses}`} 
            />
            <StatCard 
              icon={<DollarSign size={18} className="text-tertiary" />} 
              label="Profit" 
              value={`+$${timeFilteredStats.total_profit.toFixed(0)}`} 
              positive={timeFilteredStats.total_profit >= 0}
            />
            <StatCard 
              icon={<Flame size={18} className="text-kcm-orange" />} 
              label="Avg ROI" 
              value={`+${timeFilteredStats.roi.toFixed(1)}%`} 
              positive={timeFilteredStats.roi >= 0}
            />
          </div>

          {/* Charts */}
          {profitData.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Cumulative Profit Chart */}
              <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-white/5">
                <h3 className="font-['Space_Grotesk'] font-bold text-sm mb-4">Cumulative Profit</h3>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={profitData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                      <XAxis dataKey="date" stroke="#71717A" fontSize={10} />
                      <YAxis stroke="#71717A" fontSize={10} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1A1A25',
                          border: '1px solid #27272A',
                          borderRadius: '8px',
                          color: '#F5F5F7',
                          fontSize: '12px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cumulative"
                        stroke="#0066FF"
                        strokeWidth={2}
                        dot={{ fill: '#0066FF', r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Monthly Profit Chart */}
              {monthlyData.length > 0 && (
                <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-white/5">
                  <h3 className="font-['Space_Grotesk'] font-bold text-sm mb-4">Monthly Profit</h3>
                  <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#27272A" />
                        <XAxis dataKey="month" stroke="#71717A" fontSize={10} />
                        <YAxis stroke="#71717A" fontSize={10} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#1A1A25',
                            border: '1px solid #27272A',
                            borderRadius: '8px',
                            color: '#F5F5F7',
                            fontSize: '12px',
                          }}
                        />
                        <Bar dataKey="profit" fill="#0066FF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Sport Performance Table */}
          {sportStatsData.length > 0 && (
            <div className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden">
              <div className="p-4 border-b border-white/5">
                <h3 className="font-['Space_Grotesk'] font-bold text-sm">Performance by Sport</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Sport</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Picks</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Record</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Win %</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">Profit</th>
                      <th className="text-center py-3 px-4 text-[10px] font-bold text-on-surface-variant uppercase tracking-widest">ROI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sportStatsData.map((sport) => {
                      const winPct = sport.picks > 0 ? ((sport.wins / sport.picks) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={sport.sport} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <span className="text-lg">{sport.emoji}</span>
                              <span className="font-bold text-sm">{sport.name}</span>
                            </div>
                          </td>
                          <td className="text-center py-3 px-4 text-sm">{sport.picks}</td>
                          <td className="text-center py-3 px-4 text-sm">{sport.wins}-{sport.losses}-{sport.pushes}</td>
                          <td className="text-center py-3 px-4">
                            <span className={cn(
                              'text-sm font-bold',
                              parseFloat(winPct) >= 55 ? 'text-tertiary' : parseFloat(winPct) >= 50 ? 'text-kcm-yellow' : 'text-error'
                            )}>
                              {winPct}%
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={cn('text-sm font-bold', sport.profit >= 0 ? 'text-tertiary' : 'text-error')}>
                              {sport.profit >= 0 ? '+' : ''}${sport.profit.toFixed(0)}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={cn('text-sm font-bold', sport.roi >= 0 ? 'text-tertiary' : 'text-error')}>
                              {sport.roi >= 0 ? '+' : ''}{sport.roi.toFixed(1)}%
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

          {/* Pick Type Performance */}
          {pickTypeStatsData.length > 0 && (
            <div className="bg-surface-container-high rounded-xl p-4 sm:p-5 border border-white/5">
              <h3 className="font-['Space_Grotesk'] font-bold text-sm mb-4">Performance by Pick Type</h3>
              <div className="space-y-4">
                {pickTypeStatsData.map((type) => (
                  <div key={type.type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-bold w-20">{type.type}</span>
                        <span className="text-[10px] text-on-surface-variant">{type.picks} picks</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-sm">{type.winRate.toFixed(0)}%</span>
                        <span className={cn('text-sm font-bold', type.profit >= 0 ? 'text-tertiary' : 'text-error')}>
                          {type.profit >= 0 ? '+' : ''}${type.profit.toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          type.winRate >= 55 ? 'bg-tertiary' : type.winRate >= 50 ? 'bg-kcm-yellow' : 'bg-error'
                        )}
                        style={{ width: `${type.winRate}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
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
      <p className={cn(
        'text-xl sm:text-2xl font-["Space_Grotesk"] font-black',
        positive !== undefined ? (positive ? 'text-tertiary' : 'text-error') : 'text-on-surface'
      )}>
        {value}
      </p>
    </div>
  );
}