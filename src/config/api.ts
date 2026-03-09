/**
 * API Configuration
 * Base URLs and endpoint definitions
 */

const removeTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

export const API_BASE_URL = removeTrailingSlash(
  import.meta.env.VITE_API_URL || 'http://localhost:5000/api'
);
export const SOCKET_URL = removeTrailingSlash(
  import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'
);

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  auth: {
    register: `${API_BASE_URL}/auth/register`,
    login: `${API_BASE_URL}/auth/login`,
    refresh: `${API_BASE_URL}/auth/refresh`,
    logout: `${API_BASE_URL}/auth/logout`,
  },
  users: {
    me: `${API_BASE_URL}/users/me`,
  },
  trips: {
    base: `${API_BASE_URL}/trips`,
    byId: (id: string) => `${API_BASE_URL}/trips/${id}`,
  },
  crashes: {
    base: `${API_BASE_URL}/crashes`,
    byId: (id: string) => `${API_BASE_URL}/crashes/${id}`,
  },
  fleet: {
    drivers: `${API_BASE_URL}/fleet/drivers`,
    rankings: `${API_BASE_URL}/fleet/rankings`,
  },
};
