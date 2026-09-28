import { Request, Response } from 'express';
import { z } from 'zod';
import * as invoiceService from '../services/invoice.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';

export const invoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerId: z.string().min(1),
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
  totalAmount: z.number().positive(),
  paidAmount: z.number().min(0).optional(),
});

export const generateSchema = z.object({
  billingMonth: z.string().regex(/^\d{4}-\d{2}$/),
});

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await invoiceService.listInvoices(getPagination(req));
  return successResponse(res, result.data, 'Invoices retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.getInvoice(req.params.id);
  return successResponse(res, invoice);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.createInvoice(req.body);
  return successResponse(res, invoice, 'Invoice created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.updateInvoice(req.params.id, req.body);
  return successResponse(res, invoice, 'Invoice updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const invoice = await invoiceService.deleteInvoice(req.params.id);
  return successResponse(res, invoice, 'Invoice deleted');
});

export const generate = asyncHandler(async (req: Request, res: Response) => {
  const result = await invoiceService.generateMonthlyInvoices(req.body.billingMonth);
  return successResponse(res, result, 'Monthly invoices generated', 201);
});
 
