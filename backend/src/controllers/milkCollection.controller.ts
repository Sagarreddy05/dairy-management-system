import { Request, Response } from 'express';
import { z } from 'zod';
import * as milkService from '../services/milkCollection.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const milkCollectionSchema = z.object({
  farmerId: z.string().min(1),
  collectionDate: z.string().or(z.date()),
  milkType: z.enum(['COW', 'BUFFALO']),
  quantityLiters: z.number().positive(),
  fatPercentage: z.number().min(0),
  ratePerLiter: z.number().positive(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await milkService.listMilkCollections(getPagination(req));
  return successResponse(res, result.data, 'Milk collections retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const record = await milkService.getMilkCollection(req.params.id);
  return successResponse(res, record);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const record = await milkService.createMilkCollection(req.body, req.user!.id);
  return successResponse(res, record, 'Milk collection created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const record = await milkService.updateMilkCollection(req.params.id, req.body);
  return successResponse(res, record, 'Milk collection updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const record = await milkService.deleteMilkCollection(req.params.id);
  return successResponse(res, record, 'Milk collection deleted');
});
