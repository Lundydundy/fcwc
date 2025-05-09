import apiClient from './apiClient';

interface Player {
  id: string;
  name: string;
  club: string;
  position: string;
  price: number;
  totalPoints: number;
  form: number;
  stats: {
    goals: number;
    assists: number;
    cleanSheets: number;
    saves: number;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
  };
}

interface PlayerResponse {
  success: boolean;
  data: Player;
}

interface PlayersResponse {
  success: boolean;
  count?: number;
  data: Player[];
}

/**
 * Service for handling player-related API calls
 */
const playerService = {
  /**
   * Get all players with optional filtering
   */
  getAllPlayers: async (filters?: Record<string, any>): Promise<Player[]> => {
    try {
      // Add a limit parameter to ensure we get a large number of players
      const params = { 
        ...filters,
        limit: '1000'  // Increased limit, converted to string to match parameter type
      };
      
      const response = await apiClient.get('/api/players', { params });
      
      // Handle both array response and nested data response formats
      const playersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      
      // Map the response data to match our Player interface
      return playersData.map((player: any) => ({
        id: player._id || player.id,
        name: player.name,
        club: player.club || player.team || '',
        position: player.position,
        price: player.price || player.value || 0,
        totalPoints: player.totalPoints || 0,
        form: player.form || 0,
        stats: {
          goals: player.stats?.goals || 0,
          assists: player.stats?.assists || 0,
          cleanSheets: player.stats?.cleanSheets || 0,
          saves: player.stats?.saves || 0,
          yellowCards: player.stats?.yellowCards || 0,
          redCards: player.stats?.redCards || 0,
          minutesPlayed: player.stats?.minutesPlayed || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching players:', error);
      return [];
    }
  },

  /**
   * Get players by position
   */
  getPlayersByPosition: async (position: string, limit: number): Promise<Player[]> => {
    try {
      const response = await apiClient.get(`/api/players`, { 
        params: {
          position,
          limit: '500'  // Convert numeric limit to string to match parameter type
        }
      });
      
      // Handle both array response and nested data response formats
      const playersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      
      return playersData.map((player: any) => ({
        id: player._id || player.id,
        name: player.name,
        club: player.club || player.team || '',
        position: player.position,
        price: player.price || player.value || 0,
        totalPoints: player.totalPoints || 0,
        form: player.form || 0,
        stats: {
          goals: player.stats?.goals || 0,
          assists: player.stats?.assists || 0,
          cleanSheets: player.stats?.cleanSheets || 0,
          saves: player.stats?.saves || 0,
          yellowCards: player.stats?.yellowCards || 0,
          redCards: player.stats?.redCards || 0,
          minutesPlayed: player.stats?.minutesPlayed || 0
        }
      }));
    } catch (error) {
      console.error('Error fetching players by position:', error);
      return [];
    }
  },

  /**
   * Get a specific player by ID
   */
  getPlayerById: async (id: string): Promise<Player | null> => {
    try {
      const response = await apiClient.get(`/api/players/${id}`);
      const playerData = response.data.data || response.data;
      
      return {
        id: playerData._id || playerData.id,
        name: playerData.name,
        club: playerData.club || playerData.team || '',
        position: playerData.position,
        price: playerData.price || playerData.value || 0,
        totalPoints: playerData.totalPoints || 0,
        form: playerData.form || 0,
        stats: {
          goals: playerData.stats?.goals || 0,
          assists: playerData.stats?.assists || 0,
          cleanSheets: playerData.stats?.cleanSheets || 0,
          saves: playerData.stats?.saves || 0,
          yellowCards: playerData.stats?.yellowCards || 0,
          redCards: playerData.stats?.redCards || 0,
          minutesPlayed: playerData.stats?.minutesPlayed || 0
        }
      };
    } catch (error) {
      console.error('Error fetching player by ID:', error);
      return null;
    }
  },

  /**
   * Get all available clubs
   */
  getAllClubs: async (): Promise<string[]> => {
    try {
      // First try to get clubs from a dedicated endpoint if it exists
      try {
        const response = await apiClient.get('/api/clubs');
        if (response.data && Array.isArray(response.data)) {
          return response.data.map((club: any) => club.name || club);
        }
        if (response.data && response.data.data && Array.isArray(response.data.data)) {
          return response.data.data.map((club: any) => club.name || club);
        }
      } catch (e) {
        // If dedicated endpoint fails, continue with extraction from players
      }
      
      // Otherwise extract clubs from players with increased limit
      const response = await apiClient.get('/api/players', { 
        params: { limit: '1000' }  // Convert numeric limit to string
      });
      
      const playersData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.data || []);
      
      // Extract club names, handling multiple possible field names
      const clubsSet = new Set<string>();
      playersData.forEach((player: any) => {
        const clubName = player.club || player.team || '';
        if (clubName && typeof clubName === 'string') {
          clubsSet.add(clubName);
        }
      });
      
      // Convert to array and sort alphabetically
      return Array.from(clubsSet).sort();
    } catch (error) {
      console.error('Error fetching clubs:', error);
      
      // Fallback to predefined list of major clubs if API fails
      return [
        'Arsenal',
        'Aston Villa',
        'Brentford',
        'Brighton',
        'Burnley',
        'Chelsea',
        'Crystal Palace',
        'Everton',
        'Fulham',
        'Liverpool',
        'Manchester City',
        'Manchester United',
        'Newcastle',
        'Nottingham Forest',
        'Sheffield United',
        'Tottenham',
        'West Ham',
        'Wolverhampton',
        // Add international clubs
        'Barcelona',
        'Real Madrid',
        'Bayern Munich',
        'PSG',
        'Juventus',
        'AC Milan',
        'Inter Milan',
        'Borussia Dortmund'
      ];
    }
  }
};

export default playerService;
export type { Player };