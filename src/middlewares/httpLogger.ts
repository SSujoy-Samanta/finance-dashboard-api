import logger, { createHttpLogger } from '@/config/logger';

/**
 * HTTP request logger middleware.
 * Uses pino-http for structured, high-performance logging.
 *
 * - Concise output: method, url, status, duration, ip.
 * - Automatic redaction of sensitive headers.
 * - Health check logs suppression.
 * - Status-based log levels (Error for 5xx, Warn for 4xx).
 */
export const httpLogger = createHttpLogger(logger, {
  autoLogging: {
    ignore(req) {
      const url = req.url ?? '';
      // Suppress /health and /docs static assets (CSS, JS, images)
      return (
        url === '/health' ||
        (url.startsWith('/docs') && url !== '/docs/' && url !== '/docs')
      );
    },
  },
});
