import rateLimit from 'express-rate-limit';
import { env } from '@/config/env';
import { ApiResponse } from '@/utils/ApiResponse';

/**
 * Standard API rate limiter middleware.
 * Applies a reasonable limit for data-fetching and resource-management endpoints.
 * 
 * Configuration:
 * - windowMs: 15 minutes (900,000 ms)
 * - max: 100 requests per window (to allow for multiple dashboard gadget loads)
 */
export const standardLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: 100, // Higher limit than auth but safer than unlimited
  standardHeaders: true,
  legacyHeaders: false,
  message: ApiResponse.error('Too many requests, please try again after 15 minutes', 'RATE_LIMIT_EXCEEDED'),
});
