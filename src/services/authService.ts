import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from '../config/api';

/**
 * Authentication Service
 * Handles all auth-related API calls
 */

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    user: {
      _id: string;
      name: string;
      email: string;
      role: 'admin' | 'driver';
    };
    accessToken: string;
  };
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  role: 'admin' | 'driver';
}

/**
 * Register new user
 */
export const register = async (data: RegisterData): Promise<AuthResponse> => {
  const response = await axiosInstance.post(API_ENDPOINTS.auth.register, data);
  
  // Save tokens
  if (response.data.success) {
    localStorage.setItem('accessToken', response.data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  
  return response.data;
};

/**
 * Login user
 */
export const login = async (data: LoginData): Promise<AuthResponse> => {
  const response = await axiosInstance.post(API_ENDPOINTS.auth.login, data);
  
  // Save tokens
  if (response.data.success) {
    localStorage.setItem('accessToken', response.data.data.accessToken);
    localStorage.setItem('user', JSON.stringify(response.data.data.user));
  }
  
  return response.data;
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    await axiosInstance.post(API_ENDPOINTS.auth.logout);
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    // Clear local storage
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
  }
};

/**
 * Refresh access token
 * Called automatically by axios interceptor
 */
export const refreshToken = async (): Promise<string> => {
  const response = await axiosInstance.post(API_ENDPOINTS.auth.refresh);
  
  const newAccessToken = response.data.data.accessToken;
  localStorage.setItem('accessToken', newAccessToken);
  
  return newAccessToken;
};

/**
 * Get current user from localStorage
 */
export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (!userStr) {
    return null;
  }

  try {
    return JSON.parse(userStr);
  } catch {
    localStorage.removeItem('user');
    return null;
  }
};

/**
 * Fetch current authenticated user from backend
 */
export const fetchCurrentUser = async (): Promise<AuthUser> => {
  const response = await axiosInstance.get(API_ENDPOINTS.users.me);
  return response.data.data.user;
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!localStorage.getItem('accessToken');
};

/**
 * Get access token
 */
export const getAccessToken = (): string | null => {
  return localStorage.getItem('accessToken');
};
