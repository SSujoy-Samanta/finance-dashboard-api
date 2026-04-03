import { cleanEnv, str, num, bool } from 'envalid';
import dotenv from 'dotenv';
import path from 'path';

/**
 * Environment variable configuration using envalid.
 * Loads variables from .env file and validates them against defined types and constraints.
 * 
 * Available variables:
 * - NODE_ENV: Environment mode (development|production|test)
 * - PORT: Server port number
 * - DATABASE_URL: PostgreSQL connection string
 * - JWT_ACCESS_SECRET: Secret key for JWT access token signing
 * - JWT_REFRESH_SECRET: Secret key for JWT refresh token signing
 * - JWT_ACCESS_EXPIRES_IN: Expiration time for access tokens
 * - JWT_REFRESH_EXPIRES_IN: Expiration time for refresh tokens
 * - CORS_ORIGIN: Allowed CORS origins
 * - RATE_LIMIT_WINDOW_MS: Rate limiting window duration in milliseconds
 * - RATE_LIMIT_MAX: Maximum number of requests allowed per window
 * - TRUST_PROXY: Whether to trust proxy headers (required for rate-limiting behind LB)
 */
dotenv.config({
  path: path.join(
    process.cwd(),
    process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
  ),
});

// For build-time tasks (like Swagger generation), we skip strict validation
// by providing dummy values, ensuring real secrets aren't needed in the Dockerfile.
const isBuildTime = process.env.SKIP_ENV_VALIDATION === 'true';
const mockEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgresql://dummy:dummy@localhost:5432/dummy',
  JWT_ACCESS_SECRET: 'dummy_secret',
  JWT_REFRESH_SECRET: 'dummy_secret',
};

const envVars = isBuildTime ? { ...process.env, ...mockEnv } : process.env;

export const env = cleanEnv(envVars, {
  NODE_ENV: str({ choices: ['development', 'production', 'test'] }),
  PORT: num({ default: 3000 }),
  DATABASE_URL: str(),
  JWT_ACCESS_SECRET: str(),
  JWT_REFRESH_SECRET: str(),
  JWT_ACCESS_EXPIRES_IN: str({ default: '15m' }),
  JWT_REFRESH_EXPIRES_IN: str({ default: '7d' }),
  CORS_ORIGIN: str({ default: 'http://localhost:3000' }),
  RATE_LIMIT_WINDOW_MS: num({ default: 900000 }),
  RATE_LIMIT_MAX: num({ default: 100 }),
  TRUST_PROXY: bool({ default: false }),
  LOG_LEVEL: str({ choices: ['debug', 'info', 'warn', 'error', 'silent'], default: 'info' }),
});
