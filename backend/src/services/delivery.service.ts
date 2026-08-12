import { Prisma } from '@prisma/client';
import { DeliveryStatus, EntityStatus, MilkType, MovementType } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';
import { adjustStock } from './product.service';
import { optimizeRoute } from './routeOptimization.service';

export const listDeliveries = async (params: PaginationParams) => {
  const where: Prisma.DeliveryWhereInput = params.search
    ? {
        OR: [
          { customer: { customerName: { contains: params.search } } },
          { deliveryShift: { contains: params.search } },
          { deliveryStatus: { equals: params.search.toUpperCase() as DeliveryStatus } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.delivery.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { deliveryDate: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true, area: true, address: true } },
        product: { select: { id: true, productName: true, sku: true } },
      },
    }),
    prisma.delivery.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getDelivery = async (id: string) => {
  const delivery = await prisma.delivery.findUnique({
    where: { id },
    include: { customer: true, product: true },
  });
  if (!delivery) throw new AppError('Delivery not found', 404);
  return delivery;
};

export const createDelivery = async (data: {
  customerId: string;
  deliveryDate: string | Date;
  deliveryShift: string;
  productId: string;
  quantity: number;
  deliveryStatus?: DeliveryStatus;
}) => {
  return prisma.delivery.create({
    data: {
      ...data,
      deliveryDate: new Date(data.deliveryDate),
    },
    include: {
      customer: { select: { id: true, customerName: true } },
      product: { select: { id: true, productName: true } },
    },
  });
};

export const updateDelivery = async (
  id: string,
  data: Partial<{
    customerId: string;
    deliveryDate: string | Date;
    deliveryShift: string;
    productId: string;
    quantity: number;
    deliveryStatus: DeliveryStatus;
  }>,
  userId?: string
) => {
  const existing = await getDelivery(id);

  const updated = await prisma.delivery.update({
    where: { id },
    data: {
      ...data,
      deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : undefined,
    },
    include: {
      customer: { select: { id: true, customerName: true, mobileNumber: true } },
      product: { select: { id: true, productName: true } },
    },
  });

  if (
    data.deliveryStatus === DeliveryStatus.DELIVERED &&
    existing.deliveryStatus !== DeliveryStatus.DELIVERED &&
    userId
  ) {
    await adjustStock(
      updated.productId,
      updated.quantity,
      MovementType.OUT,
      `Delivery ${updated.id}`,
      userId
    );
  }

  return updated;
};

export const deleteDelivery = async (id: string) => {
  await getDelivery(id);
  return prisma.delivery.delete({ where: { id } });
};

const milkTypeToSku: Record<MilkType, string> = {
  COW: 'MILK-COW-001',
  BUFFALO: 'MILK-BUF-001',
};

export const generateDailyDeliveries = async (dateInput?: string) => {
  const date = dateInput ? new Date(dateInput) : new Date();
  date.setHours(0, 0, 0, 0);
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  const subscriptions = await prisma.subscription.findMany({
    where: {
      status: EntityStatus.ACTIVE,
      startDate: { lte: nextDay },
    },
    include: { customer: true },
  });

  const products = await prisma.product.findMany();
  const productBySku = new Map(products.map((p) => [p.sku, p]));

  const created = [];
  for (const sub of subscriptions) {
    const sku = milkTypeToSku[sub.milkType as keyof typeof milkTypeToSku];
    const product = productBySku.get(sku) || products.find((p) => p.category === 'MILK');
    if (!product) continue;

    const existing = await prisma.delivery.findFirst({
      where: {
        customerId: sub.customerId,
        deliveryShift: sub.deliveryShift,
        deliveryDate: { gte: date, lt: nextDay },
        productId: product.id,
      },
    });
    if (existing) continue;

    const delivery = await prisma.delivery.create({
      data: {
        customerId: sub.customerId,
        deliveryDate: date,
        deliveryShift: sub.deliveryShift,
        productId: product.id,
        quantity: sub.quantityPerDay,
        deliveryStatus: DeliveryStatus.PENDING,
      },
      include: {
        customer: { select: { id: true, customerName: true, area: true, address: true } },
        product: { select: { id: true, productName: true } },
      },
    });
    created.push(delivery);
  }

  const route = optimizeRoute(
    created.map((d) => ({
      id: d.id,
      name: d.customer.customerName,
      area: d.customer.area,
      address: d.customer.address,
    }))
  );

  return { created: created.length, deliveries: created, optimizedRoute: route };
};
