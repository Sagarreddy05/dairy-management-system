import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

export const dailyMilkCollectionReport = async (dateStr?: string) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  const collections = await prisma.milkCollection.findMany({
    where: { collectionDate: { gte: date, lt: next } },
    include: {
      farmer: { select: { id: true, farmerName: true, village: true, mobileNumber: true } },
      collector: { select: { id: true, name: true } },
    },
    orderBy: { collectionDate: 'asc' },
  });

  const summary = {
    date: date.toISOString().slice(0, 10),
    totalRecords: collections.length,
    totalLiters: collections.reduce((s, c) => s + c.quantityLiters, 0),
    totalAmount: collections.reduce((s, c) => s + c.totalAmount, 0),
    byMilkType: {
      COW: collections.filter((c) => c.milkType === 'COW').reduce((s, c) => s + c.quantityLiters, 0),
      BUFFALO: collections
        .filter((c) => c.milkType === 'BUFFALO')
        .reduce((s, c) => s + c.quantityLiters, 0),
    },
  };

  return { summary, collections };
};

export const farmerPaymentReport = async (from?: string, to?: string) => {
  const fromDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const toDate = to ? new Date(to) : new Date();
  toDate.setHours(23, 59, 59, 999);

  const collections = await prisma.milkCollection.findMany({
    where: { collectionDate: { gte: fromDate, lte: toDate } },
    include: { farmer: true },
  });

  const map = new Map<
    string,
    { farmerId: string; farmerName: string; village: string; totalLiters: number; totalAmount: number; collections: number }
  >();

  for (const c of collections) {
    const key = c.farmerId;
    const existing = map.get(key) || {
      farmerId: c.farmerId,
      farmerName: c.farmer.farmerName,
      village: c.farmer.village,
      totalLiters: 0,
      totalAmount: 0,
      collections: 0,
    };
    existing.totalLiters += c.quantityLiters;
    existing.totalAmount += c.totalAmount;
    existing.collections += 1;
    map.set(key, existing);
  }

  return {
    from: fromDate.toISOString().slice(0, 10),
    to: toDate.toISOString().slice(0, 10),
    farmers: Array.from(map.values()),
  };
};

export const customerBillingReport = async (month?: string) => {
  const billingMonth =
    month || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;

  if (!/^\d{4}-\d{2}$/.test(billingMonth)) {
    throw new AppError('month must be in YYYY-MM format', 400);
  }

  const invoices = await prisma.invoice.findMany({
    where: { billingMonth },
    include: {
      customer: { select: { id: true, customerName: true, mobileNumber: true, area: true } },
      payments: true,
    },
    orderBy: { invoiceNumber: 'asc' },
  });

  return {
    billingMonth,
    totalInvoices: invoices.length,
    totalBilled: invoices.reduce((s, i) => s + i.totalAmount, 0),
    totalPaid: invoices.reduce((s, i) => s + i.paidAmount, 0),
    totalBalance: invoices.reduce((s, i) => s + i.balanceAmount, 0),
    invoices,
  };
};

export const deliveryReport = async (dateStr?: string) => {
  const date = dateStr ? new Date(dateStr) : new Date();
  date.setHours(0, 0, 0, 0);
  const next = new Date(date);
  next.setDate(next.getDate() + 1);

  const deliveries = await prisma.delivery.findMany({
    where: { deliveryDate: { gte: date, lt: next } },
    include: {
      customer: { select: { id: true, customerName: true, area: true } },
      product: { select: { id: true, productName: true } },
    },
    orderBy: { deliveryShift: 'asc' },
  });

  return {
    date: date.toISOString().slice(0, 10),
    total: deliveries.length,
    pending: deliveries.filter((d) => d.deliveryStatus === 'PENDING').length,
    delivered: deliveries.filter((d) => d.deliveryStatus === 'DELIVERED').length,
    cancelled: deliveries.filter((d) => d.deliveryStatus === 'CANCELLED').length,
    deliveries,
  };
};

export const inventoryReport = async () => {
  const products = await prisma.product.findMany({ orderBy: { productName: 'asc' } });

  return {
    totalProducts: products.length,
    lowStockCount: products.filter((p) => p.currentStock <= p.minStockAlertQty).length,
    products: products.map((p) => ({
      id: p.id,
      productName: p.productName,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlertQty: p.minStockAlertQty,
      isLowStock: p.currentStock <= p.minStockAlertQty,
    })),
  };
};

export const dashboardStats = async () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    farmerCount,
    customerCount,
    productCount,
    todayCollections,
    pendingDeliveries,
    unpaidInvoices,
    products,
    recentCollections,
  ] = await Promise.all([
    prisma.farmer.count({ where: { status: 'ACTIVE' } }),
    prisma.customer.count({ where: { status: 'ACTIVE' } }),
    prisma.product.count(),
    prisma.milkCollection.findMany({
      where: { collectionDate: { gte: today, lt: tomorrow } },
    }),
    prisma.delivery.count({
      where: { deliveryStatus: 'PENDING', deliveryDate: { gte: today, lt: tomorrow } },
    }),
    prisma.invoice.count({ where: { paymentStatus: { in: ['UNPAID', 'PARTIAL'] } } }),
    prisma.product.findMany(),
    prisma.milkCollection.findMany({
      take: 5,
      orderBy: { collectionDate: 'desc' },
      include: { farmer: { select: { farmerName: true } } },
    }),
  ]);

  return {
    farmers: farmerCount,
    customers: customerCount,
    products: productCount,
    todayMilkLiters: todayCollections.reduce((s, c) => s + c.quantityLiters, 0),
    todayMilkAmount: todayCollections.reduce((s, c) => s + c.totalAmount, 0),
    pendingDeliveries,
    unpaidInvoices,
    lowStockCount: products.filter((p) => p.currentStock <= p.minStockAlertQty).length,
    recentCollections,
  };
};
