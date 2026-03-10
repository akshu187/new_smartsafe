/* eslint-disable no-console */
const isProduction = process.env.NODE_ENV === 'production';

if (!isProduction) {
  process.exit(0);
}

const getEnv = (key) => {
  const value = process.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const requiredEnv = ['MONGODB_URI', 'JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET'];
const missing = requiredEnv.filter((key) => !getEnv(key));

if (missing.length > 0) {
  console.error(
    `[preflight] Missing required production environment variables: ${missing.join(', ')}`
  );
  process.exit(1);
}

const jwtAccessSecret = getEnv('JWT_ACCESS_SECRET');
const jwtRefreshSecret = getEnv('JWT_REFRESH_SECRET');

if (jwtAccessSecret.length < 32 || jwtRefreshSecret.length < 32) {
  console.error('[preflight] JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be at least 32 chars');
  process.exit(1);
}

const bannedFragments = ['replace-with', 'change-this', 'your-super-secret'];
const hasBannedSecret = bannedFragments.some(
  (fragment) =>
    jwtAccessSecret.toLowerCase().includes(fragment) ||
    jwtRefreshSecret.toLowerCase().includes(fragment)
);

if (hasBannedSecret) {
  console.error('[preflight] Refusing to start with default/example JWT secrets');
  process.exit(1);
}

if (!getEnv('FRONTEND_URLS') && !getEnv('FRONTEND_URL')) {
  console.warn(
    '[preflight] FRONTEND_URL or FRONTEND_URLS is not set. Browser clients may fail CORS checks.'
  );
}

if (!getEnv('TRUST_PROXY')) {
  console.warn(
    '[preflight] TRUST_PROXY is not set. For Railway production, set TRUST_PROXY=true.'
  );
}

if (!getEnv('COOKIE_SECURE')) {
  console.warn(
    '[preflight] COOKIE_SECURE is not set. For HTTPS production, set COOKIE_SECURE=true.'
  );
}
