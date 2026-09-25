// ============================================
// KCMPICKS - Massey Ratings Service
// Fetches team ratings and rankings for ML features
// ============================================

import { createClient } from '@/lib/supabase/client';

export interface TeamRating {
  id?: number;
  sport: string;
  team_name: string;
  team_id: string;
  conference: string | null;
  rating: number;
  rank: number;
  wins: number;
  losses: number;
  points_for: number;
  points_against: number;
  last_updated: string;
}

const SPORT_MAPPINGS: Record<string, { sportKey: string; name: string }[]> = {
  nba: [{ sportKey: 'nba', name: 'NBA' }],
  nfl: [{ sportKey: 'nfl', name: 'NFL' }],
  ncaaf: [
    { sportKey: 'cf', name: 'College Football' },
    { sportKey: 'cf_fcs', name: 'College Football FCS' },
  ],
  ncaab: [
    { sportKey: 'cb', name: 'College Basketball' },
    { sportKey: 'cb_fcs', name: 'College Basketball' },
  ],
  soccer: [
    { sportKey: 'dls', name: 'Domestic Soccer' },
  ],
};

// ============================================
// FETCH RANKINGS FROM MASSEY
// ============================================
export async function fetchMasseyRankings(sport: string): Promise<TeamRating[]> {
  const sportKeys = SPORT_MAPPINGS[sport];
  if (!sportKeys) {
    console.warn('No Massey mappings for sport:', sport);
    return [];
  }

  const teams: TeamRating[] = [];
  const supabase = createClient();

  for (const { sportKey, name } of sportKeys) {
    try {
      const response = await fetch(`https://masseyratings.com/ranks?s=${sportKey}`);
      
      if (!response.ok) {
        console.error('Massey error:', response.status);
        continue;
      }

      const html = await response.text();
      
      // Parse the HTML to extract rankings
      // Massey uses a table structure with team data
      const rankings = parseMasseyHTML(html, sport, name);
      
      if (rankings.length > 0) {
        // Try to save to database
        try {
          for (const team of rankings.slice(0, 50)) {
            await supabase
              .from('team_ratings')
              .upsert({
                sport: team.sport,
                team_id: team.team_id,
                team_name: team.team_name,
                conference: team.conference,
                rating: team.rating,
                rank: team.rank,
                wins: team.wins,
                losses: team.losses,
                points_for: team.points_for,
                points_against: team.points_against,
                last_updated: new Date().toISOString(),
              }, {
                onConflict: 'sport,team_id',
              });
          }
          console.log(`Saved ${rankings.length} ${name} ratings to database`);
        } catch (dbError) {
          console.warn('Could not save to database:', dbError);
        }
        
        teams.push(...rankings);
      }
    } catch (error) {
      console.error(`Error fetching ${name} from Massey:`, error);
    }
  }

  return teams;
}

function parseMasseyHTML(html: string, sport: string, _leagueName: string): TeamRating[] {
  const teams: TeamRating[] = [];
  
  // Extract team data from table rows
  // Massey uses format like: Rank | Team | Record | Rating | etc
  const rowRegex = /<tr[^>]*>[\s\S]*?<\/tr>/gi;
  const rows = html.match(rowRegex) || [];
  
  for (let i = 1; i < Math.min(rows.length, 100); i++) {
    try {
      const row = rows[i];
      
      // Extract cells
      const cellRegex = /<t[hd][^>]*>([\s\S]*?)<\/t[hd]>/gi;
      const cells: string[] = [];
      let match;
      
      while ((match = cellRegex.exec(row)) !== null) {
        cells.push(match[1].replace(/<[^>]*>/g, '').trim());
      }
      
      if (cells.length < 4) continue;
      
      // Parse based on typical Massey format: Rank | Team | Conference | Record | Rating | Points For | Against
      const rank = parseInt(cells[0]) || 0;
      const teamName = cells[1] || '';
      const conference = cells[2] || null;
      
      // Parse record (W-L or W-L-T)
      const recordMatch = cells[3]?.match(/(\d+)-(\d+)/);
      const wins = recordMatch ? parseInt(recordMatch[1]) : 0;
      const losses = recordMatch ? parseInt(recordMatch[2]) : 0;
      
      // Rating is usually in a later column
      const rating = parseFloat(cells[4]?.replace(/[^\d.-]/g, '')) || 0;
      
      // Points
      const pf = parseInt(cells[5]?.replace(/[^\d]/g, '') || '0') || 0;
      const pa = parseInt(cells[6]?.replace(/[^\d]/g, '') || '0') || 0;
      
      if (teamName && rating > 0) {
        teams.push({
          sport,
          team_id: `${sport}_${teamName.toLowerCase().replace(/\s+/g, '_')}`,
          team_name: teamName,
          conference,
          rating,
          rank,
          wins,
          losses,
          points_for: pf,
          points_against: pa,
          last_updated: new Date().toISOString(),
        });
      }
        } catch {
      // Skip malformed rows
    }
  }
  
  return teams;
}

// ============================================
// FETCH TEAM RATING FROM DATABASE
// ============================================
export async function getTeamRating(sport: string, teamName: string): Promise<TeamRating | null> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('team_ratings')
      .select('*')
      .ilike('team_name', `%${teamName}%`)
      .eq('sport', sport)
      .order('rank', { ascending: true })
      .limit(1)
      .single();
    
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

// ============================================
// GET ALL RANKINGS FOR A SPORT
// ============================================
export async function getRankings(sport: string): Promise<TeamRating[]> {
  const supabase = createClient();
  
  try {
    const { data, error } = await supabase
      .from('team_ratings')
      .select('*')
      .eq('sport', sport)
      .order('rank', { ascending: true })
      .limit(100);
    
    if (error) throw error;
    return data || [];
  } catch {
    // If no data in DB, try to fetch from Massey
    return fetchMasseyRankings(sport);
  }
}

// ============================================
// REFRESH ALL RATINGS
// ============================================
export async function refreshAllRatings(): Promise<void> {
  const sports = ['ncaaf', 'ncaab', 'soccer', 'nfl', 'nba'];
  
  for (const sport of sports) {
    console.log(`Refreshing ${sport} ratings...`);
    await fetchMasseyRankings(sport);
  }
}