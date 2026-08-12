import { PrismaClient } from '@prisma/client';
import { Role, MilkType, CustomerType, ProductCategory, DeliveryStatus, PaymentStatus, EntityStatus, MovementType } from '../src/types/enums';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.salesChallanItem.deleteMany();
  await prisma.salesChallan.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.milkCollection.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.farmer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHashes = {
    admin: await bcrypt.hash('Admin@123', 10),
    sales: await bcrypt.hash('Sales@123', 10),
    farmer: await bcrypt.hash('Farmer@123', 10),
    delivery: await bcrypt.hash('Delivery@123', 10),
  };

  const admin = await prisma.user.create({
    data: {
      name: 'Farm Admin',
      email: 'admin@farmfresh.com',
      password: passwordHashes.admin,
      role: Role.ADMIN,
    },
  });

  const sales = await prisma.user.create({
    data: {
      name: 'Sales Executive',
      email: 'sales@farmfresh.com',
      password: passwordHashes.sales,
      role: Role.SALES,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Farm Partner',
      email: 'farmer@farmfresh.com',
      password: passwordHashes.farmer,
      role: Role.FARMER,
    },
  });

  await prisma.user.create({
    data: {
      name: 'Delivery Staff',
      email: 'delivery@farmfresh.com',
      password: passwordHashes.delivery,
      role: Role.DELIVERY,
    },
  });

  console.log('Users seeded:');
  console.log('- admin@farmfresh.com / Admin@123 / ADMIN');
  console.log('- sales@farmfresh.com / Sales@123 / SALES');
  console.log('- farmer@farmfresh.com / Farmer@123 / FARMER');
  console.log('- delivery@farmfresh.com / Delivery@123 / DELIVERY');

  const farmers = await Promise.all(
    [
      { farmerName: 'Ramesh Patel', mobileNumber: '9876500001', village: 'Anand', address: 'Near Temple, Anand', cattleCount: 12 },
      { farmerName: 'Suresh Kumar', mobileNumber: '9876500002', village: 'Nadiad', address: 'Main Road, Nadiad', cattleCount: 8 },
      { farmerName: 'Meena Devi', mobileNumber: '9876500003', village: 'Kheda', address: 'Village Center, Kheda', cattleCount: 15 },
      { farmerName: 'Vikram Singh', mobileNumber: '9876500004', village: 'Petlad', address: 'Farm House, Petlad', cattleCount: 20 },
      { farmerName: 'Lakshmi Bai', mobileNumber: '9876500005', village: 'Borsad', address: 'Dairy Lane, Borsad', cattleCount: 10 },
    ].map((f) => prisma.farmer.create({ data: { ...f, status: EntityStatus.ACTIVE } }))
  );

  const customers = await Promise.all(
    [
      { customerName: 'Amit Shah', mobileNumber: '9988700001', address: '12 Green Park', area: 'Sector 1', customerType: CustomerType.HOME },
      { customerName: 'Priya Sharma', mobileNumber: '9988700002', address: '45 Lake View', area: 'Sector 2', customerType: CustomerType.HOME },
      { customerName: 'City Mart', mobileNumber: '9988700003', address: 'Market Road 8', area: 'Central', customerType: CustomerType.SHOP },
      { customerName: 'Hotel Grand', mobileNumber: '9988700004', address: 'Highway 1', area: 'Outskirts', customerType: CustomerType.HOTEL },
      { customerName: 'Neha Gupta', mobileNumber: '9988700005', address: '78 Rose Colony', area: 'Sector 3', customerType: CustomerType.HOME },
      { customerName: 'Fresh Basket', mobileNumber: '9988700006', address: 'Shop 22 Mall', area: 'Central', customerType: CustomerType.SHOP },
      { customerName: 'Rajesh Mehta', mobileNumber: '9988700007', address: '9 Palm Street', area: 'Sector 4', customerType: CustomerType.HOME },
      { customerName: 'Cafe Mocha', mobileNumber: '9988700008', address: 'Food Court 3', area: 'Central', customerType: CustomerType.HOTEL },
      { customerName: 'Sunita Rao', mobileNumber: '9988700009', address: '33 River Side', area: 'Sector 5', customerType: CustomerType.HOME },
      { customerName: 'Daily Needs Store', mobileNumber: '9988700010', address: 'Corner Plot 5', area: 'Sector 2', customerType: CustomerType.SHOP },
    ].map((c) => prisma.customer.create({ data: { ...c, status: EntityStatus.ACTIVE } }))
  );

  const products = await Promise.all([
    prisma.product.create({
      data: {
        productName: 'Fresh Cow Milk',
        sku: 'MILK-COW-001',
        category: ProductCategory.MILK,
        unitPrice: 55,
        currentStock: 200,
        minStockAlertQty: 50,
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Buffalo Milk',
        sku: 'MILK-BUF-001',
        category: ProductCategory.MILK,
        unitPrice: 70,
        currentStock: 150,
        minStockAlertQty: 40,
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Homemade Curd',
        sku: 'CURD-001',
        category: ProductCategory.CURD,
        unitPrice: 60,
        currentStock: 80,
        minStockAlertQty: 20,
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Pure Ghee',
        sku: 'GHEE-001',
        category: ProductCategory.GHEE,
        unitPrice: 550,
        currentStock: 25,
        minStockAlertQty: 10,
      },
    }),
    prisma.product.create({
      data: {
        productName: 'Fresh Paneer',
        sku: 'PANEER-001',
        category: ProductCategory.PANEER,
        unitPrice: 320,
        currentStock: 15,
        minStockAlertQty: 20,
      },
    }),
  ]);

  const today = new Date();
  const subscriptions = await Promise.all([
    prisma.subscription.create({
      data: {
        customerId: customers[0].id,
        milkType: MilkType.COW,
        quantityPerDay: 1,
        deliveryShift: 'MORNING',
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        status: EntityStatus.ACTIVE,
      },
    }),
    prisma.subscription.create({
      data: {
        customerId: customers[1].id,
        milkType: MilkType.BUFFALO,
        quantityPerDay: 1.5,
        deliveryShift: 'MORNING',
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 1),
        status: EntityStatus.ACTIVE,
      },
    }),
    prisma.subscription.create({
      data: {
        customerId: customers[2].id,
        milkType: MilkType.COW,
        quantityPerDay: 10,
        deliveryShift: 'MORNING',
        startDate: new Date(today.getFullYear(), today.getMonth() - 2, 1),
        status: EntityStatus.ACTIVE,
      },
    }),
    prisma.subscription.create({
      data: {
        customerId: customers[3].id,
        milkType: MilkType.BUFFALO,
        quantityPerDay: 20,
        deliveryShift: 'EVENING',
        startDate: new Date(today.getFullYear(), today.getMonth() - 1, 15),
        status: EntityStatus.ACTIVE,
      },
    }),
    prisma.subscription.create({
      data: {
        customerId: customers[4].id,
        milkType: MilkType.COW,
        quantityPerDay: 2,
        deliveryShift: 'EVENING',
        startDate: new Date(today.getFullYear(), today.getMonth(), 1),
        status: EntityStatus.ACTIVE,
      },
    }),
  ]);

  const collectionData = [
    { farmerId: farmers[0].id, milkType: MilkType.COW, qty: 40, fat: 3.8, rate: 42 },
    { farmerId: farmers[0].id, milkType: MilkType.BUFFALO, qty: 25, fat: 6.2, rate: 55 },
    { farmerId: farmers[1].id, milkType: MilkType.COW, qty: 30, fat: 3.5, rate: 40 },
    { farmerId: farmers[1].id, milkType: MilkType.COW, qty: 28, fat: 3.6, rate: 40 },
    { farmerId: farmers[2].id, milkType: MilkType.BUFFALO, qty: 50, fat: 6.5, rate: 58 },
    { farmerId: farmers[2].id, milkType: MilkType.COW, qty: 35, fat: 3.9, rate: 43 },
    { farmerId: farmers[3].id, milkType: MilkType.BUFFALO, qty: 60, fat: 6.8, rate: 60 },
    { farmerId: farmers[3].id, milkType: MilkType.COW, qty: 45, fat: 4.0, rate: 44 },
    { farmerId: farmers[4].id, milkType: MilkType.COW, qty: 22, fat: 3.7, rate: 41 },
    { farmerId: farmers[4].id, milkType: MilkType.BUFFALO, qty: 18, fat: 6.0, rate: 54 },
  ];

  for (let i = 0; i < collectionData.length; i++) {
    const c = collectionData[i];
    const date = new Date();
    date.setDate(date.getDate() - (i % 5));
    await prisma.milkCollection.create({
      data: {
        farmerId: c.farmerId,
        collectionDate: date,
        milkType: c.milkType,
        quantityLiters: c.qty,
        fatPercentage: c.fat,
        ratePerLiter: c.rate,
        totalAmount: c.qty * c.rate,
        collectedBy: sales.id,
      },
    });
  }

  await prisma.delivery.createMany({
    data: [
      {
        customerId: customers[0].id,
        deliveryDate: today,
        deliveryShift: 'MORNING',
        productId: products[0].id,
        quantity: 1,
        deliveryStatus: DeliveryStatus.DELIVERED,
      },
      {
        customerId: customers[1].id,
        deliveryDate: today,
        deliveryShift: 'MORNING',
        productId: products[1].id,
        quantity: 1.5,
        deliveryStatus: DeliveryStatus.PENDING,
      },
      {
        customerId: customers[2].id,
        deliveryDate: today,
        deliveryShift: 'MORNING',
        productId: products[0].id,
        quantity: 10,
        deliveryStatus: DeliveryStatus.PENDING,
      },
    ],
  });

  const billingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const invoice1 = await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${billingMonth.replace('-', '')}-001`,
      customerId: customers[0].id,
      billingMonth,
      totalAmount: 1650,
      paidAmount: 1000,
      balanceAmount: 650,
      paymentStatus: PaymentStatus.PARTIAL,
    },
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: `INV-${billingMonth.replace('-', '')}-002`,
      customerId: customers[2].id,
      billingMonth,
      totalAmount: 16500,
      paidAmount: 0,
      balanceAmount: 16500,
      paymentStatus: PaymentStatus.UNPAID,
    },
  });

  await prisma.payment.create({
    data: {
      invoiceId: invoice1.id,
      amount: 1000,
      paymentDate: today,
      paymentMethod: 'UPI',
    },
  });

  await prisma.stockMovement.create({
    data: {
      productId: products[0].id,
      quantityChanged: 200,
      movementType: MovementType.IN,
      reason: 'Initial stock',
      createdBy: admin.id,
    },
  });

  console.log('Seed completed successfully');
  console.log(`Users: 4 | Farmers: ${farmers.length} | Customers: ${customers.length}`);
  console.log(`Products: ${products.length} | Subscriptions: ${subscriptions.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
