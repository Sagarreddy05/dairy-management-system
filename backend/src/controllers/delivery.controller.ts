import { Request, Response } from 'express';
import { z } from 'zod';
import * as deliveryService from '../services/delivery.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const deliverySchema = z.object({
  customerId: z.string().min(1),
  deliveryDate: z.string().or(z.date()),
  deliveryShift: z.string().min(1),
  productId: z.string().min(1),
  quantity: z.number().positive(),
  deliveryStatus: z.enum(['PENDING', 'DELIVERED', 'CANCELLED']).optional(),
});

export const generateSchema = z.object({
  date: z.string().optional(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryService.listDeliveries(getPagination(req));
  return successResponse(res, result.data, 'Deliveries retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.getDelivery(req.params.id);
  return successResponse(res, delivery);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.createDelivery(req.body);
  return successResponse(res, delivery, 'Delivery created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.updateDelivery(req.params.id, req.body, req.user!.id);
  return successResponse(res, delivery, 'Delivery updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const delivery = await deliveryService.deleteDelivery(req.params.id);
  return successResponse(res, delivery, 'Delivery deleted');
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const result = await deliveryService.generateDailyDeliveries(req.body.date);
  return successResponse(res, result, 'Daily deliveries generated', 201);
});
 
