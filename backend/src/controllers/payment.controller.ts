import { Request, Response } from 'express';
import { z } from 'zod';
import * as paymentService from '../services/payment.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const paymentSchema = z.object({
  invoiceId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string().or(z.date()),
  paymentMethod: z.string().min(1),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await paymentService.listPayments(getPagination(req));
  return successResponse(res, result.data, 'Payments retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.getPayment(req.params.id);
  return successResponse(res, payment);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.createPayment(req.body);
  return successResponse(res, payment, 'Payment recorded', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.updatePayment(req.params.id, req.body);
  return successResponse(res, payment, 'Payment updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const payment = await paymentService.deletePayment(req.params.id);
  return successResponse(res, payment, 'Payment deleted');
});
