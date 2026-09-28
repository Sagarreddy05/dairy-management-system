import { Request, Response } from 'express';
import * as challanService from '../services/challan.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../utils/AppError';

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await challanService.listChallans(getPagination(req));
  return successResponse(res, result.data, 'Sales challans retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.getChallan(req.params.id);
  return successResponse(res, challan);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const { customerId, items, status } = req.body;
  if (!customerId) throw new AppError('Customer is required', 400);
  if (!Array.isArray(items) || !items.length) throw new AppError('Items are required', 400);
  const normalizedStatus = status === 'CONFIRMED' ? 'CONFIRMED' : 'DRAFT';
  const challan = await challanService.createChallan(
    customerId,
    items,
    normalizedStatus,
    req.user!.id
  );
  return successResponse(res, challan, 'Sales challan created', 201);
});

export const confirm = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.confirmChallan(req.params.id, req.user!.id);
  return successResponse(res, challan, 'Sales challan confirmed');
});

export const cancel = asyncHandler(async (req: Request, res: Response) => {
  const challan = await challanService.cancelChallan(req.params.id);
  return successResponse(res, challan, 'Sales challan cancelled');
});
 
