'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn, formatOdds } from '@/lib/utils';
import { SPORTS } from '@/lib/constants/sports';
import { SportType } from '@/types';

const mockMatches: Record<string, Array<{
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'scheduled' | 'live' | 'final';
  time: string;
  homeOdds: number;
  awayOdds: number;
  spread: number;
  total: number;
  league: string;
}>> = {
  nba: [
    { id: '1', homeTeam: 'Lakers', awayTeam: 'Warriors', homeScore: 87, awayScore: 92, status: 'live', time: 'Q3 4:23', homeOdds: 150, awayOdds: -175, spread: -3.5, total: 224.5, league: 'NBA' },
    { id: '2', homeTeam: 'Celtics', awayTeam: 'Bucks', homeScore: null, awayScore: null, status: 'scheduled', time: '7:30 PM', homeOdds: -130, awayOdds: 110, spread: -2.5, total: 218.5, league: 'NBA' },
    { id: '3', homeTeam: 'Nuggets', awayTeam: 'Suns', homeScore: null, awayScore: null, status: 'scheduled', time: '10:00 PM', homeOdds: -180, awayOdds: 155, spread: -4.5, total: 232.5, league: 'NBA' },
    { id: '4', homeTeam: 'Heat', awayTeam: '76ers', homeScore: 112, awayScore: 108, status: 'final', time: 'Final', homeOdds: -110, awayOdds: -110, spread: -1.5, total: 215.5, league: 'NBA' },
  ],
  nfl: [
    { id: '1', homeTeam: 'Chiefs', awayTeam: '49ers', homeScore: null, awayScore: null, status: 'scheduled', time: 'Sunday 4:25 PM', homeOdds: -150, awayOdds: 130, spread: -3, total: 48.5, league: 'NFL' },
    { id: '2', homeTeam: 'Eagles', awayTeam: 'Cowboys', homeScore: null, awayScore: null, status: 'scheduled', time: 'Sunday 8:20 PM', homeOdds: -120, awayOdds: 100, spread: -2, total: 51.5, league: 'NFL' },
  ],
  mlb: [
    { id: '1', homeTeam: 'Yankees', awayTeam: 'Dodgers', homeScore: null, awayScore: null, status: 'scheduled', time: '7:05 PM', homeOdds: -115, awayOdds: -105, spread: -1.5, total: 8.5, league: 'MLB' },
  ],
  soccer: [
    { id: '1', homeTeam: 'Man City', awayTeam: 'Liverpool', homeScore: 1, awayScore: 2, status: 'live', time: "78'", homeOdds: 250, awayOdds: -120, spread: 0.5, total: 2.5, league: 'Premier League' },
    { id: '2', homeTeam: 'Real Madrid', awayTeam: 'Barcelona', homeScore: null, awayScore: null, status: 'scheduled', time: '3:00 PM', homeOdds: 120, awayOdds: 180, spread: -0.5, total: 2.5, league: 'La Liga' },
  ],
  ufc: [
    { id: '1', homeTeam: 'Fighter A', awayTeam: 'Fighter B', homeScore: null, awayScore: null, status: 'scheduled', time: 'Saturday 10:00 PM', homeOdds: -200, awayOdds: 170, spread: 0, total: 1.5, league: 'UFC 300' },
  ],
  'college-football': [
    { id: '1', homeTeam: 'Alabama', awayTeam: 'Georgia', homeScore: null, awayScore: null, status: 'scheduled', time: 'Saturday 3:30 PM', homeOdds: 120, awayOdds: -140, spread: 3, total: 55.5, league: 'SEC' },
  ],
  'college-basketball': [
    { id: '1', homeTeam: 'Duke', awayTeam: 'UNC', homeScore: 42, awayScore: 38, status: 'live', time: 'HT', homeOdds: -150, awayOdds: 130, spread: -4.5, total: 152.5, league: 'ACC' },
    { id: '2', homeTeam: 'Kentucky', awayTeam: 'Kansas', homeScore: null, awayScore: null, status: 'scheduled', time: '9:00 PM', homeOdds: -110, awayOdds: -110, spread: -1, total: 148.5, league: 'Big 12/SEC Challenge' },
  ],
  'womens-basketball': [
    { id: '1', homeTeam: 'Aces', awayTeam: 'Liberty', homeScore: 65, awayScore: 58, status: 'live', time: 'Q3 2:15', homeOdds: -200, awayOdds: 170, spread: -5.5, total: 168.5, league: 'WNBA' },
  ],
};

export default function SportPage() {
  const params = useParams();
  const sportId = params.sport as string;
  const sport = SPORTS[sportId as SportType];
  const matches = mockMatches[sportId] || [];
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'live' | 'scheduled'>('all');

  const filteredMatches = matches.filter(
    (match) => selectedFilter === 'all' || match.status === selectedFilter
  );

  const liveCount = matches.filter((m) => m.status === 'live').length;

  if (!sport) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-foreground-muted">Sport not found</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="text-5xl">{sport.icon}</div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground">
              {sport.name}
            </h1>
            <p className="text-foreground-muted mt-1">
              {matches.length} games • {liveCount > 0 && <span className="text-kcm-red">{liveCount} live</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setSelectedFilter('all')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              selectedFilter === 'all'
                ? 'bg-kcm-blue text-white'
                : 'bg-background-card text-foreground-secondary hover:bg-background-hover'
            )}
          >
            All Games
          </button>
          <button
            onClick={() => setSelectedFilter('live')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              selectedFilter === 'live'
                ? 'bg-kcm-red text-white'
                : 'bg-background-card text-foreground-secondary hover:bg-background-hover'
            )}
          >
            Live ({liveCount})
          </button>
          <button
            onClick={() => setSelectedFilter('scheduled')}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              selectedFilter === 'scheduled'
                ? 'bg-kcm-purple text-white'
                : 'bg-background-card text-foreground-secondary hover:bg-background-hover'
            )}
          >
            Upcoming
          </button>
        </div>
      </div>

      {/* Games List */}
      <div className="space-y-4">
        {filteredMatches.map((match, index) => (
          <motion.div
            key={match.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden">
              {/* League Header */}
              <div className="px-4 py-2 bg-background-secondary border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{match.league}</span>
                  {match.status === 'live' && (
                    <Badge variant="danger" size="sm" className="animate-pulse-live">LIVE</Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Clock size={14} />
                  <span className="text-xs">{match.time}</span>
                </div>
              </div>

              {/* Match Content */}
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  {/* Away Team */}
                  <div className="flex-1">
                    <p className="text-lg font-bold text-foreground">{match.awayTeam}</p>
                    {match.awayScore !== null && (
                      <p className={cn(
                        'text-3xl font-bold mt-1',
                        match.status === 'live' && match.awayScore > (match.homeScore || 0) && 'text-kcm-green'
                      )}>
                        {match.awayScore}
                      </p>
                    )}
                  </div>

                  {/* VS */}
                  <div className="px-6">
                    <span className="text-xl font-bold text-foreground-muted">
                      {match.status === 'live' || match.status === 'final' ? '' : '@'}
                    </span>
                  </div>

                  {/* Home Team */}
                  <div className="flex-1 text-right">
                    <p className="text-lg font-bold text-foreground">{match.homeTeam}</p>
                    {match.homeScore !== null && (
                      <p className={cn(
                        'text-3xl font-bold mt-1',
                        match.status === 'live' && (match.homeScore || 0) > (match.awayScore || 0) && 'text-kcm-green'
                      )}>
                        {match.homeScore}
                      </p>
                    )}
                  </div>
                </div>

                {/* Odds Row */}
                <div className="grid grid-cols-4 gap-4 mt-6 pt-4 border-t border-border">
                  <div className="text-center">
                    <p className="text-xs text-foreground-muted mb-2">Moneyline</p>
                    <div className="flex justify-center gap-4">
                      <span className={cn('text-sm font-medium', match.awayOdds > 0 ? 'text-kcm-green' : 'text-foreground')}>
                        {formatOdds(match.awayOdds)}
                      </span>
                      <span className="text-foreground-muted">|</span>
                      <span className={cn('text-sm font-medium', match.homeOdds > 0 ? 'text-kcm-green' : 'text-foreground')}>
                        {formatOdds(match.homeOdds)}
                      </span>
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-foreground-muted mb-2">Spread</p>
                    <span className="text-sm font-medium text-foreground">
                      {match.spread > 0 ? '+' : ''}{match.spread}
                    </span>
                  </div>

                  <div className="text-center">
                    <p className="text-xs text-foreground-muted mb-2">Total</p>
                    <span className="text-sm font-medium text-foreground">
                      O/U {match.total}
                    </span>
                  </div>

                  {/* Add Pick button hidden for now */}
                  {/* <div className="text-center">
                    <Button size="sm">
                      <Plus size={14} />
                      Add Pick
                    </Button>
                  </div> */}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}

        {filteredMatches.length === 0 && (
          <Card className="p-12 text-center">
            <p className="text-foreground-muted">No games found for this filter.</p>
            <Button variant="secondary" className="mt-4" onClick={() => setSelectedFilter('all')}>
              View All Games
            </Button>
          </Card>
        )}
      </div>
    </motion.div>
  );
}
