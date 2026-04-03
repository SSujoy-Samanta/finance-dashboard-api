import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { ApiResponse } from '@/utils/ApiResponse';

/**
 * Authentication-specific rate limiter middleware.
 * Implements stricter limits for security-critical endpoints (login/register).
 * 
 * Configuration:
 * - windowMs: 15 minutes (900,000 ms)
 * - max: 15 requests per security-critical endpoint
 */
export const authLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: ApiResponse.error('Too many authentication attempts, please try again after 15 minutes', 'AUTH_RATE_LIMIT_EXCEEDED'),
});
