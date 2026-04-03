import { PrismaClient } from '@/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { env } from './env';
import logger from './logger';

/**
 * Establishes a connection to the PostgreSQL database using Prisma.
 * 
 * Configuration:
 * - Uses connection pooling via 'pg' library for performance.
 * - Enables query logging in development mode for debugging.
 * - Logs connection success or failure to the console.
 * 
 * @returns {Promise<void>} Resolves when the database connection is established.
 * @throws {Error} Exits the process if the database connection fails.
 */
const client = new pg.Pool({ 
  connectionString: env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});
const adapter = new PrismaPg(client);

const prismaClient = new PrismaClient({
  adapter,
  log:
    env.NODE_ENV === 'development'
      ? [
          { emit: 'event', level: 'query' },
          { emit: 'stdout', level: 'error' },
          { emit: 'stdout', level: 'info' },
          { emit: 'stdout', level: 'warn' },
        ]
      : ['error'],
  // Default transaction timeout (10s)
  transactionOptions: {
    timeout: 10000,
  },
} as any);

if (env.NODE_ENV === 'development') {
  prismaClient.$on('query' as never, (e: { query: string; params: string; duration: number }) => {
    logger.debug(`Query: ${e.query}`);
    logger.debug(`Params: ${e.params}`);
    logger.debug(`Duration: ${e.duration}ms`);
  });

  // Pool Telemetry: Log status periodically or when busy
  const logPoolStatus = () => {
    logger.debug(`[Pool] Total: ${client.totalCount} | Idle: ${client.idleCount} | Waiting: ${client.waitingCount}`);
  };

  // Log on every query in development to catch leaks
  prismaClient.$on('query' as never, () => {
    logPoolStatus();
  });
}

export const prisma = prismaClient;

export type ExtendedPrismaClient = typeof prisma;

export const connectDB = async () => {
  try {
    await prismaClient.$connect();
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error(error as Error, 'Database connection failed');
    process.exit(1);
  }
};
