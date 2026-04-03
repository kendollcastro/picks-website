// ============================================
// KCMPICKS - Team Assets Service
// Free team logos, icons, and assets
// ============================================

import { API_CONFIG } from './config';

// ============================================
// TYPES
// ============================================
export interface TeamAsset {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  primaryColor: string;
  secondaryColor: string;
  conference?: string;
  division?: string;
}

// ============================================
// ESPN TEAM ASSETS (Free, no key)
// ============================================
export class ESPNTeamAssets {
  private static baseUrl = 'https://a.espncdn.com';

  // Get ESPN team logo URL
  static getTeamLogo(sport: string, teamId: string): string {
    const sportPaths: Record<string, string> = {
      nba: 'basketball/nba',
      nfl: 'football/nfl',
      mlb: 'baseball/mlb',
      soccer: 'soccer',
      ufc: 'mma/ufc',
      'college-football': 'football/college-football',
      'college-basketball': 'basketball/mens-college-basketball',
      'womens-basketball': 'basketball/wnba',
    };

    const sportPath = sportPaths[sport] || sport;
    return `${this.baseUrl}/i/teamlogos/${sportPath}/500/scoreboard/${teamId}.png`;
  }

  // Get ESPN team colors
  static async getTeamColors(sport: string, teamId: string): Promise<{
    primary: string;
    secondary: string;
  }> {
    try {
      const sportKey = sport.replace('-', '/');
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sportKey}/teams/${teamId}`
      );
      const data = await response.json();

      return {
        primary: data.team?.color || '0066FF',
        secondary: data.team?.alternateColor || 'FFFFFF',
      };
    } catch {
      return { primary: '0066FF', secondary: 'FFFFFF' };
    }
  }

  // Get all teams for a sport
  static async getTeams(sport: string): Promise<TeamAsset[]> {
    try {
      const sportKey = sport.replace('-', '/');
      const response = await fetch(
        `https://site.api.espn.com/apis/site/v2/sports/${sportKey}/teams?limit=100`
      );
      const data = await response.json();

      return (data.sports?.[0]?.leagues?.[0]?.teams || []).map((item: {
        team: {
          id: string;
          displayName: string;
          abbreviation: string;
          color?: string;
          alternateColor?: string;
          logos?: Array<{ href: string }>;
        };
      }) => ({
        id: item.team.id,
        name: item.team.displayName,
        abbreviation: item.team.abbreviation,
        logo: item.team.logos?.[0]?.href || this.getTeamLogo(sport, item.team.id),
        primaryColor: item.team.color || '0066FF',
        secondaryColor: item.team.alternateColor || 'FFFFFF',
      }));
    } catch {
      return [];
    }
  }
}

// ============================================
// THE SPORTS DB ASSETS (Free)
// ============================================
export class TheSportsDBAssets {
  private static baseUrl = API_CONFIG.SPORTS_DB.BASE_URL;

  // Get team badge/logo
  static async getTeamBadge(teamName: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.baseUrl}/searchteams.php?t=${encodeURIComponent(teamName)}`
      );
      const data = await response.json();

      if (data.teams && data.teams.length > 0) {
        return data.teams[0].strTeamBadge || data.teams[0].strTeamLogo || '';
      }
      return '';
    } catch {
      return '';
    }
  }

  // Get league teams with badges
  static async getLeagueTeams(leagueId: string): Promise<Array<{
    id: string;
    name: string;
    badge: string;
    stadium: string;
  }>> {
    try {
      const response = await fetch(
        `${this.baseUrl}/lookup_all_teams.php?id=${leagueId}`
      );
      const data = await response.json();

      return (data.teams || []).map((team: {
        idTeam: string;
        strTeam: string;
        strTeamBadge: string;
        strStadium: string;
      }) => ({
        id: team.idTeam,
        name: team.strTeam,
        badge: team.strTeamBadge || '',
        stadium: team.strStadium || '',
      }));
    } catch {
      return [];
    }
  }
}

// ============================================
// SPORT ICONS (Local SVG/Emoji)
// ============================================
export const SPORT_ICONS: Record<string, { emoji: string; svg: string }> = {
  nba: {
    emoji: '🏀',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`,
  },
  nfl: {
    emoji: '🏈',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><ellipse cx="12" cy="12" rx="10" ry="6"/><path d="M12 6v12"/><path d="M8 8l8 8"/><path d="M16 8l-8 8"/></svg>`,
  },
  mlb: {
    emoji: '⚾',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2c-2 4-2 8 0 12s2 8 0 12"/><path d="M12 2c2 4 2 8 0 12s-2 8 0 12"/></svg>`,
  },
  soccer: {
    emoji: '⚽',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2l3 7h-6l3-7z"/><path d="M12 22l-3-7h6l-3 7z"/></svg>`,
  },
  ufc: {
    emoji: '🥊',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 11V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v1"/><path d="M14 10V4a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7"/><path d="M10 10.5V6a2 2 0 0 0-2-2 2 2 0 0 0-2 2v9"/><path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15"/></svg>`,
  },
  'college-football': {
    emoji: '🏟️',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 20h20"/><path d="M5 20V8l7-5 7 5v12"/><path d="M9 20v-4h6v4"/></svg>`,
  },
  'college-basketball': {
    emoji: '🎓',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 10 3 12 0v-5"/></svg>`,
  },
  'womens-basketball': {
    emoji: '👩‍🏀',
    svg: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>`,
  },
};

// Get sport icon
export function getSportIcon(sport: string): string {
  return SPORT_ICONS[sport]?.emoji || '🏀';
}

// Get team logo with fallback
export async function getTeamLogoWithFallback(
  sport: string,
  teamName: string
): Promise<string> {
  // Try ESPN first
  const espnLogo = ESPNTeamAssets.getTeamLogo(sport, teamName);
  if (espnLogo) return espnLogo;

  // Try TheSportsDB
  const dbLogo = await TheSportsDBAssets.getTeamBadge(teamName);
  if (dbLogo) return dbLogo;

  // Return placeholder
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(teamName.substring(0, 2))}&background=0066FF&color=fff&size=128`;
}
