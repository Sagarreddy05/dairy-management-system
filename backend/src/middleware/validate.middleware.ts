import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { AppError } from '../utils/AppError';

type Source = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, source: Source = 'body') => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);
    if (!result.success) {
      const message = result.error.errors.map((e) => e.message).join(', ');
      return next(new AppError(message, 400));
    }
    req[source] = result.data;
    next();
  };
};
