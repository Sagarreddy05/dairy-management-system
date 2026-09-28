import { Prisma } from '@prisma/client';
import { MovementType, ProductCategory } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';

export const listProducts = async (params: PaginationParams) => {
  const where: Prisma.ProductWhereInput = params.search
    ? {
        OR: [
          { productName: { contains: params.search } },
          { sku: { contains: params.search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.product.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.product.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getProduct = async (id: string) => {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { stockMovements: { take: 20, orderBy: { createdAt: 'desc' } } },
  });
  if (!product) throw new AppError('Product not found', 404);
  return product;
};

export const createProduct = async (data: {
  productName: string;
  sku: string;
  category: ProductCategory;
  unitPrice: number;
  currentStock?: number;
  minStockAlertQty?: number;
  imagePath?: string;
}) => {
  const existing = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existing) throw new AppError('SKU already exists', 400);

  return prisma.product.create({ data });
};

export const updateProduct = async (
  id: string,
  data: Partial<{
    productName: string;
    sku: string;
    category: ProductCategory;
    unitPrice: number;
    currentStock: number;
    minStockAlertQty: number;
    imagePath: string;
  }>
) => {
  await getProduct(id);
  if (data.sku) {
    const existing = await prisma.product.findFirst({
      where: { sku: data.sku, NOT: { id } },
    });
    if (existing) throw new AppError('SKU already exists', 400);
  }
  return prisma.product.update({ where: { id }, data });
};

export const deleteProduct = async (id: string) => {
  await getProduct(id);
  return prisma.product.delete({ where: { id } });
};

export const uploadProductImage = async (id: string, imagePath: string) => {
  await getProduct(id);
  return prisma.product.update({
    where: { id },
    data: { imagePath },
  });
};

export const adjustStock = async (
  productId: string,
  quantityChanged: number,
  movementType: MovementType,
  reason: string,
  createdBy: string
) => {
  const product = await getProduct(productId);
  const delta = movementType === MovementType.IN ? quantityChanged : -quantityChanged;
  const newStock = product.currentStock + delta;

  if (newStock < 0) {
    throw new AppError('Stock cannot become negative', 400);
  }

  const [updated] = await prisma.$transaction([
    prisma.product.update({
      where: { id: productId },
      data: { currentStock: newStock },
    }),
    prisma.stockMovement.create({
      data: {
        productId,
        quantityChanged,
        movementType,
        reason,
        createdBy,
      },
    }),
  ]);

  return updated;
};
 
