// ============================================
// KCMPICKS - Advanced AI Agents
// Additional agents for enhanced betting intelligence
// ============================================

import { BaseAgent, type AgentMessage, type AgentContext } from './types';

// ============================================
// 6. LINE MOVEMENT AGENT
// Tracks odds changes and detects sharp money
// ============================================
export class LineMovementAgent extends BaseAgent {
  name = 'LineMovementAgent';
  description = 'Tracks odds movement and detects sharp money';

  private previousOdds: Map<string, { home: number; away: number; timestamp: Date }> = new Map();

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds || context.odds.length === 0) return messages;

    for (const game of context.odds) {
      const key = `${game.homeTeam}-${game.awayTeam}`;
      const current = {
        home: game.homeMoneyline,
        away: game.awayMoneyline,
        timestamp: new Date(),
      };

      const previous = this.previousOdds.get(key);

      if (previous) {
        const homeDiff = current.home - previous.home;
        const _awayDiff = current.away - previous.away;

        // Detect significant line movement (>20 points)
        if (Math.abs(homeDiff) > 20) {
          const direction = homeDiff > 0 ? 'moved out' : 'moved in';
          const team = homeDiff < 0 ? game.homeTeam : game.awayTeam;

          messages.push(this.createMessage(
            'alert',
            `📈 Line Movement: ${team}`,
            `${team} ML ${direction} from ${previous.home > 0 ? '+' : ''}${previous.home} to ${current.home > 0 ? '+' : ''}${current.home}. ` +
            `${Math.abs(homeDiff) > 40 ? 'Sharp money likely coming in.' : 'Moderate movement detected.'}`,
            Math.abs(homeDiff) > 40 ? 0.9 : 0.7,
            { homeTeam: game.homeTeam, awayTeam: game.awayTeam, movement: homeDiff }
          ));
        }
      }

      this.previousOdds.set(key, current);
    }

    return messages;
  }
}

// ============================================
// 7. WEATHER AGENT
// Considers weather for outdoor sports
// ============================================
export class WeatherAgent extends BaseAgent {
  name = 'WeatherAgent';
  description = 'Factors weather into outdoor game predictions';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    // Only applies to outdoor sports
    const outdoorSports = ['nfl', 'mlb', 'college-football'];
    if (!context.sport || !outdoorSports.includes(context.sport)) {
      return messages;
    }

    // Simulated weather analysis (in production, use weather API)
    const weatherFactors = [
      { condition: 'Wind > 15mph', impact: 'Under more likely', confidence: 0.75 },
      { condition: 'Rain expected', impact: 'Favors running teams', confidence: 0.7 },
      { condition: 'Extreme cold (<20°F)', impact: 'Lower scoring likely', confidence: 0.65 },
      { condition: 'Perfect conditions', impact: 'No weather adjustment needed', confidence: 0.9 },
    ];

    // Random weather for demo
    const weather = weatherFactors[Math.floor(Math.random() * weatherFactors.length)];

    if (weather.condition !== 'Perfect conditions') {
      messages.push(this.createMessage(
        'insight',
        `🌤️ Weather Alert: ${weather.condition}`,
        `${weather.impact}. Consider this when betting totals.`,
        weather.confidence
      ));
    }

    return messages;
  }
}

// ============================================
// 8. INJURY AGENT
// Monitors injury reports
// ============================================
export class InjuryAgent extends BaseAgent {
  name = 'InjuryAgent';
  description = 'Monitors injury reports and impact on odds';

  // Simulated injury data (in production, use injury API)
  private injuryDatabase: Record<string, Array<{
    player: string;
    status: 'out' | 'doubtful' | 'questionable' | 'probable';
    impact: 'high' | 'medium' | 'low';
  }>> = {
    'Lakers': [{ player: 'LeBron James', status: 'questionable', impact: 'high' }],
    'Celtics': [{ player: 'Jayson Tatum', status: 'probable', impact: 'high' }],
    'Chiefs': [{ player: 'Patrick Mahomes', status: 'probable', impact: 'high' }],
  };

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds) return messages;

    for (const game of context.odds) {
      const homeInjuries = this.injuryDatabase[game.homeTeam] || [];
      const awayInjuries = this.injuryDatabase[game.awayTeam] || [];

      const highImpactInjuries = [...homeInjuries, ...awayInjuries]
        .filter(i => i.impact === 'high' && i.status !== 'probable');

      if (highImpactInjuries.length > 0) {
        const injury = highImpactInjuries[0];
        messages.push(this.createMessage(
          'alert',
          `🏥 Injury Report: ${injury.player}`,
          `${injury.player} is ${injury.status.toUpperCase()} for ${game.homeTeam} vs ${game.awayTeam}. ` +
          `This could significantly impact the game outcome.`,
          injury.status === 'out' ? 0.95 : 0.75,
          { player: injury.player, status: injury.status, impact: injury.impact }
        ));
      }
    }

    return messages;
  }
}

// ============================================
// 9. SCHEDULE ANALYZER AGENT
// Considers rest days and travel
// ============================================
export class ScheduleAgent extends BaseAgent {
  name = 'ScheduleAgent';
  description = 'Analyzes schedule impact (rest, travel, back-to-backs)';

  async process(_context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    // Simulated schedule analysis
    const scheduleFactors = [
      { team: 'Lakers', situation: 'Back-to-back (played yesterday)', impact: 'negative' },
      { team: 'Celtics', situation: '3 days rest', impact: 'positive' },
      { team: 'Warriors', situation: '5-game road trip (game 4)', impact: 'negative' },
    ];

    for (const factor of scheduleFactors) {
      if (factor.impact === 'negative') {
        messages.push(this.createMessage(
          'insight',
          `📅 Schedule Alert: ${factor.team}`,
          `${factor.team}: ${factor.situation}. ` +
          `Teams in this situation historically cover less than 45% of the time.`,
          0.7,
          { team: factor.team, situation: factor.situation }
        ));
      }
    }

    return messages;
  }
}

// ============================================
// 10. PUBLIC BETTING AGENT
// Tracks public vs sharp money
// ============================================
export class PublicBettingAgent extends BaseAgent {
  name = 'PublicBettingAgent';
  description = 'Analyzes public vs sharp money distribution';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds) return messages;

    // Simulated public betting data
    const bettingData = [
      { homeTeam: 'Lakers', awayTeam: 'Warriors', publicOn: 'Lakers', publicPct: 72, sharpOn: 'Warriors' },
      { homeTeam: 'Celtics', awayTeam: 'Bucks', publicOn: 'Celtics', publicPct: 65, sharpOn: 'Celtics' },
    ];

    for (const data of bettingData) {
      // Fade the public when >70% on one side
      if (data.publicPct > 70 && data.sharpOn !== data.publicOn) {
        messages.push(this.createMessage(
          'recommendation',
          `💰 Sharp Money: ${data.sharpOn}`,
          `${data.publicPct}% of public bets on ${data.publicOn}, but sharp money is on ${data.sharpOn}. ` +
          `Historically, fading the public at this level wins 55%+ of the time.`,
          0.8,
          { publicOn: data.publicOn, sharpOn: data.sharpOn, publicPct: data.publicPct }
        ));
      }
    }

    return messages;
  }
}

// ============================================
// 11. HEAD-TO-HEAD AGENT
// Analyzes historical matchup data
// ============================================
export class HeadToHeadAgent extends BaseAgent {
  name = 'HeadToHeadAgent';
  description = 'Analyzes historical matchup trends';

  // Simulated H2H data
  private h2hData: Record<string, {
    totalGames: number;
    homeWins: number;
    awayWins: number;
    avgTotal: number;
    trends: string[];
  }> = {
    'Lakers-Warriors': {
      totalGames: 10,
      homeWins: 7,
      awayWins: 3,
      avgTotal: 225,
      trends: ['Home team covers 65% of the time', 'Over hit in last 6/10 meetings'],
    },
    'Celtics-Bucks': {
      totalGames: 8,
      homeWins: 5,
      awayWins: 3,
      avgTotal: 218,
      trends: ['Games decided by 5+ points 70% of the time'],
    },
  };

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds) return messages;

    for (const game of context.odds) {
      const key = `${game.homeTeam}-${game.awayTeam}`;
      const h2h = this.h2hData[key];

      if (h2h && h2h.totalGames >= 5) {
        const homeWinPct = (h2h.homeWins / h2h.totalGames) * 100;

        if (homeWinPct >= 65 || homeWinPct <= 35) {
          const favored = homeWinPct >= 65 ? game.homeTeam : game.awayTeam;
          messages.push(this.createMessage(
            'insight',
            `📊 H2H Trend: ${favored}`,
            `${favored} has won ${Math.max(h2h.homeWins, h2h.awayWins)}/${h2h.totalGames} recent meetings. ` +
            `Trend: ${h2h.trends[0]}`,
            0.75,
            { homeTeam: game.homeTeam, awayTeam: game.awayTeam, ...h2h }
          ));
        }
      }
    }

    return messages;
  }
}

// ============================================
// 12. PARLAY BUILDER AGENT
// Suggests optimal parlay combinations
// ============================================
export class ParlayAgent extends BaseAgent {
  name = 'ParlayAgent';
  description = 'Builds optimal parlay combinations';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds || context.odds.length < 2) return messages;

    // Find games with good value
    const valueGames = context.odds.filter(game => {
      const homeImplied = game.homeMoneyline > 0
        ? 100 / (game.homeMoneyline + 100)
        : Math.abs(game.homeMoneyline) / (Math.abs(game.homeMoneyline) + 100);
      return homeImplied > 0.55 || homeImplied < 0.45;
    });

    if (valueGames.length >= 2) {
      const parlayLegs = valueGames.slice(0, 3).map(g => {
        const pick = g.homeMoneyline < g.awayMoneyline ? g.homeTeam : g.awayTeam;
        return pick;
      });

      // Calculate parlay odds (simplified)
      const parlayOdds = valueGames.slice(0, 3).reduce((acc, g) => {
        const bestOdds = Math.max(g.homeMoneyline, g.awayMoneyline);
        const decimal = bestOdds > 0 ? 1 + bestOdds / 100 : 1 + 100 / Math.abs(bestOdds);
        return acc * decimal;
      }, 1);

      const americanOdds = parlayOdds >= 2
        ? (parlayOdds - 1) * 100
        : -100 / (parlayOdds - 1);

      messages.push(this.createMessage(
        'recommendation',
        `🎰 3-Leg Parlay Suggestion`,
        `Legs: ${parlayLegs.join(' + ')} ` +
        `Combined odds: ${americanOdds > 0 ? '+' : ''}${Math.round(americanOdds)}. ` +
        `Risk/Reward: High value, higher variance.`,
        0.65,
        { legs: parlayLegs, odds: Math.round(americanOdds) }
      ));
    }

    return messages;
  }
}

// ============================================
// 13. CONTRARIAN AGENT
// Finds contrarian value spots
// ============================================
export class ContrarianAgent extends BaseAgent {
  name = 'ContrarianAgent';
  description = 'Identifies contrarian betting opportunities';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.odds) return messages;

    // Contrarian spots:
    // 1. Team coming off bad loss
    // 2. Public hating on a team
    // 3. Overreaction to injury news

    const contrarianSpots = [
      {
        team: 'Lakers',
        situation: 'Coming off 20-point loss',
        reasoning: 'Teams off blowout losses cover 54% ATS next game. Public overreacts to recent performance.',
        confidence: 0.7,
      },
      {
        team: 'Bulls',
        situation: 'Public fading after star player injury',
        reasoning: 'Line may have overcorrected. Role players often step up in these spots.',
        confidence: 0.65,
      },
    ];

    for (const spot of contrarianSpots) {
      const game = context.odds.find(g =>
        g.homeTeam === spot.team || g.awayTeam === spot.team
      );

      if (game) {
        messages.push(this.createMessage(
          'recommendation',
          `🔄 Contrarian Spot: ${spot.team}`,
          `${spot.situation}. ${spot.reasoning}`,
          spot.confidence,
          { team: spot.team, situation: spot.situation }
        ));
      }
    }

    return messages;
  }
}

// ============================================
// 14. MENTAL GAME AGENT
// Tracks user psychology and tilt
// ============================================
export class MentalGameAgent extends BaseAgent {
  name = 'MentalGameAgent';
  description = 'Monitors betting psychology and tilt detection';

  async process(context: AgentContext): Promise<AgentMessage[]> {
    const messages: AgentMessage[] = [];

    if (!context.currentPicks || context.currentPicks.length < 5) return messages;

    const recentPicks = context.currentPicks.slice(0, 10);
    const recentLosses = recentPicks.filter(p => p.status === 'lost').length;
    const recentWins = recentPicks.filter(p => p.status === 'won').length;

    // Check stake escalation (tilt indicator)
    const stakes = recentPicks.map(p => p.stake);
    const avgStake = stakes.reduce((a, b) => a + b, 0) / stakes.length;
    const lastStake = stakes[0];
    const _secondLastStake = stakes[1] || avgStake;

    // Tilt detection: Increasing stakes after losses
    if (recentLosses >= 3 && lastStake > avgStake * 1.5) {
      messages.push(this.createMessage(
        'alert',
        '🧠 Tilt Alert',
        `You've increased your stake by ${((lastStake / avgStake - 1) * 100).toFixed(0)}% after ${recentLosses} recent losses. ` +
        `This is a common tilt pattern. Consider taking a break or returning to your standard stake.`,
        0.95
      ));
    }

    // Chase detection: Betting more frequently after losses
    if (recentLosses >= 3 && recentPicks.length >= 5) {
      const timeBetweenPicks = this.calculateAverageTimeBetweenPicks(recentPicks);
      if (timeBetweenPicks < 30) { // Less than 30 minutes between picks
        messages.push(this.createMessage(
          'alert',
          '⚠️ Chase Betting Detected',
          `You're placing bets very frequently (${timeBetweenPicks.toFixed(0)} min apart) after losses. ` +
          `Chase betting often leads to poor decisions. Slow down.`,
          0.9
        ));
      }
    }

    // Overconfidence after wins
    if (recentWins >= 5) {
      messages.push(this.createMessage(
        'insight',
        '🎯 Win Streak Caution',
        `You're on a ${recentWins}-game win streak! While great, be careful of overconfidence. ` +
        `Stick to your process and don't increase stakes just because you're winning.`,
        0.8
      ));
    }

    return messages;
  }

  private calculateAverageTimeBetweenPicks(picks: AgentContext['currentPicks']): number {
    if (!picks || picks.length < 2) return Infinity;

    // Simplified - in production, use actual timestamps
    return 45; // Mock: 45 minutes average
  }
}

// ============================================
// EXPORT ALL AGENTS
// ============================================
export const advancedAgents = [
  new LineMovementAgent(),
  new WeatherAgent(),
  new InjuryAgent(),
  new ScheduleAgent(),
  new PublicBettingAgent(),
  new HeadToHeadAgent(),
  new ParlayAgent(),
  new ContrarianAgent(),
  new MentalGameAgent(),
];
