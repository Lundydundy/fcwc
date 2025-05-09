import apiClient from './apiClient';

interface User {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

interface UserUpdateData {
  name?: string;
  email?: string;
  password?: string;
}

/**
 * User service for handling user-related operations
 */
const userService = {
  /**
   * Get current user profile
   */
  getCurrentProfile: async (): Promise<User> => {
    return await apiClient.get('/api/users/me');
  },

  /**
   * Update user profile
   */
  updateProfile: async (userData: UserUpdateData): Promise<User> => {
    return await apiClient.put('/api/users/me', userData);
  },

  /**
   * Get user by ID (admin only)
   */
  getUserById: async (userId: string): Promise<User> => {
    return await apiClient.get(`/api/users/${userId}`);
  },

  /**
   * Get all users (admin only)
   */
  getAllUsers: async (): Promise<User[]> => {
    return await apiClient.get('/api/users');
  },
};

export default userService;