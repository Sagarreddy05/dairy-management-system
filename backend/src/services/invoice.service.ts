import { Prisma } from '@prisma/client';
import { EntityStatus, PaymentStatus } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';

export const listInvoices = async (params: PaginationParams) => {
  const where: Prisma.InvoiceWhereInput = params.search
    ? {
        OR: [
          { invoiceNumber: { contains: params.search } },
          { customer: { customerName: { contains: params.search } } },
          { billingMonth: { contains: params.search } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.invoice.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, customerName: true, mobileNumber: true } },
        payments: true,
      },
    }),
    prisma.invoice.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getInvoice = async (id: string) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id },
    include: {
      customer: true,
      payments: { orderBy: { paymentDate: 'desc' } },
    },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  return invoice;
};

export const createInvoice = async (data: {
  invoiceNumber: string;
  customerId: string;
  billingMonth: string;
  totalAmount: number;
  paidAmount?: number;
}) => {
  const paidAmount = data.paidAmount ?? 0;
  const balanceAmount = data.totalAmount - paidAmount;
  let paymentStatus: PaymentStatus = PaymentStatus.UNPAID;
  if (paidAmount <= 0) paymentStatus = PaymentStatus.UNPAID;
  else if (balanceAmount <= 0) paymentStatus = PaymentStatus.PAID;
  else paymentStatus = PaymentStatus.PARTIAL;

  return prisma.invoice.create({
    data: {
      invoiceNumber: data.invoiceNumber,
      customerId: data.customerId,
      billingMonth: data.billingMonth,
      totalAmount: data.totalAmount,
      paidAmount,
      balanceAmount: Math.max(0, balanceAmount),
      paymentStatus,
    },
    include: {
      customer: { select: { id: true, customerName: true } },
    },
  });
};

export const updateInvoice = async (
  id: string,
  data: Partial<{
    invoiceNumber: string;
    customerId: string;
    billingMonth: string;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: PaymentStatus;
  }>
) => {
  const existing = await getInvoice(id);
  const totalAmount = data.totalAmount ?? existing.totalAmount;
  const paidAmount = data.paidAmount ?? existing.paidAmount;
  const balanceAmount = Math.max(0, totalAmount - paidAmount);

  let paymentStatus = data.paymentStatus;
  if (!paymentStatus) {
    if (paidAmount <= 0) paymentStatus = PaymentStatus.UNPAID;
    else if (balanceAmount <= 0) paymentStatus = PaymentStatus.PAID;
    else paymentStatus = PaymentStatus.PARTIAL;
  }

  return prisma.invoice.update({
    where: { id },
    data: { ...data, balanceAmount, paymentStatus },
    include: {
      customer: { select: { id: true, customerName: true } },
      payments: true,
    },
  });
};

export const deleteInvoice = async (id: string) => {
  await getInvoice(id);
  await prisma.payment.deleteMany({ where: { invoiceId: id } });
  return prisma.invoice.delete({ where: { id } });
};

export const generateMonthlyInvoices = async (billingMonth: string) => {
  // billingMonth format: YYYY-MM
  if (!/^\d{4}-\d{2}$/.test(billingMonth)) {
    throw new AppError('billingMonth must be in YYYY-MM format', 400);
  }

  const [year, month] = billingMonth.split('-').map(Number);
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const customers = await prisma.customer.findMany({
    where: { status: EntityStatus.ACTIVE },
    include: {
      subscriptions: { where: { status: EntityStatus.ACTIVE } },
      deliveries: {
        where: {
          deliveryDate: { gte: start, lt: end },
          deliveryStatus: 'DELIVERED',
        },
        include: { product: true },
      },
    },
  });

  const existingCount = await prisma.invoice.count({
    where: { billingMonth },
  });
  let seq = existingCount + 1;
  const created = [];

  for (const customer of customers) {
    const already = await prisma.invoice.findFirst({
      where: { customerId: customer.id, billingMonth },
    });
    if (already) continue;

    let totalAmount = 0;

    if (customer.deliveries.length > 0) {
      totalAmount = customer.deliveries.reduce(
        (sum, d) => sum + d.quantity * d.product.unitPrice,
        0
      );
    } else if (customer.subscriptions.length > 0) {
      const daysInMonth = new Date(year, month, 0).getDate();
      const milkProducts = await prisma.product.findMany({ where: { category: 'MILK' } });
      const avgPrice =
        milkProducts.reduce((s, p) => s + p.unitPrice, 0) / (milkProducts.length || 1) || 50;
      totalAmount = customer.subscriptions.reduce(
        (sum, s) => sum + s.quantityPerDay * daysInMonth * avgPrice,
        0
      );
    }

    if (totalAmount <= 0) continue;

    const invoiceNumber = `INV-${billingMonth.replace('-', '')}-${String(seq).padStart(3, '0')}`;
    seq += 1;

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        customerId: customer.id,
        billingMonth,
        totalAmount: Math.round(totalAmount * 100) / 100,
        paidAmount: 0,
        balanceAmount: Math.round(totalAmount * 100) / 100,
        paymentStatus: PaymentStatus.UNPAID,
      },
      include: {
        customer: { select: { id: true, customerName: true } },
      },
    });
    created.push(invoice);
  }

  return { created: created.length, invoices: created };
};
 
