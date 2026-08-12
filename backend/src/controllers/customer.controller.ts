import { Request, Response } from 'express';
import { z } from 'zod';
import * as customerService from '../services/customer.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const customerSchema = z.object({
  customerName: z.string().min(1),
  mobileNumber: z.string().min(5),
  address: z.string().min(1),
  area: z.string().min(1),
  customerType: z.enum(['HOME', 'SHOP', 'HOTEL']),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await customerService.listCustomers(getPagination(req));
  return successResponse(res, result.data, 'Customers retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.getCustomer(req.params.id);
  return successResponse(res, customer);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.createCustomer(req.body);
  return successResponse(res, customer, 'Customer created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.updateCustomer(req.params.id, req.body);
  return successResponse(res, customer, 'Customer updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const customer = await customerService.deleteCustomer(req.params.id);
  return successResponse(res, customer, 'Customer deactivated');
});
