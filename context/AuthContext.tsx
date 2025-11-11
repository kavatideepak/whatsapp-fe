/**
 * Auth Context
 * Provides authentication state and user data throughout the app
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { clearAuthToken, getAuthToken, getUserData, storeAuthData } from '../services/api';
import { User } from '../types/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, user: User) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load auth data on mount
  useEffect(() => {
    loadAuthData();
  }, []);

  const loadAuthData = async () => {
    try {
      setIsLoading(true);
      const [storedToken, storedUser] = await Promise.all([
        getAuthToken(),
        getUserData(),
      ]);

      setToken(storedToken);
      setUser(storedUser);
    } catch (error) {
      console.error('Failed to load auth data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (newToken: string, newUser: User) => {
    try {
      await storeAuthData(newToken, newUser);
      setToken(newToken);
      setUser(newUser);
    } catch (error) {
      console.error('Failed to login:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await clearAuthToken();
      setToken(null);
      setUser(null);
    } catch (error) {
      console.error('Failed to logout:', error);
      throw error;
    }
  };

  const updateUser = async (updatedUser: User) => {
    try {
      if (!token) {
        throw new Error('No token available');
      }
      await storeAuthData(token, updatedUser);
      setUser(updatedUser);
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  };

  const refreshAuth = async () => {
    await loadAuthData();
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token && !!user,
    login,
    logout,
    updateUser,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to use auth context
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

/**
 * Hook to get current user ID (convenience)
 */
export function useUserId(): number | null {
  const { user } = useAuth();
  return user?.id ?? null;
}

/**
 * Hook to get current user phone number (convenience)
 */
export function useUserPhone(): string | null {
  const { user } = useAuth();
  return user?.phone_number ?? null;
}
