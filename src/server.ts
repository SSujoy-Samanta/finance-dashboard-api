import 'dotenv/config';
import { createServer } from 'http';
import app from '@/app';
import { env } from '@/config/env';
import logger from '@/config/logger';
import { connectDB, prisma } from '@/config/db';

const server = createServer(app);

/**
 * Bootstraps the server application.
 * 1. Connects to the database.
 * 2. Starts the HTTP server listener on the configured port.
 * 
 * @async
 * @returns {Promise<void>}
 */
const startServer = async () => {
  try {
    await connectDB();

    server.listen(env.PORT, () => {
      logger.info(
        `Server is running on http://localhost:${env.PORT} in ${env.NODE_ENV} mode`,
      );
      logger.info(`API Documentation available at http://localhost:${env.PORT}/docs`);
    });
  } catch (error) {
    logger.error(error as Error, 'Failed to start server');
    process.exit(1);
  }
};

startServer();

// Graceful Shutdown
/**
 * Performs a graceful shutdown of the application.
 * Closes the HTTP server first, then disconnects from the database.
 * Forcefully exits if the shutdown takes longer than 10 seconds.
 * 
 * @async
 * @param {string} signal - The termination signal received.
 */
const shutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  
  server.close(async (err) => {
    if (err) {
      logger.error(err, 'Error during server close');
      process.exit(1);
    }

    try {
      await prisma.$disconnect();
      logger.info('Database disconnected');
      process.exit(0);
    } catch (dbErr) {
      logger.error(dbErr as Error, 'Error during database disconnect');
      process.exit(1);
    }
  });

  // Force exit after 10s
  setTimeout(() => {
    logger.warn('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ promise, reason }, 'Unhandled Rejection');
  // In production, we might want to exit and let a process manager restart
});

process.on('uncaughtException', (error) => {
  logger.error(error, 'Uncaught Exception');
  process.exit(1);
});
