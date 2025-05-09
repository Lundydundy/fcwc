'use client';

import React, { createContext, useState, useContext, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import authService from '../api/authService';

// Define the user type
interface User {
  id: string;
  name: string;
  email: string;
}

// Define the auth context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; message?: string }>;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  register: async () => ({ success: false }),
});

// Public routes that don't require authentication
const publicRoutes = ['/', '/auth/login', '/auth/register'];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check if current route is public
  const isPublicRoute = publicRoutes.includes(pathname || '');

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Check if user is logged in
        if (authService.isAuthenticated()) {
          const currentUser = authService.getCurrentUser();
          setUser(currentUser);
        } else {
          // If not on public route and not authenticated, redirect to login
          if (!isPublicRoute) {
            router.push('/auth/login');
          }
        }
      } catch (error) {
        console.error('Authentication error:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, isPublicRoute, router]);

  // Handle user login
  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        setUser(response.user || null);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Login failed'
      };
    }
  };

  // Handle user logout
  const logout = () => {
    authService.logout();
    setUser(null);
    router.push('/auth/login');
  };

  // Handle user registration
  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await authService.register({ name, email, password });
      
      if (response.success) {
        setUser(response.user || null);
        return { success: true };
      }
      
      return { success: false, message: response.message };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  };

  // Provide authentication context to children components
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        register,
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => useContext(AuthContext);

export default AuthContext;