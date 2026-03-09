import { env } from './env';

/**
 * JWT Configuration
 * Access Token: 15 minutes (short-lived for security)
 * Refresh Token: 7 days (stored in httpOnly cookie)
 */

export const jwtConfig = {
  access: {
    secret: env.jwtAccessSecret as string,
    expiresIn: env.jwtAccessExpiry as string,
  },
  refresh: {
    secret: env.jwtRefreshSecret as string,
    expiresIn: env.jwtRefreshExpiry as string,
  },
  cookie: {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
  },
};

export default jwtConfig;
