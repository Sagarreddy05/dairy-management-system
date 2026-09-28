import { Prisma } from '@prisma/client';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';
import { ChallanStatus, MovementType } from '../types/enums';
import { generateChallanNumber } from '../utils/challanNumber';

export interface ChallanItemInput {
  productId: string;
  quantity: number;
}

const includeChallan = {
  customer: { select: { id: true, customerName: true, mobileNumber: true, area: true } },
  creator: { select: { id: true, name: true, email: true } },
  items: true,
} satisfies Prisma.SalesChallanInclude;

const buildItemsFromProducts = async (items: ChallanItemInput[]) => {
  if (!items.length) throw new AppError('At least one product is required', 400);

  const productIds = items.map((i) => i.productId);
  const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
  const byId = new Map(products.map((p) => [p.id, p]));

  return items.map((item) => {
    const qty = Number(item.quantity);
    if (!Number.isInteger(qty) || qty <= 0) {
      throw new AppError('Quantity must be a positive integer', 400);
    }
    const product = byId.get(item.productId);
    if (!product) throw new AppError(`Product not found: ${item.productId}`, 404);

    return {
      productId: product.id,
      productName: product.productName,
      productSku: product.sku,
      productUnit: product.category,
      unitPrice: product.unitPrice,
      imageUrl: product.imagePath,
      quantity: qty,
      lineTotal: qty * product.unitPrice,
    };
  });
};

export const listChallans = async (params: PaginationParams) => {
  const where: Prisma.SalesChallanWhereInput = params.search
    ? {
        OR: [
          { challanNumber: { contains: params.search } },
          { customer: { customerName: { contains: params.search } } },
          { status: { contains: params.search.toUpperCase() } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.salesChallan.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: includeChallan,
    }),
    prisma.salesChallan.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getChallan = async (id: string) => {
  const challan = await prisma.salesChallan.findUnique({
    where: { id },
    include: includeChallan,
  });
  if (!challan) throw new AppError('Sales challan not found', 404);
  return challan;
};

export const createChallan = async (
  customerId: string,
  itemsInput: ChallanItemInput[],
  status: 'DRAFT' | 'CONFIRMED',
  createdBy: string
) => {
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  const items = await buildItemsFromProducts(itemsInput);
  const totalQuantity = items.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = items.reduce((s, i) => s + i.lineTotal, 0);
  const challanNumber = await generateChallanNumber();

  if (status === ChallanStatus.CONFIRMED) {
    return confirmAndCreate(customerId, items, totalQuantity, totalAmount, challanNumber, createdBy);
  }

  return prisma.salesChallan.create({
    data: {
      challanNumber,
      customerId,
      totalQuantity,
      totalAmount,
      status: ChallanStatus.DRAFT,
      createdBy,
      items: { create: items },
    },
    include: includeChallan,
  });
};

const confirmAndCreate = async (
  customerId: string,
  items: Awaited<ReturnType<typeof buildItemsFromProducts>>,
  totalQuantity: number,
  totalAmount: number,
  challanNumber: string,
  createdBy: string
) => {
  return prisma.$transaction(async (tx) => {
    for (const item of items) {
      if (!item.productId) continue;
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError(`Product not found: ${item.productName}`, 404);
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.productName}. Available: ${product.currentStock}, requested: ${item.quantity}`,
          400
        );
      }
    }

    for (const item of items) {
      if (!item.productId) continue;
      const product = await tx.product.update({
        where: { id: item.productId },
        data: { currentStock: { decrement: item.quantity } },
      });
      if (product.currentStock < 0) {
        throw new AppError(`Stock cannot become negative for ${item.productName}`, 400);
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          quantityChanged: item.quantity,
          movementType: MovementType.OUT,
          reason: `Sales challan ${challanNumber}`,
          createdBy,
        },
      });
    }

    return tx.salesChallan.create({
      data: {
        challanNumber,
        customerId,
        totalQuantity,
        totalAmount,
        status: ChallanStatus.CONFIRMED,
        createdBy,
        items: { create: items },
      },
      include: includeChallan,
    });
  });
};

export const confirmChallan = async (id: string, userId: string) => {
  const existing = await getChallan(id);
  if (existing.status === ChallanStatus.CONFIRMED) {
    throw new AppError('Challan is already confirmed', 400);
  }
  if (existing.status === ChallanStatus.CANCELLED) {
    throw new AppError('Cancelled challan cannot be confirmed', 400);
  }

  return prisma.$transaction(async (tx) => {
    for (const item of existing.items) {
      if (!item.productId) {
        throw new AppError(`Product reference missing for ${item.productName}`, 400);
      }
      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError(`Product not found: ${item.productName}`, 404);
      if (product.currentStock < item.quantity) {
        throw new AppError(
          `Insufficient stock for ${product.productName}. Available: ${product.currentStock}, requested: ${item.quantity}`,
          400
        );
      }
    }

    for (const item of existing.items) {
      const product = await tx.product.update({
        where: { id: item.productId! },
        data: { currentStock: { decrement: item.quantity } },
      });
      if (product.currentStock < 0) {
        throw new AppError(`Stock cannot become negative for ${item.productName}`, 400);
      }
      await tx.stockMovement.create({
        data: {
          productId: item.productId!,
          quantityChanged: item.quantity,
          movementType: MovementType.OUT,
          reason: `Sales challan ${existing.challanNumber}`,
          createdBy: userId,
        },
      });
    }

    return tx.salesChallan.update({
      where: { id },
      data: { status: ChallanStatus.CONFIRMED },
      include: includeChallan,
    });
  });
};

export const cancelChallan = async (id: string) => {
  const existing = await getChallan(id);
  if (existing.status === ChallanStatus.CONFIRMED) {
    throw new AppError('Confirmed challan cannot be cancelled from this endpoint', 400);
  }
  return prisma.salesChallan.update({
    where: { id },
    data: { status: ChallanStatus.CANCELLED },
    include: includeChallan,
  });
};
 
