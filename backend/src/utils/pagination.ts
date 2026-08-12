import { Request } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  take: number;
  search: string;
}

export const getPagination = (req: Request): PaginationParams => {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(String(req.query.limit || '10'), 10) || 10));
  const search = String(req.query.search || '').trim();

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    search,
  };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
  page,
  limit,
  total,
  totalPages: Math.ceil(total / limit) || 0,
});
