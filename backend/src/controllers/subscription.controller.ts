import { Request, Response } from 'express';
import { z } from 'zod';
import * as subscriptionService from '../services/subscription.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const subscriptionSchema = z.object({
  customerId: z.string().min(1),
  milkType: z.enum(['COW', 'BUFFALO']),
  quantityPerDay: z.number().positive(),
  deliveryShift: z.string().min(1),
  startDate: z.string().or(z.date()),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await subscriptionService.listSubscriptions(getPagination(req));
  return successResponse(res, result.data, 'Subscriptions retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const sub = await subscriptionService.getSubscription(req.params.id);
  return successResponse(res, sub);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const sub = await subscriptionService.createSubscription(req.body);
  return successResponse(res, sub, 'Subscription created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const sub = await subscriptionService.updateSubscription(req.params.id, req.body);
  return successResponse(res, sub, 'Subscription updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const sub = await subscriptionService.deleteSubscription(req.params.id);
  return successResponse(res, sub, 'Subscription deactivated');
});
 
