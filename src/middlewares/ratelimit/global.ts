import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { ApiResponse } from '@/utils/ApiResponse';

/**
 * Global API rate limiter middleware.
 * Applies a base limit to all incoming requests to prevent DDoS and brute-force.
 * 
 * Configuration (from env):
 * - windowMs: Time window (default: 15 mins)
 * - max: Max requests per IP in the window
 */
export const globalLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  // This disables the strict check that causes ERR_ERL_UNEXPECTED_X_FORWARDED_FOR.
  // It ensures the limiter trusts the IP address resolved by Express.
  validate: { xForwardedForHeader: false },
  message: ApiResponse.error('Too many requests, please try again later', 'RATE_LIMIT_EXCEEDED'),
});
