import { Prisma } from '@prisma/client';
import { EntityStatus, MilkType } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';

export const listSubscriptions = async (params: PaginationParams) => {
  const where: Prisma.SubscriptionWhereInput = params.search
    ? {
        OR: [
          { customer: { customerName: { contains: params.search } } },
          { customer: { mobileNumber: { contains: params.search } } },
          { deliveryShift: { contains: params.search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.subscription.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true, mobileNumber: true, area: true } },
      },
    }),
    prisma.subscription.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getSubscription = async (id: string) => {
  const sub = await prisma.subscription.findUnique({
    where: { id },
    include: { customer: true },
  });
  if (!sub) throw new AppError('Subscription not found', 404);
  return sub;
};

export const createSubscription = async (data: {
  customerId: string;
  milkType: MilkType;
  quantityPerDay: number;
  deliveryShift: string;
  startDate: string | Date;
  status?: EntityStatus;
}) => {
  const customer = await prisma.customer.findUnique({ where: { id: data.customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  return prisma.subscription.create({
    data: {
      ...data,
      startDate: new Date(data.startDate),
    },
    include: {
      customer: { select: { id: true, customerName: true } },
    },
  });
};

export const updateSubscription = async (
  id: string,
  data: Partial<{
    customerId: string;
    milkType: MilkType;
    quantityPerDay: number;
    deliveryShift: string;
    startDate: string | Date;
    status: EntityStatus;
  }>
) => {
  await getSubscription(id);
  return prisma.subscription.update({
    where: { id },
    data: {
      ...data,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
    },
    include: {
      customer: { select: { id: true, customerName: true } },
    },
  });
};

export const deleteSubscription = async (id: string) => {
  await getSubscription(id);
  return prisma.subscription.update({
    where: { id },
    data: { status: EntityStatus.INACTIVE },
  });
};
 
