import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@/generated/prisma/client';
import jwt from 'jsonwebtoken';
import { AppError } from '@/utils/AppError';
import { ApiResponse } from '@/utils/ApiResponse';
import logger from '@/config/logger';
import { env } from '@/config/env';

/**
 * Global error handling middleware for the Express application.
 * Catches and formats various types of errors into a standardized API response.
 * 
 * Log levels are chosen based on severity:
 * - ZodError (422): debug — expected client errors, not actionable
 * - Prisma conflicts/not found (409/404): debug — expected data errors
 * - JWT errors (401): warn — possible token abuse or expiry
 * - AppError: warn if < 500, error if >= 500
 * - Default 5xx: error — unexpected/programming errors
 */
export const errorHandler = (
  err: Error | AppError | unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  const error = err as Record<string, unknown> & Error;

  // Zod Validation Error — client sent invalid data, no server-side alert needed
  if (err instanceof ZodError) {
    logger.debug({ issues: err.errors.map(e => ({ path: e.path.join('.'), message: e.message })) }, 'Validation failed');
    const details = err.errors.map((e) => ({
      path: e.path.join('.'),
      message: e.message,
    }));
    return res
      .status(422)
      .json(ApiResponse.error('Validation Error', 'VALIDATION_ERROR', details));
  }

  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    const prismaErr = err as Prisma.PrismaClientKnownRequestError;
    if (prismaErr.code === 'P2002') {
      const field = (prismaErr.meta?.target as string[])?.join(', ') || 'field';
      logger.debug({ field, code: prismaErr.code }, 'Duplicate entry');
      return res
        .status(409)
        .json(
          ApiResponse.error(
            `Duplicate entry for ${field}`,
            'DUPLICATE_ENTRY',
            prismaErr.meta,
          ),
        );
    }
    if (prismaErr.code === 'P2025') {
      logger.debug({ code: prismaErr.code }, 'Record not found');
      return res
        .status(404)
        .json(ApiResponse.error('Record not found', 'NOT_FOUND'));
    }
    // Unknown Prisma error — log as error
    logger.error({ code: prismaErr.code, meta: prismaErr.meta }, 'Prisma error');
  }

  // JWT Errors — warn level (potential token abuse or expiry)
  if (err instanceof jwt.TokenExpiredError) {
    logger.warn('JWT token expired');
    return res
      .status(401)
      .json(ApiResponse.error('Token expired', 'TOKEN_EXPIRED'));
  }
  if (err instanceof jwt.JsonWebTokenError) {
    logger.warn({ message: err.message }, 'Invalid JWT token');
    return res
      .status(401)
      .json(ApiResponse.error('Invalid token', 'INVALID_TOKEN'));
  }

  // Custom AppError — warn for client errors (< 500), error for server errors
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error({ code: err.code, statusCode: err.statusCode }, err.message);
    } else {
      logger.warn({ code: err.code, statusCode: err.statusCode }, err.message);
    }
    return res
      .status(err.statusCode)
      .json(ApiResponse.error(err.message, err.code));
  }

  // Default Internal Server Error — always log at error level with full details
  const statusCode = (error.statusCode as number) || 500;
  const message =
    env.NODE_ENV === 'production' && !(error as Record<string, unknown>).isOperational
      ? 'Internal Server Error'
      : error.message || 'Internal Server Error';

  logger.error({ err, statusCode }, 'Unhandled error');

  return res.status(statusCode).json(ApiResponse.error(message, 'INTERNAL_ERROR'));
};
