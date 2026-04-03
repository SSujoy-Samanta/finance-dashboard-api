import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * A wrapper for asynchronous Express route handlers.
 * Ensures that any errors occurring inside the async function are 
 * caught and passed to the next() function for centralized error handling.
 * 
 * Eliminates the need for manual try-catch blocks in every controller handler.
 * 
 * @param {RequestHandler} fn - The asynchronous handler function to wrap.
 * @returns {Function} - A standard Express request handler.
 */
export const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
