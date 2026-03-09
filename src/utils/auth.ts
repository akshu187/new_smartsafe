import type { User, UserRole } from '../types';

const STORAGE_KEY = 'smartsafe_current_user';

export interface AuthError {
  code: 'UNAUTHORIZED' | 'FORBIDDEN' | 'INVALID_CREDENTIALS';
  message: string;
}

/**
 * Check if a user has admin privileges
 */
export function isAdmin(user: User | null): boolean {
  return user?.role === 'admin';
}

/**
 * Check if a user has driver privileges (all users have driver access)
 */
export function isDriver(user: User | null): boolean {
  return user !== null && (user.role === 'driver' || user.role === 'admin');
}

/**
 * Verify if user has required role for accessing a feature
 */
export function hasRole(user: User | null, requiredRole: UserRole): boolean {
  if (!user) return false;
  
  // Admins have access to all features
  if (user.role === 'admin') return true;
  
  // Check specific role
  return user.role === requiredRole;
}

/**
 * Get authorization error for fleet dashboard access
 */
export function getFleetAccessError(user: User | null): AuthError | null {
  if (!user) {
    return {
      code: 'UNAUTHORIZED',
      message: 'You must be logged in to access the fleet dashboard'
    };
  }
  
  if (!isAdmin(user)) {
    return {
      code: 'FORBIDDEN',
      message: 'Access denied - administrator privileges required'
    };
  }
  
  return null;
}

/**
 * Save current user to localStorage
 */
export function saveCurrentUser(user: User): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } catch (err) {
    console.error('Failed to save user:', err);
  }
}

/**
 * Get current user from localStorage
 */
export function getCurrentUser(): User | null {
  try {
    const userData = localStorage.getItem(STORAGE_KEY);
    if (!userData) return null;
    
    return JSON.parse(userData) as User;
  } catch (err) {
    console.error('Failed to load user:', err);
    return null;
  }
}

/**
 * Clear current user from localStorage
 */
export function clearCurrentUser(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear user:', err);
  }
}

/**
 * Mock login function for demo purposes
 * In production, this would call a backend API
 */
export function mockLogin(email: string, password: string): User | null {
  // Simple mock authentication
  if (email.includes('admin')) {
    return {
      id: 'admin-1',
      name: 'Admin User',
      email: email,
      role: 'admin'
    };
  } else if (email.includes('driver') || password.length > 0) {
    return {
      id: 'driver-1',
      name: 'Driver User',
      email: email,
      role: 'driver'
    };
  }
  
  return null;
}
