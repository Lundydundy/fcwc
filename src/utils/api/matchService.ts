import apiClient from './apiClient';

const matchService = {
  // Get all fixtures/matches
  getAllMatches: async () => {
    try {
      const response = await apiClient.get('/api/matches');
      return response.data;
    } catch (error) {
      console.error('Error fetching matches:', error);
      throw error;
    }
  },

  // Get upcoming matches
  getUpcomingMatches: async () => {
    try {
      const response = await apiClient.get('/api/matches?status=upcoming');
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming matches:', error);
      throw error;
    }
  },

  // Get completed matches with results
  getCompletedMatches: async () => {
    try {
      const response = await apiClient.get('/api/matches?status=completed');
      return response.data;
    } catch (error) {
      console.error('Error fetching completed matches:', error);
      throw error;
    }
  },

  // Get match details by ID
  getMatchById: async (id: string) => {
    try {
      const response = await apiClient.get(`/api/matches/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching match ${id}:`, error);
      throw error;
    }
  }
};

export default matchService;