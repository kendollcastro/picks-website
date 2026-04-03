// ============================================
// KCMPICKS - AI Agent System
// Multi-agent system for sports betting analysis
// ============================================

export { BaseAgent, type AgentMessage, type AgentContext } from './types';
import { BaseAgent, type AgentMessage, type AgentContext } from './types';

// ============================================
// 1. PREDICTION AGENT
// Analyzes odds and generates predictions
// ============================================
export class PredictionAgent extends BaseAgent {
  name = 'PredictionAgent';
  description = 'Analyzes odds and generates game predictions';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds || context.odds.length === 0) {
      return messages;
    }

    for (const game of context.odds) {
      const prediction = this.analyzeOdds(game);

      if (prediction.edge > 5) {
        messages.push(this.createMessage(
          'prediction',
          `🎯 High Value: ${prediction.pickTeam}`,
          `${prediction.pickTeam} ML shows ${prediction.edge.toFixed(1)}% edge. ` +
          `Win probability: ${prediction.winProb.toFixed(0)}%. ` +
          `Odds: ${prediction.odds > 0 ? '+' : ''}${prediction.odds}. ` +
          `${prediction.reasoning}`,
          prediction.confidence,
          {
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            pickTeam: prediction.pickTeam,
            odds: prediction.odds,
            edge: prediction.edge,
            winProb: prediction.winProb,
          },
          {
            label: 'Take This Pick',
            type: 'pick',
            payload: {
              team: prediction.pickTeam,
              odds: prediction.odds,
              type: 'moneyline',
            },
          }
        ));
      }
    }

    // Sort by confidence
    return messages.sort((a, b) => b.confidence - a.confidence);
  }

  private analyzeOdds(game: NonNullable<AgentContext['odds']>[0]) {
    const homeImplied = game.homeMoneyline > 0
      ? 100 / (game.homeMoneyline + 100)
      : Math.abs(game.homeMoneyline) / (Math.abs(game.homeMoneyline) + 100);

    const awayImplied = game.awayMoneyline > 0
      ? 100 / (game.awayMoneyline + 100)
      : Math.abs(game.awayMoneyline) / (Math.abs(game.awayMoneyline) + 100);

    const total = homeImplied + awayImplied;
    let homeProb = (homeImplied / total) * 100 + 3; // Home advantage
    let awayProb = (awayImplied / total) * 100 - 3;

    const totalProb = homeProb + awayProb;
    homeProb = (homeProb / totalProb) * 100;
    awayProb = (awayProb / totalProb) * 100;

    const pickTeam = homeProb > awayProb ? game.homeTeam : game.awayTeam;
    const pickOdds = homeProb > awayProb ? game.homeMoneyline : game.awayMoneyline;
    const winProb = Math.max(homeProb, awayProb);
    const edge = winProb - (homeProb > awayProb ? homeImplied * 100 : awayImplied * 100);

    let confidence = 0.5;
    if (edge > 10) confidence = 0.95;
    else if (edge > 7) confidence = 0.85;
    else if (edge > 5) confidence = 0.75;
    else if (edge > 3) confidence = 0.65;

    let reasoning = 'Standard moneyline analysis';
    if (edge > 10) reasoning = 'Strong value play - odds are mispriced';
    else if (edge > 7) reasoning = 'Good value - bookmakers may be undervaluing this team';
    else if (edge > 5) reasoning = 'Moderate edge detected';

    return { pickTeam, odds: pickOdds, winProb, edge, confidence, reasoning };
  }
}

// ============================================
// 2. PERFORMANCE ANALYSIS AGENT
// Analyzes user's betting history and patterns
// ============================================
export class PerformanceAgent extends BaseAgent {
  name = 'PerformanceAgent';
  description = 'Analyzes betting patterns and performance';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.currentPicks || context.currentPicks.length < 5) {
      messages.push(this.createMessage(
        'insight',
        '📊 Getting Started',
        'Place at least 5 picks to unlock detailed performance analysis. ' +
        'The more data we have, the better insights we can provide!',
        1.0
      ));
      return messages;
    }

    const picks = context.currentPicks;
    const settled = picks.filter(p => p.status !== 'pending');
    const wins = settled.filter(p => p.status === 'won').length;
    const _losses = settled.filter(p => p.status === 'lost').length;
    const winRate = settled.length > 0 ? (wins / settled.length) * 100 : 0;

    // Win rate analysis
    if (winRate >= 60) {
      messages.push(this.createMessage(
        'analysis',
        '🔥 Hot Streak Alert',
        `Your win rate is ${winRate.toFixed(1)}% - well above average! ` +
        `You've won ${wins} of your last ${settled.length} picks. ` +
        `Consider maintaining your current strategy.`,
        0.9
      ));
    } else if (winRate < 45 && settled.length >= 10) {
      messages.push(this.createMessage(
        'analysis',
        '⚠️ Strategy Review',
        `Your win rate is ${winRate.toFixed(1)}% over ${settled.length} picks. ` +
        `Consider focusing on higher-confidence plays or adjusting your bankroll management.`,
        0.85
      ));
    }

    // Sport-specific analysis
    const sportStats = this.analyzeSportPerformance(picks);
    for (const [sport, stats] of Object.entries(sportStats)) {
      if (stats.total >= 5) {
        const sportWinRate = (stats.wins / stats.settled) * 100;
        if (sportWinRate >= 65) {
          messages.push(this.createMessage(
            'insight',
            `💪 Strong in ${sport.toUpperCase()}`,
            `You're ${sportWinRate.toFixed(0)}% in ${sport.toUpperCase()} (${stats.wins}W-${stats.losses}L). ` +
            `This is your best sport - consider focusing more picks here.`,
            0.9
          ));
        } else if (sportWinRate < 40 && stats.settled >= 5) {
          messages.push(this.createMessage(
            'insight',
            `🎯 ${sport.toUpperCase()} Needs Work`,
            `You're ${sportWinRate.toFixed(0)}% in ${sport.toUpperCase()} (${stats.wins}W-${stats.losses}L). ` +
            `Consider reducing stakes or skipping this sport until you find better spots.`,
            0.85
          ));
        }
      }
    }

    // Streak analysis
    const streak = this.calculateStreak(picks);
    if (streak.count >= 3) {
      if (streak.type === 'win') {
        messages.push(this.createMessage(
          'alert',
          `🔥 ${streak.count}-Game Win Streak!`,
          `You're on fire! ${streak.count} wins in a row. ` +
          `Stay disciplined and don't let the streak affect your judgment.`,
          1.0
        ));
      } else {
        messages.push(this.createMessage(
          'alert',
          `❄️ ${streak.count}-Game Losing Streak`,
          `Tough stretch with ${streak.count} losses in a row. ` +
          `Consider taking a break or reducing your stake size until you get back on track.`,
          1.0
        ));
      }
    }

    return messages;
  }

  private analyzeSportPerformance(picks: NonNullable<AgentContext['currentPicks']>) {
    const stats: Record<string, { total: number; wins: number; losses: number; settled: number }> = {};

    for (const pick of picks) {
      if (!stats[pick.sport]) {
        stats[pick.sport] = { total: 0, wins: 0, losses: 0, settled: 0 };
      }
      stats[pick.sport].total++;
      if (pick.status === 'won') {
        stats[pick.sport].wins++;
        stats[pick.sport].settled++;
      } else if (pick.status === 'lost') {
        stats[pick.sport].losses++;
        stats[pick.sport].settled++;
      }
    }

    return stats;
  }

  private calculateStreak(picks: NonNullable<AgentContext['currentPicks']>) {
    let count = 0;
    let type: 'win' | 'loss' = 'win';

    for (const pick of picks) {
      if (pick.status === 'pending' || pick.status === 'push') continue;

      if (count === 0) {
        type = pick.status === 'won' ? 'win' : 'loss';
        count = 1;
      } else if (
        (type === 'win' && pick.status === 'won') ||
        (type === 'loss' && pick.status === 'lost')
      ) {
        count++;
      } else {
        break;
      }
    }

    return { count, type };
  }
}

// ============================================
// 3. RECOMMENDATION AGENT
// Suggests optimal picks based on user profile
// ============================================
export class RecommendationAgent extends BaseAgent {
  name = 'RecommendationAgent';
  description = 'Suggests picks based on user patterns and current value';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds || context.odds.length === 0) {
      return messages;
    }

    // Analyze user's best sports
    const bestSports = this.getBestSports(context.currentPicks || []);

    for (const game of context.odds) {
      // Check if this is a user's strong sport
      const sport = this.detectSport(game);
      const isStrongSport = bestSports.includes(sport);

      const prediction = this.quickAnalyze(game);

      if (prediction.edge > 3 && isStrongSport) {
        messages.push(this.createMessage(
          'recommendation',
          `⭐ Recommended: ${prediction.pickTeam}`,
          `This pick is in ${sport.toUpperCase()}, one of your strongest sports. ` +
          `Edge: ${prediction.edge.toFixed(1)}%. ` +
          `Based on your history, you perform well in this league.`,
          0.85,
          {
            homeTeam: game.homeTeam,
            awayTeam: game.awayTeam,
            pickTeam: prediction.pickTeam,
            odds: prediction.odds,
            sport,
          },
          {
            label: 'View Pick',
            type: 'view',
          }
        ));
      }
    }

    return messages.slice(0, 3); // Top 3 recommendations
  }

  private getBestSports(picks: NonNullable<AgentContext['currentPicks']>): string[] {
    const sportStats: Record<string, { wins: number; total: number }> = {};

    for (const pick of picks) {
      if (!sportStats[pick.sport]) {
        sportStats[pick.sport] = { wins: 0, total: 0 };
      }
      sportStats[pick.sport].total++;
      if (pick.status === 'won') {
        sportStats[pick.sport].wins++;
      }
    }

    return Object.entries(sportStats)
      .filter(([, stats]) => stats.total >= 3 && (stats.wins / stats.total) >= 0.55)
      .map(([sport]) => sport);
  }

  private detectSport(game: NonNullable<AgentContext['odds']>[0]): string {
    // Simple sport detection based on team names
    const teams = `${game.homeTeam} ${game.awayTeam}`.toLowerCase();

    if (teams.includes('lakers') || teams.includes('celtics') || teams.includes('warriors')) return 'nba';
    if (teams.includes('chiefs') || teams.includes('eagles') || teams.includes('cowboys')) return 'nfl';
    if (teams.includes('yankees') || teams.includes('dodgers')) return 'mlb';
    if (teams.includes('united') || teams.includes('city') || teams.includes('fc')) return 'soccer';

    return 'nba'; // Default
  }

  private quickAnalyze(game: NonNullable<AgentContext['odds']>[0]) {
    const homeImplied = game.homeMoneyline > 0
      ? 100 / (game.homeMoneyline + 100)
      : Math.abs(game.homeMoneyline) / (Math.abs(game.homeMoneyline) + 100);

    const awayImplied = game.awayMoneyline > 0
      ? 100 / (game.awayMoneyline + 100)
      : Math.abs(game.awayMoneyline) / (Math.abs(game.awayMoneyline) + 100);

    const total = homeImplied + awayImplied;
    const homeProb = (homeImplied / total) * 100 + 3;
    const awayProb = (100 - homeProb);

    const pickTeam = homeProb > 50 ? game.homeTeam : game.awayTeam;
    const pickOdds = homeProb > 50 ? game.homeMoneyline : game.awayMoneyline;
    const winProb = Math.max(homeProb, awayProb);
    const edge = winProb - Math.max(homeImplied, awayImplied) * 100;

    return { pickTeam, odds: pickOdds, winProb, edge };
  }
}

// ============================================
// 4. ALERT AGENT
// Monitors live games and sends alerts
// ============================================
export class AlertAgent extends BaseAgent {
  name = 'AlertAgent';
  description = 'Monitors games and sends real-time alerts';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.liveGames || !context.currentPicks) {
      return messages;
    }

    // Check user's pending picks against live games
    const pendingPicks = context.currentPicks.filter(p => p.status === 'pending');

    for (const pick of pendingPicks) {
      const game = context.liveGames.find(g =>
        g.homeTeam.toLowerCase().includes(pick.home_team.toLowerCase()) ||
        g.awayTeam.toLowerCase().includes(pick.away_team.toLowerCase())
      );

      if (game && game.isLive) {
        const isWinning = this.isPickWinning(pick, game);

        if (isWinning === true) {
          messages.push(this.createMessage(
            'alert',
            `✅ ${pick.selection} - Looking Good!`,
            `Your pick on ${pick.selection} is currently winning. ` +
            `${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}.`,
            1.0,
            { pickId: pick.id, gameId: game.id }
          ));
        } else if (isWinning === false) {
          messages.push(this.createMessage(
            'alert',
            `⚠️ ${pick.selection} - Behind`,
            `Your pick on ${pick.selection} is currently behind. ` +
            `${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}. Still time to turn it around!`,
            1.0,
            { pickId: pick.id, gameId: game.id }
          ));
        }
      }
    }

    return messages;
  }

  private isPickWinning(
    pick: NonNullable<AgentContext['currentPicks']>[0],
    game: NonNullable<AgentContext['liveGames']>[0]
  ): boolean | null {
    const pickedHome = pick.selection.toLowerCase().includes(pick.home_team.toLowerCase());

    if (pickedHome) {
      return game.homeScore > game.awayScore;
    } else {
      return game.awayScore > game.homeScore;
    }
  }
}

// ============================================
// 5. BANKROLL AGENT
// Monitors bankroll and suggests stake sizes
// ============================================
export class BankrollAgent extends BaseAgent {
  name = 'BankrollAgent';
  description = 'Monitors bankroll and stake management';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.currentPicks || context.currentPicks.length < 3) {
      return messages;
    }

    const picks = context.currentPicks;
    const settled = picks.filter(p => p.status !== 'pending');

    // Calculate stats
    let totalStaked = 0;
    let totalProfit = 0;

    for (const pick of settled) {
      totalStaked += pick.stake;
      if (pick.status === 'won') {
        totalProfit += (pick.stake * (pick.odds > 0 ? pick.odds / 100 : 100 / Math.abs(pick.odds)));
      } else if (pick.status === 'lost') {
        totalProfit -= pick.stake;
      }
    }

    const roi = totalStaked > 0 ? (totalProfit / totalStaked) * 100 : 0;

    // Stake consistency check
    const stakes = picks.map(p => p.stake);
    const avgStake = stakes.reduce((a, b) => a + b, 0) / stakes.length;
    const maxStake = Math.max(...stakes);
    const _minStake = Math.min(...stakes);

    if (maxStake > avgStake * 3) {
      messages.push(this.createMessage(
        'insight',
        '💰 Stake Management Alert',
        `Your largest stake ($${maxStake}) is ${((maxStake / avgStake) * 100).toFixed(0)}% of your average ($${avgStake.toFixed(0)}). ` +
        `Consistent stake sizing helps manage risk. Consider keeping stakes within 1-2x your average.`,
        0.85
      ));
    }

    // ROI warning
    if (roi < -10 && settled.length >= 10) {
      messages.push(this.createMessage(
        'alert',
        '📉 Negative ROI Warning',
        `Your ROI is ${roi.toFixed(1)}% over ${settled.length} picks. ` +
        `Consider reducing your stake size until you find your edge. ` +
        `Current loss: $${Math.abs(totalProfit).toFixed(2)}`,
        0.9
      ));
    }

    return messages;
  }
}

// ============================================
// AGENT MANAGER
// Coordinates all agents
// ============================================

// Import advanced agents
import { advancedAgents } from './advanced';
import { devAgents } from './devops';

export class AgentManager {
  private agents: BaseAgent[] = [
    // Core agents
    new PredictionAgent(),
    new PerformanceAgent(),
    new RecommendationAgent(),
    new AlertAgent(),
    new BankrollAgent(),
    // Advanced agents
    ...advancedAgents,
    // Development agents
    ...devAgents,
  ];

  async runAll(context: AgentContext): Promise<AgentMessage[]> {
    const allMessages: AgentMessage[] = [];

    for (const agent of this.agents) {
      try {
        const messages = await agent.process(context);
        allMessages.push(...messages);
      } catch (error) {
        console.error(`Error in ${agent.name}:`, error);
      }
    }

    // Sort by confidence and timestamp
    return allMessages.sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return b.timestamp.getTime() - a.timestamp.getTime();
    });
  }

  async runAgent(agentName: string, context: AgentContext): Promise<AgentMessage[]> {
    const agent = this.agents.find(a => a.name === agentName);
    if (!agent) return [];

    try {
      return await agent.process(context);
    } catch (error) {
      console.error(`Error in ${agent.name}:`, error);
      return [];
    }
  }

  getAgents() {
    return this.agents.map(a => ({
      name: a.name,
      description: a.description,
    }));
  }
}

// Export singleton
export const agentManager = new AgentManager();
