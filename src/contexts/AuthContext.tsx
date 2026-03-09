import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  login as loginService,
  logout as logoutService,
  register as registerService,
  getCurrentUser,
  isAuthenticated,
  fetchCurrentUser,
} from '../services/authService';
import type { LoginData, RegisterData } from '../services/authService';

/**
 * Auth Context
 * Manages authentication state across the app
 */

interface User {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver';
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginData) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Initialize auth state on mount
   * Checks if user is already logged in
   */
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (isAuthenticated()) {
          const currentUser = getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
          }

          try {
            const verifiedUser = await fetchCurrentUser();
            setUser(verifiedUser);
            localStorage.setItem('user', JSON.stringify(verifiedUser));
          } catch {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Clear invalid tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
      } finally {
        setIsLoading(false);
      }
    };

    void initAuth();
  }, []);

  /**
   * Login handler
   */
  const login = async (data: LoginData) => {
    try {
      const response = await loginService(data);
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Login error:', error);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Login failed'
      );
    }
  };

  /**
   * Register handler
   */
  const register = async (data: RegisterData) => {
    try {
      const response = await registerService(data);
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Register error:', error);
      throw new Error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          'Registration failed'
      );
    }
  };

  /**
   * Logout handler
   */
  const logout = async () => {
    try {
      await logoutService();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
