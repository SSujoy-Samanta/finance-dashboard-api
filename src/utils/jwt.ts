import jwt, { SignOptions } from 'jsonwebtoken';
import { env } from '@/config/env';

/**
 * Data structure encoded within the JWT tokens.
 */
export interface TokenPayload {
  /** The unique user ID */
  userId: string;
  /** The user's email address */
  email: string;
  /** The user's assigned role (e.g., 'ADMIN', 'VIEWER') */
  role: string;
}

/**
 * Signs a new short-lived access token.
 * 
 * @param {TokenPayload} payload - The user information to encode.
 * @returns {string} - The generated JWT access token.
 */
export const signAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

/**
 * Signs a new long-lived refresh token.
 * 
 * @param {TokenPayload} payload - The user information to encode.
 * @returns {string} - The generated JWT refresh token.
 */
export const signRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as SignOptions['expiresIn'],
  });
};

/**
 * Verifies the integrity and expiration of an access token.
 * 
 * @param {string} token - The raw JWT access token.
 * @returns {TokenPayload} - The decoded payload.
 * @throws {JsonWebTokenError} - If the token is invalid or expired.
 */
export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as TokenPayload;
};

/**
 * Verifies the integrity and expiration of a refresh token.
 * 
 * @param {string} token - The raw JWT refresh token.
 * @returns {TokenPayload} - The decoded payload.
 * @throws {JsonWebTokenError} - If the token is invalid or expired.
 */
export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload;
};
