import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { errorResponse } from '../utils/apiResponse';

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return errorResponse(res, err.message, err.statusCode);
  }

  console.error('Unhandled error:', err);
  return errorResponse(res, 'Internal server error', 500);
};

export const notFoundHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError('Route not found', 404));
};

export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
