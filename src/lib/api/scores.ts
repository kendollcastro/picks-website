// ============================================
// KCMPICKS - Live Scores Service
// Real-time scores from multiple free APIs
// ============================================

import { API_CONFIG, SPORTS_CONFIG } from './config';

// ============================================
// TYPES
// ============================================
export interface LiveGame {
  id: string;
  sport: string;
  league: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'scheduled' | 'live' | 'halftime' | 'final' | 'postponed';
  period: string;
  clock: string;
  gameTime: string;
  venue: string;
  homeLogo: string;
  awayLogo: string;
  isLive: boolean;
  odds?: {
    homeMoneyline: number;
    awayMoneyline: number;
    spread: number;
    total: number;
  };
}

// ============================================
// ESPN FREE API SERVICE
// ============================================
export class ESPNScoresService {
  private static baseUrl = API_CONFIG.ESPN.SCOREBOARD_URL;

  static async getScores(sport: string): Promise<LiveGame[]> {
    const sportKey = SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]?.espnKey;
    if (!sportKey) return [];

    try {
      const response = await fetch(`${this.baseUrl}/${sportKey}/scoreboard`, {
        next: { revalidate: 30 }, // Cache for 30 seconds
      });

      if (!response.ok) return [];

      const data = await response.json();
      return this.transformData(data, sport);
    } catch (error) {
      console.error(`Error fetching ${sport} scores:`, error);
      return [];
    }
  }

  private static transformData(data: {
    events?: Array<{
      id: string;
      name: string;
      date: string;
      competitions: Array<{
        id: string;
        venue?: { fullName?: string };
        competitors: Array<{
          homeAway: string;
          team: {
            id: string;
            displayName: string;
            abbreviation: string;
            logo?: string;
          };
          score?: string;
          records?: Array<{ summary: string }>;
        }>;
        status?: {
          type?: {
            id: string;
            name: string;
            description: string;
            detail?: string;
            shortDetail?: string;
            state?: string;
          };
          displayClock?: string;
          period?: number;
        };
      }>;
    }>;
  }, sport: string): LiveGame[] {
    if (!data.events) return [];

    return data.events.map((event) => {
      const competition = event.competitions[0];
      const home = competition?.competitors?.find((c) => c.homeAway === 'home');
      const away = competition?.competitors?.find((c) => c.homeAway === 'away');
      const status = competition?.status?.type;

      let gameStatus: LiveGame['status'] = 'scheduled';
      let isLive = false;
      let period = '';
      let clock = '';

      if (status) {
        if (status.state === 'in') {
          gameStatus = 'live';
          isLive = true;
          period = status.detail || '';
          clock = competition?.status?.displayClock || '';
        } else if (status.state === 'post') {
          gameStatus = 'final';
          period = 'Final';
        } else if (status.state === 'pre') {
          gameStatus = 'scheduled';
          period = status.shortDetail || '';
        }
      }

      return {
        id: event.id,
        sport,
        league: SPORTS_CONFIG[sport as keyof typeof SPORTS_CONFIG]?.name || sport,
        homeTeam: home?.team?.displayName || 'TBD',
        awayTeam: away?.team?.displayName || 'TBD',
        homeScore: home?.score ? parseInt(home.score) : 0,
        awayScore: away?.score ? parseInt(away.score) : 0,
        status: gameStatus,
        period,
        clock,
        gameTime: event.date,
        venue: competition?.venue?.fullName || 'TBD',
        homeLogo: home?.team?.logo || '',
        awayLogo: away?.team?.logo || '',
        isLive,
      };
    });
  }

  // Get all live games across all sports
  static async getAllLiveGames(): Promise<LiveGame[]> {
    const sports = Object.keys(SPORTS_CONFIG);
    const results = await Promise.allSettled(
      sports.map((sport) => this.getScores(sport))
    );

    return results
      .filter((r): r is PromiseFulfilledResult<LiveGame[]> => r.status === 'fulfilled')
      .flatMap((r) => r.value)
      .filter((game) => game.isLive);
  }
}

// ============================================
// THE SPORTS DB SERVICE (Free, no key)
// ============================================
export class TheSportsDBService {
  private static baseUrl = API_CONFIG.SPORTS_DB.BASE_URL;

  // Get team details and logo
  static async getTeam(teamName: string): Promise<{
    id: string;
    name: string;
    logo: string;
    stadium: string;
    league: string;
  } | null> {
    try {
      const response = await fetch(
        `${this.baseUrl}/searchteams.php?t=${encodeURIComponent(teamName)}`
      );
      const data = await response.json();

      if (data.teams && data.teams.length > 0) {
        const team = data.teams[0];
        return {
          id: team.idTeam,
          name: team.strTeam,
          logo: team.strTeamBadge || team.strTeamLogo || '',
          stadium: team.strStadium || '',
          league: team.strLeague || '',
        };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Get upcoming events for a league
  static async getUpcomingEvents(leagueId: string): Promise<Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    date: string;
    time: string;
    venue: string;
  }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/eventsnextleague.php?id=${leagueId}`
      );
      const data = await response.json();

      return (data.events || []).map((event: {
        idEvent: string;
        strHomeTeam: string;
        strAwayTeam: string;
        dateEvent: string;
        strTime: string;
        strVenue: string;
      }) => ({
        id: event.idEvent,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        date: event.dateEvent,
        time: event.strTime,
        venue: event.strVenue,
      }));
    } catch {
      return [];
    }
  }

  // Get past results
  static async getPastResults(leagueId: string): Promise<Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    date: string;
  }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/eventspastleague.php?id=${leagueId}`
      );
      const data = await response.json();

      return (data.events || []).map((event: {
        idEvent: string;
        strHomeTeam: string;
        strAwayTeam: string;
        intHomeScore: string;
        intAwayScore: string;
        dateEvent: string;
      }) => ({
        id: event.idEvent,
        homeTeam: event.strHomeTeam,
        awayTeam: event.strAwayTeam,
        homeScore: parseInt(event.intHomeScore || '0'),
        awayScore: parseInt(event.intAwayScore || '0'),
        date: event.dateEvent,
      }));
    } catch {
      return [];
    }
  }
}

// ============================================
// BALLDONTLIE SERVICE (NBA - Free)
// ============================================
export class BallDontLieService {
  private static baseUrl = API_CONFIG.BALLDONTLIE.BASE_URL;

  // Get today's NBA games
  static async getTodaysGames(): Promise<Array<{
    id: number;
    homeTeam: string;
    awayTeam: string;
    homeScore: number;
    awayScore: number;
    status: string;
    date: string;
  }>> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`${this.baseUrl}/games?dates[]=${today}`, {
        headers: {
          Authorization: `Bearer ${API_CONFIG.BALLDONTLIE.KEY}`,
        },
      });
      const data = await response.json();

      return (data.data || []).map((game: {
        id: number;
        home_team: { full_name: string };
        visitor_team: { full_name: string };
        home_team_score: number;
        visitor_team_score: number;
        status: string;
        date: string;
      }) => ({
        id: game.id,
        homeTeam: game.home_team.full_name,
        awayTeam: game.visitor_team.full_name,
        homeScore: game.home_team_score,
        awayScore: game.visitor_team_score,
        status: game.status,
        date: game.date,
      }));
    } catch {
      return [];
    }
  }

  // Get NBA teams
  static async getTeams(): Promise<Array<{
    id: number;
    name: string;
    city: string;
    conference: string;
    division: string;
  }>> {
    try {
      const response = await fetch(`${this.baseUrl}/teams`, {
        headers: {
          Authorization: `Bearer ${API_CONFIG.BALLDONTLIE.KEY}`,
        },
      });
      const data = await response.json();

      return (data.data || []).map((team: {
        id: number;
        name: string;
        city: string;
        conference: string;
        division: string;
      }) => ({
        id: team.id,
        name: team.name,
        city: team.city,
        conference: team.conference,
        division: team.division,
      }));
    } catch {
      return [];
    }
  }
}
