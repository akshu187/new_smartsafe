import dotenv from 'dotenv';

dotenv.config();

type SameSite = 'lax' | 'strict' | 'none';

const getEnv = (key: string): string | undefined => {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : undefined;
};

const getRequiredEnv = (key: string): string => {
  const value = getEnv(key);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
};

const parseNumber = (key: string, fallback: number): number => {
  const raw = getEnv(key);
  if (!raw) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Invalid numeric environment variable: ${key}`);
  }
  return parsed;
};

const parseOrigins = (value?: string): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
};

const parseBoolean = (key: string, fallback: boolean): boolean => {
  const raw = getEnv(key);
  if (!raw) {
    return fallback;
  }
  return raw.toLowerCase() === 'true';
};

const parseSameSite = (key: string, fallback: SameSite): SameSite => {
  const raw = getEnv(key);
  if (!raw) {
    return fallback;
  }
  const normalized = raw.toLowerCase();
  if (normalized !== 'lax' && normalized !== 'strict' && normalized !== 'none') {
    throw new Error(`Invalid value for ${key}. Expected one of: lax, strict, none`);
  }
  return normalized;
};

const nodeEnv = getEnv('NODE_ENV') || 'development';
const isProduction = nodeEnv === 'production';

const jwtAccessSecret = getRequiredEnv('JWT_ACCESS_SECRET');
const jwtRefreshSecret = getRequiredEnv('JWT_REFRESH_SECRET');
if (jwtAccessSecret.length < 32 || jwtRefreshSecret.length < 32) {
  throw new Error('JWT secrets must be at least 32 characters');
}

if (
  jwtAccessSecret.includes('change-this') ||
  jwtRefreshSecret.includes('change-this')
) {
  throw new Error('Default JWT secrets are not allowed');
}

const frontendOriginsFromList = parseOrigins(getEnv('FRONTEND_URLS'));
const frontendOrigins =
  frontendOriginsFromList.length > 0
    ? frontendOriginsFromList
    : parseOrigins(getEnv('FRONTEND_URL'));

const socketOriginsFromList = parseOrigins(getEnv('SOCKET_CORS_ORIGINS'));
const socketOrigins =
  socketOriginsFromList.length > 0
    ? socketOriginsFromList
    : parseOrigins(getEnv('SOCKET_CORS_ORIGIN'));

const cookieSecure = parseBoolean('COOKIE_SECURE', isProduction);
const cookieSameSite = parseSameSite('COOKIE_SAME_SITE', 'lax');

if (cookieSameSite === 'none' && !cookieSecure) {
  throw new Error('COOKIE_SAME_SITE=none requires COOKIE_SECURE=true');
}

export const env = {
  nodeEnv,
  isProduction,
  port: parseNumber('PORT', 5000),
  mongoUri: getRequiredEnv('MONGODB_URI'),
  jwtAccessSecret,
  jwtRefreshSecret,
  jwtAccessExpiry: getEnv('JWT_ACCESS_EXPIRY') || '15m',
  jwtRefreshExpiry: getEnv('JWT_REFRESH_EXPIRY') || '7d',
  frontendOrigins:
    frontendOrigins.length > 0 ? frontendOrigins : ['http://localhost:3000'],
  socketOrigins: socketOrigins.length > 0 ? socketOrigins : ['http://localhost:3000'],
  rateLimitWindowMs: parseNumber('RATE_LIMIT_WINDOW_MS', 900000),
  rateLimitMaxRequests: parseNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  trustProxy: parseBoolean('TRUST_PROXY', isProduction),
  cookieSecure,
  cookieSameSite,
  enableLiveIncidentFetch: parseBoolean('ENABLE_LIVE_INCIDENT_FETCH', false),
  liveIncidentProvider: getEnv('LIVE_INCIDENT_PROVIDER') || 'tomtom',
  tomtomApiKey: getEnv('TOMTOM_API_KEY'),
  liveIncidentCacheTtlSec: parseNumber('LIVE_INCIDENT_CACHE_TTL_SEC', 120),
  liveIncidentRequestTimeoutMs: parseNumber('LIVE_INCIDENT_REQUEST_TIMEOUT_MS', 7000),
  liveIncidentMaxRadiusKm: parseNumber('LIVE_INCIDENT_MAX_RADIUS_KM', 80),
  // Default disabled so production-like behavior does not silently degrade to demo data.
  enableInMemoryDbFallback: parseBoolean('ENABLE_IN_MEMORY_DB_FALLBACK', false),
};

export type EnvConfig = typeof env;
