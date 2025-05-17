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

interface TeamPlayer {
  player: string | Player;
  position: string;
  isOnBench: boolean;
  isCaptain: boolean;
  isViceCaptain: boolean;
  benchOrder?: number; // Position on bench for substitution order
}

interface FantasyTeam {
  id: string;
  name: string;
  user: string;
  budget: number;
  players: TeamPlayer[];
  formation: string;
  totalPoints: number;
  createdAt: string;
}

interface TeamCreateData {
  name: string;
  formation?: string;
}

interface TeamUpdateData {
  name?: string;
  formation?: string;
}

interface PlayerAddData {
  players: {
    player: string;
    position: string;
    isOnBench?: boolean;
  }[];
}

interface PlayerRoleUpdateData {
  isOnBench?: boolean;
  isCaptain?: boolean;
  isViceCaptain?: boolean;
}

interface BulkPlayerRoleUpdateData {
  players: {
    playerId: string;
    isOnBench?: boolean;
    isCaptain?: boolean;
    isViceCaptain?: boolean;
    benchOrder?: number;
  }[];
}

interface PlayerTransferData {
  transfers: {
    in: {
      player: string;
      position: string;
      isOnBench?: boolean;
    };
    out: {
      player: string;
    };
  }[];
}

let count = 0;

/**
 * Team service for handling team-related operations
 */
const teamService = {
  /**
   * Get current user's team
   */
  getUserTeam: async (): Promise<FantasyTeam> => {
    const response = await apiClient.get('/api/teams');
    return response.data;
  },

  /**
   * Create new fantasy team
   */
  createTeam: async (teamData: TeamCreateData): Promise<FantasyTeam> => {
    const response = await apiClient.post('/api/teams', teamData);
    return response.data;
  },

  /**
   * Update team details (name, formation)
   */
  updateTeam: async (teamData: TeamUpdateData): Promise<FantasyTeam> => {
    const response = await apiClient.put('/api/teams', teamData);
    return response.data;
  },

  /**
   * Add players to team
   */
  addPlayers: async (playerData: PlayerAddData): Promise<FantasyTeam> => {
    const response = await apiClient.post('/api/teams/players', playerData);
    return response.data;
  },

  /**
   * Process player transfers (removing and adding players in a single operation)
   */
  transferPlayers: async (transferData: PlayerTransferData): Promise<FantasyTeam> => {
    const response = await apiClient.post('/api/teams/transfers', transferData);
    return response.data;
  },

  /**
   * Update multiple player roles in a single request
   */
  updatePlayerRoles: async (playerUpdates: BulkPlayerRoleUpdateData): Promise<FantasyTeam> => {
    try {
      // Ensure we're sending the correct data structure that the server expects
      let dataToSend: any;
      
      // Check if playerUpdates already has the correct structure
      if (playerUpdates.hasOwnProperty('players') && Array.isArray(playerUpdates.players)) {
        dataToSend = playerUpdates;
      } else if (Array.isArray(playerUpdates)) {
        // If playerUpdates is an array, wrap it in the expected object
        dataToSend = { players: playerUpdates };
      } else {
        // If it's a single update, wrap it in the expected format
        dataToSend = { 
          players: [playerUpdates] 
        };
      }
      
      console.log('Sending player updates:', JSON.stringify(dataToSend));
      const response = await apiClient.put('/api/teams/players', dataToSend);
      return response.data;
    } catch (error) {
      console.error('Error updating player roles:', error);
      throw error;
    }
  },

  /**
   * Update player role (bench, captain, vice-captain)
   */
  updatePlayerRole: async (playerId: string, roleData: PlayerRoleUpdateData): Promise<FantasyTeam> => {
    count++
    console.log('Updating player role:', playerId, roleData, count);
    const response = await apiClient.put(`/api/teams/players/${playerId}`, roleData);
    return response.data;
  },

  /**
   * Get available players for selection
   */
  getAvailablePlayers: async (position?: string): Promise<Player[]> => {
    const url = position 
      ? `/api/teams/available-players?position=${position}`
      : '/api/teams/available-players';
    const response = await apiClient.get(url);
    return response.data;
  },

  /**
   * Reset team (remove all players)
   */
  resetTeam: async (): Promise<FantasyTeam> => {
    const response = await apiClient.delete('/api/teams');
    return response.data;
  },

  /**
   * Legacy methods kept for compatibility
   */
  getAllTeams: async (): Promise<any[]> => {
    return await apiClient.get('/api/teams/all');
  },

  getTeamById: async (teamId: string): Promise<any> => {
    return await apiClient.get(`/api/teams/${teamId}`);
  },

  getTeamsByLeague: async (leagueId: string): Promise<any[]> => {
    return await apiClient.get(`/api/leagues/${leagueId}/teams`);
  },

  deleteTeam: async (teamId: string): Promise<void> => {
    return await apiClient.delete(`/api/teams/${teamId}`);
  },
};

export default teamService;