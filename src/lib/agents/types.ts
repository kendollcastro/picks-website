// ============================================
// KCMPICKS - Agent Types
// Shared types for all agents
// ============================================

export interface AgentMessage {
  id: string;
  agent: string;
  type: 'prediction' | 'analysis' | 'recommendation' | 'alert' | 'insight';
  title: string;
  content: string;
  confidence: number;
  timestamp: Date;
  data?: Record<string, unknown>;
  action?: {
    label: string;
    type: 'pick' | 'view' | 'dismiss';
    payload?: Record<string, unknown>;
  };
}

export interface AgentContext {
  userId?: string;
  sport?: string;
  currentPicks?: Array<{
    id: string;
    sport: string;
    home_team: string;
    away_team: string;
    selection: string;
    odds: number;
    stake: number;
    status: string;
  }>;
  liveGames?: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    isLive: boolean;
  }>;
  odds?: Array<{
    homeTeam: string;
    awayTeam: string;
    homeMoneyline: number;
    awayMoneyline: number;
    spread: number;
    total: number;
  }>;
}

export abstract class BaseAgent {
  abstract name: string;
  abstract description: string;

  abstract process(context: AgentContext): Promise<AgentMessage[]>;

  protected createMessage(
    type: AgentMessage['type'],
    title: string,
    content: string,
    confidence: number,
    data?: Record<string, unknown>,
    action?: AgentMessage['action']
  ): AgentMessage {
    return {
      id: `${this.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      agent: this.name,
      type,
      title,
      content,
      confidence,
      timestamp: new Date(),
      data,
      action,
    };
  }
}
