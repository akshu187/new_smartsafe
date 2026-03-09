import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';

/**
 * JWT Payload Interface
 */
export interface IJwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'driver';
}

/**
 * Generate Access Token (15 minutes)
 */
export const generateAccessToken = (payload: IJwtPayload): string => {
  const secret: Secret = jwtConfig.access.secret as Secret;
  const options: SignOptions = {
    expiresIn: jwtConfig.access.expiresIn as any,
  };
  return jwt.sign(payload, secret, options);
};

/**
 * Generate Refresh Token (7 days)
 */
export const generateRefreshToken = (payload: IJwtPayload): string => {
  const secret: Secret = jwtConfig.refresh.secret as Secret;
  const options: SignOptions = {
    expiresIn: jwtConfig.refresh.expiresIn as any,
  };
  return jwt.sign(payload, secret, options);
};

/**
 * Verify Access Token
 */
export const verifyAccessToken = (token: string): IJwtPayload => {
  try {
    const secret: Secret = jwtConfig.access.secret as Secret;
    return jwt.verify(token, secret) as IJwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

/**
 * Verify Refresh Token
 */
export const verifyRefreshToken = (token: string): IJwtPayload => {
  try {
    return jwt.verify(token, jwtConfig.refresh.secret) as IJwtPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Generate Token Pair (Access + Refresh)
 */
export const generateTokenPair = (payload: IJwtPayload) => {
  return {
    accessToken: generateAccessToken(payload),
    refreshToken: generateRefreshToken(payload),
  };
};
