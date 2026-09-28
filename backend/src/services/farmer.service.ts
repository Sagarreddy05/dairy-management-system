import { Prisma } from '@prisma/client';
import { EntityStatus } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';

export const listFarmers = async (params: PaginationParams) => {
  const where: Prisma.FarmerWhereInput = params.search
    ? {
        OR: [
          { farmerName: { contains: params.search } },
          { mobileNumber: { contains: params.search } },
          { village: { contains: params.search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.farmer.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.farmer.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getFarmer = async (id: string) => {
  const farmer = await prisma.farmer.findUnique({
    where: { id },
    include: { milkCollections: { take: 20, orderBy: { collectionDate: 'desc' } } },
  });
  if (!farmer) throw new AppError('Farmer not found', 404);
  return farmer;
};

export const createFarmer = async (data: {
  farmerName: string;
  mobileNumber: string;
  village: string;
  address: string;
  cattleCount?: number;
  status?: EntityStatus;
}) => {
  return prisma.farmer.create({ data });
};

export const updateFarmer = async (
  id: string,
  data: Partial<{
    farmerName: string;
    mobileNumber: string;
    village: string;
    address: string;
    cattleCount: number;
    status: EntityStatus;
  }>
) => {
  await getFarmer(id);
  return prisma.farmer.update({ where: { id }, data });
};

export const deleteFarmer = async (id: string) => {
  await getFarmer(id);
  return prisma.farmer.update({
    where: { id },
    data: { status: EntityStatus.INACTIVE },
  });
};
 
