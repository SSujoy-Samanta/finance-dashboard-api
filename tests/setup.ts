import { beforeAll, afterAll } from 'vitest';
import { prisma } from '@/config/db';

beforeAll(async () => {
  // In a real environment, we'd run migrations
  // execSync('pnpm prisma migrate reset --force');
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});
