import apiClient from './apiClient';

interface League {
  _id: string;
  name: string;
  description?: string;
  createdBy: string;
  isPublic: boolean;
  maxTeams?: number;
  createdAt?: string;
  updatedAt?: string;
}

interface LeagueCreateData {
  name: string;
  description?: string;
  isPublic: boolean;
  maxTeams?: number;
}

interface LeagueUpdateData {
  name?: string;
  description?: string;
  isPublic?: boolean;
  maxTeams?: number;
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
    return await apiClient.get('/api/leagues/joined');
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
   * Join a league
   */
  joinLeague: async (leagueId: string): Promise<{ success: boolean, message: string }> => {
    return await apiClient.post(`/api/leagues/${leagueId}/join`, {});
  },

  /**
   * Leave a league
   */
  leaveLeague: async (leagueId: string): Promise<{ success: boolean, message: string }> => {
    return await apiClient.delete(`/api/leagues/${leagueId}/leave`);
  }
};

export default leagueService;
export type { League, LeagueCreateData, LeagueUpdateData };