import { z } from 'zod';

export const getTrendsSchema = z.object({
  query: z.object({
    period: z.enum(['monthly', 'weekly']).optional().default('monthly'),
    year: z.string().transform(Number).optional().default(new Date().getFullYear().toString()).pipe(z.number().int().min(2000).max(2100)),
  }),
});

export const getRecentSchema = z.object({
  query: z.object({
    limit: z.string().transform(Number).optional().default('5').pipe(z.number().int().min(1).max(100)),
  }),
});
