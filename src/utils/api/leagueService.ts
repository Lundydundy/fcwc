import apiClient from './apiClient';

interface League {
  _id: string;
  name: string;
  description?: string;
  owner: {
    _id: string;
    name?: string;
    email?: string;
  } | string;
  type: 'public' | 'private';
  maxMembers: number;
  members: {
    user: {
      _id: string;
      name: string;
    };
    team?: {
      _id: string;
      name: string;
      totalPoints: number;
    };
    joinedAt: string;
  }[];
  inviteCode?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LeagueCreateData {
  name: string;
  description?: string;
  type: string;
  maxMembers?: number;
}

interface LeagueUpdateData {
  name?: string;
  description?: string;
  type?: string;
  maxMembers?: number;
}

interface LeagueResponse {
  success: boolean;
  data: League;
  message?: string;
}

interface LeaguesResponse {
  success: boolean;
  data: League[];
  count?: number;
  message?: string;
}

/**
 * Service for handling league-related API calls
 */
const leagueService = {
  /**
   * Get all leagues
   */
  getAllLeagues: async (filters?: Record<string, any>): Promise<LeaguesResponse> => {
    return await apiClient.get('/api/leagues', { params: filters as Record<string, string> });
  },

  /**
   * Get leagues created by current user
   */
  getMyLeagues: async (): Promise<LeaguesResponse> => {
    return await apiClient.get('/api/leagues/my-leagues');
  },
  /**
   * Get leagues the current user is part of
   */
  getJoinedLeagues: async (): Promise<LeaguesResponse> => {
    return await apiClient.get('/api/leagues');
  },

  /**
   * Get a specific league by ID
   */
  getLeagueById: async (id: string): Promise<LeagueResponse> => {
    return await apiClient.get(`/api/leagues/${id}`);
  },

  /**
   * Create a new league
   */
  createLeague: async (leagueData: LeagueCreateData): Promise<LeagueResponse> => {
    return await apiClient.post('/api/leagues', leagueData);
  },

  /**
   * Update a league
   */
  updateLeague: async (id: string, leagueData: LeagueUpdateData): Promise<LeagueResponse> => {
    return await apiClient.put(`/api/leagues/${id}`, leagueData);
  },

  /**
   * Delete a league
   */
  deleteLeague: async (id: string): Promise<{ success: boolean, message: string }> => {
    return await apiClient.delete(`/api/leagues/${id}`);
  },
    /**
   * Get detailed league information including members
   */
  getLeagueDetails: async (id: string): Promise<LeagueResponse> => {
    return await apiClient.get(`/api/leagues/${id}`);
  },
  
  /**
   * Join a league using invite code
   */
  joinLeague: async (inviteCode: string): Promise<{ success: boolean, message: string }> => {
    return await apiClient.post(`/api/leagues/join`, { inviteCode });
  },
  /**
   * Leave a league
   */
  leaveLeague: async (leagueId: string): Promise<{ success: boolean, message: string }> => {
    return await apiClient.delete(`/api/leagues/${leagueId}/leave`);
  },
  
  /**
   * Update user's team in all joined leagues
   */
  updateTeamInLeagues: async (): Promise<{ success: boolean, message: string, updatedCount: number }> => {
    return await apiClient.put('/api/leagues/update-team', {});
  },

  /**
   * Get all public leagues (no auth required)
   */
  getAllPublicLeagues: async (page: number = 1, limit: number = 50, search?: string): Promise<LeaguesResponse> => {
    return await apiClient.get('/api/leagues/all-public', {
      params: {
        page: page.toString(),
        limit: limit.toString(),
        ...(search ? { search } : {})
      }
    });
  },

  /**
   * Join a public league by ID
   */
  joinPublicLeague: async (leagueId: string): Promise<{ success: boolean, message: string }> => {
    return await apiClient.post(`/api/leagues/${leagueId}/join-public`, {});
  }
};

export default leagueService;
export type { League, LeagueCreateData, LeagueUpdateData };