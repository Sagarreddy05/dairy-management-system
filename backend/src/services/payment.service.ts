import { Prisma } from '@prisma/client';
import { PaymentStatus } from '../types/enums';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { PaginationParams, buildMeta } from '../utils/pagination';
import { sendSMS } from './sms.service';

export const listPayments = async (params: PaginationParams) => {
  const where: Prisma.PaymentWhereInput = params.search
    ? {
        OR: [
          { paymentMethod: { contains: params.search } },
          { invoice: { invoiceNumber: { contains: params.search } } },
          { invoice: { customer: { customerName: { contains: params.search } } } },
        ],
      }
    : {};

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip: params.skip,
      take: params.take,
      orderBy: { paymentDate: 'desc' },
      include: {
        invoice: {
          include: {
            customer: { select: { id: true, customerName: true, mobileNumber: true } },
          },
        },
      },
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, meta: buildMeta(params.page, params.limit, total) };
};

export const getPayment = async (id: string) => {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      invoice: {
        include: { customer: true },
      },
    },
  });
  if (!payment) throw new AppError('Payment not found', 404);
  return payment;
};

export const createPayment = async (data: {
  invoiceId: string;
  amount: number;
  paymentDate: string | Date;
  paymentMethod: string;
}) => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: data.invoiceId },
    include: { customer: true },
  });
  if (!invoice) throw new AppError('Invoice not found', 404);
  if (data.amount <= 0) throw new AppError('Amount must be greater than zero', 400);
  if (data.amount > invoice.balanceAmount) {
    throw new AppError('Payment amount exceeds invoice balance', 400);
  }

  const paidAmount = invoice.paidAmount + data.amount;
  const balanceAmount = Math.max(0, invoice.totalAmount - paidAmount);
  let paymentStatus: PaymentStatus = PaymentStatus.PARTIAL;
  if (balanceAmount <= 0) paymentStatus = PaymentStatus.PAID;
  else if (paidAmount <= 0) paymentStatus = PaymentStatus.UNPAID;

  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        invoiceId: data.invoiceId,
        amount: data.amount,
        paymentDate: new Date(data.paymentDate),
        paymentMethod: data.paymentMethod,
      },
      include: {
        invoice: {
          include: { customer: { select: { id: true, customerName: true, mobileNumber: true } } },
        },
      },
    }),
    prisma.invoice.update({
      where: { id: data.invoiceId },
      data: { paidAmount, balanceAmount, paymentStatus },
    }),
  ]);

  await sendSMS(
    invoice.customer.mobileNumber,
    `Payment of ₹${data.amount} received for invoice ${invoice.invoiceNumber}. Balance: ₹${balanceAmount}`
  );

  return payment;
};

export const updatePayment = async (
  id: string,
  data: Partial<{
    amount: number;
    paymentDate: string | Date;
    paymentMethod: string;
  }>
) => {
  const existing = await getPayment(id);
  if (data.amount !== undefined && data.amount !== existing.amount) {
    throw new AppError('Changing payment amount is not supported; delete and recreate', 400);
  }

  return prisma.payment.update({
    where: { id },
    data: {
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : undefined,
      paymentMethod: data.paymentMethod,
    },
    include: {
      invoice: {
        include: { customer: { select: { id: true, customerName: true } } },
      },
    },
  });
};

export const deletePayment = async (id: string) => {
  const payment = await getPayment(id);
  const invoice = payment.invoice;

  const paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
  const balanceAmount = Math.max(0, invoice.totalAmount - paidAmount);
  let paymentStatus: PaymentStatus = PaymentStatus.PARTIAL;
  if (paidAmount <= 0) paymentStatus = PaymentStatus.UNPAID;
  else if (balanceAmount <= 0) paymentStatus = PaymentStatus.PAID;

  await prisma.$transaction([
    prisma.payment.delete({ where: { id } }),
    prisma.invoice.update({
      where: { id: invoice.id },
      data: { paidAmount, balanceAmount, paymentStatus },
    }),
  ]);

  return { id };
};
