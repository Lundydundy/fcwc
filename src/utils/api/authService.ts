import apiClient from './apiClient';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  success: boolean;
  token?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  message?: string;
}

/**
 * Authentication service for handling user login and registration
 */
const authService = {
  /**
   * Login a user with email and password
   */
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/login', credentials);
    
    // If login is successful, store the token
    if (response.token) {
      localStorage.setItem('token', response.token);
      // Store basic user info
      localStorage.setItem('user', JSON.stringify(response.user));
    }
    
    return response;
  },

  /**
   * Register a new user
   */
  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const response = await apiClient.post('/api/auth/register', userData);
    
    // If registration is successful and contains a token, store it (auto-login)
    if (response.success && response.token) {
      localStorage.setItem('token', response.token);
      // Store basic user info if available
      if (response.user) {
        localStorage.setItem('user', JSON.stringify(response.user));
      }
    }
    
    return response;
  },

  /**
   * Logout the current user
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Check if user is currently logged in
   */
  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('token');
  },

  /**
   * Get current user data from localStorage
   */
  getCurrentUser: () => {
    if (typeof window === 'undefined') return null;
    const userJson = localStorage.getItem('user');
    return userJson ? JSON.parse(userJson) : null;
  },

  /**
   * Get the current auth token
   */
  getToken: (): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }
};

export default authService;