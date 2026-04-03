import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import hpp from 'hpp';
import compression from 'compression';

import { env } from '@/config/env';
import { swaggerOptions, swaggerUiOptions } from '@/config/swagger';
import { ApiResponse } from '@/utils/ApiResponse';
import { errorHandler } from '@/middlewares/errorHandler';
import { notFound } from '@/middlewares/notFound';
import { httpLogger } from '@/middlewares/httpLogger';
import { globalLimiter } from '@/middlewares/ratelimit/global';

import authRoutes from '@/modules/auth/auth.routes';
import userRoutes from '@/modules/users/user.routes';
import recordRoutes from '@/modules/records/record.routes';
import dashboardRoutes from '@/modules/dashboard/dashboard.routes';
import auditRoutes from '@/modules/audit/audit.routes';

/**
 * Main Express application configuration.
 * Sets up the following:
 * - Security: Helmet and CORS.
 * - Parsers: JSON, URL-encoded, and cookie-parsers.
 * - Logging: pino-http for automatic request/response logging.
 * - Documentation: Swagger UI at /docs.
 * - Routes: Modularized API routes for auth, users, records, dashboard, and audit.
 * - Error Handling: Centralized 404 and global error handlers.
 */
const app: Application = express();

// Proxy Configuration
app.set('trust proxy', env.TRUST_PROXY);

// Global Rate Limiter
app.use(globalLimiter);

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(hpp());
app.use(compression());

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging Middleware
app.use(httpLogger);

// Root Welcome Route
app.get('/', (_req, res) => {
  res.json(
    ApiResponse.success(
      {
        name: 'Finance Dashboard API',
        version: '1.0.0',
        docs: '/docs',
        health: '/health',
      },
      'Welcome to the Finance Dashboard API',
    ),
  );
});

// Health Check
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
  });
});

// API Documentation
let swaggerSpec: object;

try {
  // Try to load pre-generated swagger.json (Production)
  // We use a try-catch because the file is generated during build
  const { default: staticSpec } = await import('./generated/swagger/spec.json', { with: { type: 'json' } });
  swaggerSpec = staticSpec;
} catch (error) {
  // Fallback to dynamic generation (Development)
  swaggerSpec = swaggerJsdoc(swaggerOptions);
}

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, swaggerUiOptions));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/audit', auditRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

export default app;
