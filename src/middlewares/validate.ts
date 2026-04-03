import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';
import { catchAsync } from '@/utils/catchAsync';

/**
 * Reusable validation middleware that parses and validates request data against a Zod schema.
 * Supports validation of 'body', 'query', and 'params' simultaneously.
 * 
 * After successful validation, it updates the original Express Request objects 
 * with the sanitized/transformed data.
 * 
 * @param {AnyZodObject | ZodEffects<AnyZodObject>} schema - The Zod schema to validate against.
 * @returns {Function} - An Express middleware function.
 * @throws {ZodError} - If parsing fails, which is subsequently caught by the global error handler.
 */
export const validate = (schema: AnyZodObject | ZodEffects<AnyZodObject>) =>
  catchAsync(async (req: Request, _res: Response, next: NextFunction) => {
    const validated = await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (validated.body) req.body = validated.body;
    if (validated.query) {
      Object.assign(req.query, validated.query);
    }
    if (validated.params) {
      Object.assign(req.params, validated.params);
    }

    next();
  });
