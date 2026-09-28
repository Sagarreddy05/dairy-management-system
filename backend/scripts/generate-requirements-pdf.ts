import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';

const outPath = path.resolve(process.cwd(), '..', 'Dairy_Project_Complete_Requirements.pdf');

function writePdf() {
  return new Promise<void>((resolve, reject) => {
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4',
      info: { Title: 'Dairy Project Complete Requirements', Author: 'FarmFresh' },
    });
    const stream = fs.createWriteStream(outPath);
    doc.pipe(stream);

    const h1 = (t: string) => {
      doc.moveDown(0.6);
      doc.fontSize(16).fillColor('#1b4332').text(t, { underline: true });
      doc.moveDown(0.3);
      doc.fontSize(10).fillColor('#222');
    };
    const bullet = (t: string) => {
      doc.fontSize(10).fillColor('#222').text(`• ${t}`, { indent: 10 });
    };
    const p = (t: string) => {
      doc.fontSize(10).fillColor('#222').text(t, { align: 'left' });
      doc.moveDown(0.25);
    };

    doc.fontSize(20).fillColor('#1b4332').text('FarmFresh Dairy Management System', { align: 'center' });
    doc.moveDown(0.3);
    doc.fontSize(14).fillColor('#2d6a4f').text('Complete Project Requirements Document', { align: 'center' });
    doc.moveDown(0.2);
    doc.fontSize(10).fillColor('#555').text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
    doc.moveDown(1);

    h1('1. Project Overview');
    p('FarmFresh is a full-stack Dairy Farm Management System for farmers, milk collection, customers, subscriptions, inventory, sales challans, deliveries, invoices, payments, and reports. It uses JWT role-based access with ADMIN, SALES, FARMER, and DELIVERY roles.');

    h1('2. Tech Stack');
    bullet('Frontend: React, Vite, React Router, Axios, CSS');
    bullet('Backend: Node.js, Express, TypeScript, Prisma, JWT, bcryptjs, Zod, express-validator');
    bullet('Database: SQLite (local) / PostgreSQL (production)');
    bullet('Storage: Amazon S3 for product images (multer-s3 + AWS SDK v3)');

    h1('3. Role Credentials');
    bullet('ADMIN → admin@farmfresh.com / Admin@123');
    bullet('SALES → sales@farmfresh.com / Sales@123');
    bullet('FARMER → farmer@farmfresh.com / Farmer@123');
    bullet('DELIVERY → delivery@farmfresh.com / Delivery@123');
    p('These users are created by prisma/seed.ts with bcrypt-hashed passwords.');

    h1('4. Sales Challan Flow');
    bullet('Sales/Admin selects customer and one or more products with quantities.');
    bullet('System auto-generates challan number: CH-YYYYMMDD-####');
    bullet('Save as DRAFT (no stock change) or CONFIRMED (stock reduced atomically).');
    bullet('Status values: DRAFT | CONFIRMED | CANCELLED');
    bullet('Challan stores product snapshots: name, SKU, unit, price, image URL');
    bullet('Fields: challan number, customer, products, total quantity, status, created by, created date');

    h1('5. Business Rules');
    bullet('Only ADMIN and SALES can create or confirm challans (authorizeRoles middleware).');
    bullet('Confirming a challan reduces stock inside a Prisma transaction.');
    bullet('Stock must never become negative.');
    bullet('Insufficient stock returns HTTP 400 with a clear error message.');
    bullet('Draft challans can later be confirmed or cancelled.');

    h1('6. API Endpoints (Sales Challans)');
    bullet('GET /api/challans — list challans');
    bullet('GET /api/challans/:id — get challan');
    bullet('POST /api/challans — create (body: customerId, items[{productId,quantity}], status DRAFT|CONFIRMED)');
    bullet('POST /api/challans/:id/confirm — confirm draft and reduce stock');
    bullet('POST /api/challans/:id/cancel — cancel draft');
    p('Auth: Bearer JWT. Roles: ADMIN, SALES.');

    h1('7. Validation Rules');
    bullet('Mobile: digits only, exactly 10');
    bullet('Name: alphabets and spaces only');
    bullet('Email: valid email format');
    bullet('Price: positive number');
    bullet('Quantity: positive integer');
    bullet('SKU: letters, numbers, hyphen only');
    bullet('Password: min 8 chars, uppercase, lowercase, number');
    p('Frontend sanitizes invalid characters, shows inline errors, and disables submit when invalid. Backend uses express-validator and returns JSON: { success:false, message, errors:[{field,message}] }.');

    h1('8. AWS S3 Integration Steps');
    bullet('Create S3 bucket and IAM user with s3:PutObject/GetObject on products/*');
    bullet('Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME in backend/.env');
    bullet('Upload via product create/update or POST /api/products/:id/upload');
    bullet('Allowed: jpg, jpeg, png, webp; max 5 MB');
    bullet('Store public S3 URL in Product.imagePath; frontend shows thumbnails with placeholder fallback');

    h1('9. Database Models Summary');
    bullet('User, Farmer, MilkCollection, Customer, Subscription');
    bullet('Product, StockMovement, Delivery, Invoice, Payment');
    bullet('SalesChallan, SalesChallanItem (with product snapshot fields)');

    h1('10. Deployment Steps');
    bullet('Configure backend/.env (DATABASE_URL, JWT_SECRET, AWS_*)');
    bullet('cd backend && npm install && npx prisma migrate deploy && npx prisma generate && npm run seed');
    bullet('npm run build && npm start (or npm run dev)');
    bullet('cd frontend && npm install && npm run build && serve dist (or npm run dev)');
    bullet('Ensure frontend proxy/API base URL points to backend');

    h1('11. Testing Checklist');
    bullet('Login works for ADMIN, SALES, FARMER, DELIVERY');
    bullet('Mobile field rejects alphabets (sanitized + inline error)');
    bullet('Create challan as DRAFT');
    bullet('Confirm challan reduces stock');
    bullet('Confirm with quantity > stock returns HTTP 400');
    bullet('Product image upload to S3 and thumbnail display');
    bullet('This PDF exists in project root');

    h1('12. Viva Explanation');
    p('The system separates concerns into React UI, Express REST APIs, and Prisma data access. Role middleware protects routes. Sales challans demonstrate transactional inventory control: drafts do not touch stock; confirmation decrements stock only when every line has sufficient quantity, otherwise the whole transaction rolls back. Validation is enforced on both client and server. Product images are stored on S3 for scalable media handling.');

    doc.end();
    stream.on('finish', () => {
      console.log('PDF written to', outPath);
      resolve();
    });
    stream.on('error', reject);
  });
}

writePdf().catch((err) => {
  console.error(err);
  process.exit(1);
});
 
