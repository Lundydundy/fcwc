import apiClient from './apiClient';

const gameweekService = {
  async getCurrentGameweek() {
    // Assumes backend endpoint: /api/gameweeks/current
    const response = await apiClient.get('/api/gameweeks/current');
    return response.data;
  },
  // Optionally, add more methods for gameweek history, etc.
};

export default gameweekService;
