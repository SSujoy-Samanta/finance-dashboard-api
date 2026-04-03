import pino, { type Logger, type LoggerOptions } from 'pino';
import pinoHttp, { type Options as PinoHttpOptions } from 'pino-http';
import { env } from './env';

// ── Types ────────────────────────────────────────────────────────

export type { Logger } from 'pino';
export type { HttpLogger } from 'pino-http';

export interface CreateLoggerOptions {
  serviceName: string;
  level?: string;
}

// ── Base logger factory ──────────────────────────────────────────

export function createLogger(options: CreateLoggerOptions): Logger {
  const { serviceName, level } = options;

  const isDev = env.NODE_ENV === 'development';

  const baseOptions: LoggerOptions = {
    name: serviceName,
    level: level ?? env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),

    // Redact sensitive fields from logs
    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.passwordHash',
        'req.body.token',
        'req.body.refreshToken',
        'req.body.otp',
        '*.password',
        '*.passwordHash',
        '*.token',
        '*.refreshToken',
        '*.secret',
      ],
      censor: '[REDACTED]',
    },

    // Standard fields on every log line
    base: {
      service: serviceName,
      env: env.NODE_ENV ?? 'development',
    },

    // ISO timestamp
    timestamp: pino.stdTimeFunctions.isoTime,

    // Serialize errors properly
    serializers: {
      err: pino.stdSerializers.err,
      error: pino.stdSerializers.err,
      req: pino.stdSerializers.req,
      res: pino.stdSerializers.res,
    },
  };

  // Pretty print in development only
  if (isDev) {
    return pino({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss',
          ignore: 'pid,hostname,service,env',
          messageFormat: '{msg}',
          singleLine: false,
        },
      },
    });
  }

  // JSON in production — structured for log aggregators (Datadog, Loki etc)
  // Async logging improves performance by not blocking the event loop on every log write.
  return pino(
    baseOptions,
    pino.destination({ sync: false, minLength: 4096 }),
  );
}

// ── HTTP request logger factory ──────────────────────────────────

export function createHttpLogger(loggerInstance: Logger, options?: PinoHttpOptions) {
  return pinoHttp({
    logger: loggerInstance,

    // Custom log level per status code
    customLogLevel(_req, res, err) {
      if (res.statusCode >= 500 || err) return 'error';
      if (res.statusCode >= 400) return 'warn';
      if (res.statusCode >= 300) {
        // Show redirection logs only in debug/trace mode
        return loggerInstance.level === 'debug' || loggerInstance.level === 'trace' ? 'info' : 'silent';
      }
      return 'info';
    },

    // Custom success message
    customSuccessMessage(req, res) {
      return `${req.method} ${req.url} ${res.statusCode}`;
    },

    // Custom error message
    customErrorMessage(req, res, err) {
      return `${req.method} ${req.url} ${res.statusCode} — ${err.message}`;
    },

    // Skip health check logs — too noisy
    customAttributeKeys: {
      req: 'request',
      res: 'response',
      err: 'error',
      responseTime: 'duration',
    },

    // Do not log health check endpoints
    autoLogging: {
      ignore(req) {
        return req.url === '/health';
      },
    },

    serializers: {
      req(req) {
        return {
          method: req.method,
          url: req.url,
          remoteAddress: req.remoteAddress,
          userAgent: req.headers?.['user-agent'],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },

    ...options,
  });
}

// Default export for backward compatibility
const logger = createLogger({ serviceName: 'finance-dashboard-api' });
export default logger;
