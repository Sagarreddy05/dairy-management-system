import { Request, Response } from 'express';
import * as reportsService from '../services/reports.service';
import { successResponse } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import { toCsv } from '../utils/csvExport';

const sendReport = (res: Response, data: unknown, rows: Record<string, unknown>[], filename: string, format?: string) => {
  if (format === 'csv') {
    const csv = toCsv(rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(csv);
  }
  return successResponse(res, data, 'Report generated');
};

export const dailyMilk = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.dailyMilkCollectionReport(req.query.date as string);
  const rows = data.collections.map((c) => ({
    date: c.collectionDate,
    farmer: c.farmer.farmerName,
    village: c.farmer.village,
    milkType: c.milkType,
    quantityLiters: c.quantityLiters,
    fatPercentage: c.fatPercentage,
    ratePerLiter: c.ratePerLiter,
    totalAmount: c.totalAmount,
  }));
  return sendReport(res, data, rows, 'daily-milk-collection.csv', req.query.format as string);
});

export const farmerPayments = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.farmerPaymentReport(
    req.query.from as string,
    req.query.to as string
  );
  return sendReport(res, data, data.farmers as unknown as Record<string, unknown>[], 'farmer-payments.csv', req.query.format as string);
});

export const customerBilling = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.customerBillingReport(req.query.month as string);
  const rows = data.invoices.map((i) => ({
    invoiceNumber: i.invoiceNumber,
    customer: i.customer.customerName,
    billingMonth: i.billingMonth,
    totalAmount: i.totalAmount,
    paidAmount: i.paidAmount,
    balanceAmount: i.balanceAmount,
    paymentStatus: i.paymentStatus,
  }));
  return sendReport(res, data, rows, 'customer-billing.csv', req.query.format as string);
});

export const deliveries = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.deliveryReport(req.query.date as string);
  const rows = data.deliveries.map((d) => ({
    date: d.deliveryDate,
    customer: d.customer.customerName,
    area: d.customer.area,
    product: d.product.productName,
    quantity: d.quantity,
    shift: d.deliveryShift,
    status: d.deliveryStatus,
  }));
  return sendReport(res, data, rows, 'deliveries.csv', req.query.format as string);
});

export const inventory = asyncHandler(async (req: Request, res: Response) => {
  const data = await reportsService.inventoryReport();
  return sendReport(res, data, data.products as unknown as Record<string, unknown>[], 'inventory.csv', req.query.format as string);
});

export const dashboard = asyncHandler(async (_req: Request, res: Response) => {
  const data = await reportsService.dashboardStats();
  return successResponse(res, data, 'Dashboard stats retrieved');
});
 
