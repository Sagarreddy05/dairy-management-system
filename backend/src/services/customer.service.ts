import { Prisma } from '@prisma/client';
import { CustomerType, EntityStatus } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';

export const listCustomers = async (params: PaginationParams) => {
  const where: Prisma.CustomerWhereInput = params.search
    ? {
        OR: [
          { customerName: { contains: params.search } },
          { mobileNumber: { contains: params.search } },
          { area: { contains: params.search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.customer.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getCustomer = async (id: string) => {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      subscriptions: true,
      invoices: { take: 10, orderBy: { createdAt: 'desc' } },
    },
  });
  if (!customer) throw new AppError('Customer not found', 404);
  return customer;
};

export const createCustomer = async (data: {
  customerName: string;
  mobileNumber: string;
  address: string;
  area: string;
  customerType: CustomerType;
  status?: EntityStatus;
}) => {
  return prisma.customer.create({ data });
};

export const updateCustomer = async (
  id: string,
  data: Partial<{
    customerName: string;
    mobileNumber: string;
    address: string;
    area: string;
    customerType: CustomerType;
    status: EntityStatus;
  }>
) => {
  await getCustomer(id);
  return prisma.customer.update({ where: { id }, data });
};

export const deleteCustomer = async (id: string) => {
  await getCustomer(id);
  return prisma.customer.update({
    where: { id },
    data: { status: EntityStatus.INACTIVE },
  });
};
 
