import { Request, Response } from 'express';
import { z } from 'zod';
import * as authService from '../services/auth.service';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';

export const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const result = await authService.login(email, password);
  return successResponse(res, result, 'Login successful');
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.getMe(req.user!.id);
  return successResponse(res, user, 'User profile retrieved');
});
