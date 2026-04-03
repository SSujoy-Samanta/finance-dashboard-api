import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../utils/ApiResponse';

/**
 * Global 404 handler middleware.
 * Catches all requests that do not match any defined route and returns a structured error response.
 * 
 * @param {Request} req - Express request object.
 * @param {Response} res - Express response object.
 * @param {NextFunction} _next - Express next function.
 */
export const notFound = (req: Request, res: Response, _next: NextFunction) => {
  const error = ApiResponse.error(
    `Route not found - ${req.originalUrl}`,
    'NOT_FOUND',
  );
  res.status(404).json(error);
};
