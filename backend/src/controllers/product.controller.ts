import { Request, Response } from 'express';
import { z } from 'zod';
import * as productService from '../services/product.service';
import { successResponse } from '../utils/apiResponse';
import { getPagination } from '../utils/pagination';
import { asyncHandler } from '../middleware/error.middleware';
import { AppError } from '../utils/AppError';
import { getUploadedImageUrl } from '../middleware/upload';

export const productSchema = z.object({
  productName: z.string().min(1),
  sku: z.string().min(1),
  category: z.enum(['MILK', 'CURD', 'GHEE', 'BUTTER', 'PANEER']),
  unitPrice: z.coerce.number().positive(),
  currentStock: z.coerce.number().min(0).optional(),
  minStockAlertQty: z.coerce.number().min(0).optional(),
  imagePath: z.string().optional(),
});

export const stockSchema = z.object({
  quantityChanged: z.coerce.number().positive(),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(1),
});

const parseProductBody = (body: unknown) => {
  const result = productSchema.safeParse(body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ');
    throw new AppError(message, 400);
  }
  return result.data;
};

export const list = asyncHandler(async (req: Request, res: Response) => {
  const result = await productService.listProducts(getPagination(req));
  return successResponse(res, result.data, 'Products retrieved', 200, result.meta);
});

export const getById = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.getProduct(req.params.id);
  return successResponse(res, product);
});

export const create = asyncHandler(async (req: Request, res: Response) => {
  const data = parseProductBody(req.body);
  const imagePath = getUploadedImageUrl(req.file) || data.imagePath;
  const product = await productService.createProduct({ ...data, imagePath });
  return successResponse(res, product, 'Product created', 201);
});

export const update = asyncHandler(async (req: Request, res: Response) => {
  const result = productSchema.partial().safeParse(req.body);
  if (!result.success) {
    const message = result.error.errors.map((e) => e.message).join(', ');
    throw new AppError(message, 400);
  }
  const imagePath = getUploadedImageUrl(req.file);
  const product = await productService.updateProduct(req.params.id, {
    ...result.data,
    ...(imagePath ? { imagePath } : {}),
  });
  return successResponse(res, product, 'Product updated');
});

export const remove = asyncHandler(async (req: Request, res: Response) => {
  const product = await productService.deleteProduct(req.params.id);
  return successResponse(res, product, 'Product deleted');
});

export const uploadImage = asyncHandler(async (req: Request, res: Response) => {
  const imagePath = getUploadedImageUrl(req.file);
  if (!imagePath) throw new AppError('Image file is required', 400);
  const product = await productService.uploadProductImage(req.params.id, imagePath);
  return successResponse(res, product, 'Image uploaded to S3');
});

export const adjustStock = asyncHandler(async (req: Request, res: Response) => {
  const { quantityChanged, movementType, reason } = stockSchema.parse(req.body);
  const product = await productService.adjustStock(
    req.params.id,
    quantityChanged,
    movementType,
    reason,
    req.user!.id
  );
  return successResponse(res, product, 'Stock adjusted');
});
 
