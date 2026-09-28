import { Request, Response } from 'express';
import { z } from 'zod';
import * as farmerService from '../services/farmer.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const farmerSchema = z.object({
  farmerName: z.string().min(1),
  mobileNumber: z.string().min(5),
  village: z.string().min(1),
  address: z.string().min(1),
  cattleCount: z.number().int().min(0).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await farmerService.listFarmers(getPagination(req));
  return successResponse(res, result.data, 'Farmers retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.getFarmer(req.params.id);
  return successResponse(res, farmer);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.createFarmer(req.body);
  return successResponse(res, farmer, 'Farmer created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.updateFarmer(req.params.id, req.body);
  return successResponse(res, farmer, 'Farmer updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const farmer = await farmerService.deleteFarmer(req.params.id);
  return successResponse(res, farmer, 'Farmer deactivated');
});
 
