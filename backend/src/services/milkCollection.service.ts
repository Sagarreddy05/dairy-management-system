import { Prisma } from '@prisma/client';
import { MilkType } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';

export const listMilkCollections = async (params: PaginationParams) => {
  const where: Prisma.MilkCollectionWhereInput = params.search
    ? {
        OR: [
          { farmer: { farmerName: { contains: params.search } } },
          { farmer: { mobileNumber: { contains: params.search } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.milkCollection.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { collectionDate: 'desc' },
      include: {
        farmer: { select: { id: true, farmerName: true, mobileNumber: true, village: true } },
        collector: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.milkCollection.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getMilkCollection = async (id: string) => {
  const record = await prisma.milkCollection.findUnique({
    where: { id },
    include: {
      farmer: true,
      collector: { select: { id: true, name: true, email: true } },
    },
  });
  if (!record) throw new AppError('Milk collection not found', 404);
  return record;
};

export const createMilkCollection = async (
  data: {
    farmerId: string;
    collectionDate: string | Date;
    milkType: MilkType;
    quantityLiters: number;
    fatPercentage: number;
    ratePerLiter: number;
  },
  collectedBy: string
) => {
  const farmer = await prisma.farmer.findUnique({ where: { id: data.farmerId } });
  if (!farmer) throw new AppError('Farmer not found', 404);

  const totalAmount = Number(data.quantityLiters) * Number(data.ratePerLiter);

  return prisma.milkCollection.create({
    data: {
      farmerId: data.farmerId,
      collectionDate: new Date(data.collectionDate),
      milkType: data.milkType,
      quantityLiters: data.quantityLiters,
      fatPercentage: data.fatPercentage,
      ratePerLiter: data.ratePerLiter,
      totalAmount,
      collectedBy,
    },
    include: {
      farmer: { select: { id: true, farmerName: true } },
      collector: { select: { id: true, name: true } },
    },
  });
};

export const updateMilkCollection = async (
  id: string,
  data: Partial<{
    farmerId: string;
    collectionDate: string | Date;
    milkType: MilkType;
    quantityLiters: number;
    fatPercentage: number;
    ratePerLiter: number;
  }>
) => {
  const existing = await getMilkCollection(id);
  const quantityLiters = data.quantityLiters ?? existing.quantityLiters;
  const ratePerLiter = data.ratePerLiter ?? existing.ratePerLiter;
  const totalAmount = Number(quantityLiters) * Number(ratePerLiter);

  return prisma.milkCollection.update({
    where: { id },
    data: {
      ...data,
      collectionDate: data.collectionDate ? new Date(data.collectionDate) : undefined,
      totalAmount,
    },
    include: {
      farmer: { select: { id: true, farmerName: true } },
      collector: { select: { id: true, name: true } },
    },
  });
};

export const deleteMilkCollection = async (id: string) => {
  await getMilkCollection(id);
  return prisma.milkCollection.delete({ where: { id } });
};
