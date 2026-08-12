# FarmFresh — Dairy Farm Management System

Production-style full-stack application for managing dairy farm operations: farmers, milk collection, customers, subscriptions, inventory, deliveries, billing, and payments.

## Architecture

```
┌─────────────────┐     JWT + REST      ┌──────────────────┐
│  React (Vite)   │ ──────────────────► │  Express (TS)    │
│  Admin Dashboard│                     │  Controllers /   │
└─────────────────┘                     │  Services        │
                                        └────────┬─────────┘
                                                 │ Prisma ORM
                                        ┌────────▼─────────┐
                                        │   PostgreSQL     │
                                        └──────────────────┘
```

| Layer | Path | Responsibility |
|-------|------|----------------|
| Frontend | `frontend/` | Responsive admin UI, auth context, CRUD screens, reports |
| Backend | `backend/` | REST API, JWT auth, validation, business logic |
| Database | PostgreSQL via Prisma | Persistent data and relations |

## Tech Stack

**Frontend:** React, Vite, React Router, Axios, plain CSS  
**Backend:** Node.js, TypeScript, Express, Prisma, JWT, bcryptjs, Zod, Multer, AWS S3 (`multer-s3`)  
**Database:** SQLite (local) / PostgreSQL (production)  
**Storage:** Amazon S3 for product images

## Prerequisites

- Node.js 20+
- PostgreSQL 16+
- npm
- Docker (optional)

## Environment Variables

Copy `backend/.env.example` to `backend/.env`:

```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="change-me-to-a-strong-secret-in-production"

# AWS S3 product image uploads
AWS_REGION="ap-south-1"
AWS_ACCESS_KEY_ID="your-access-key-id"
AWS_SECRET_ACCESS_KEY="your-secret-access-key"
AWS_S3_BUCKET_NAME="your-dairy-product-images-bucket"
```

## AWS S3 Product Images

Product create/update and `POST /api/products/:id/upload` send images to Amazon S3 via `multer-s3`. The public object URL is stored in `Product.imagePath`.

### Setup steps

1. Create an S3 bucket (e.g. `farmfresh-product-images`) in your preferred region.
2. Create an IAM user with programmatic access and attach a policy allowing at least:
   - `s3:PutObject`
   - `s3:GetObject`
   - `s3:DeleteObject`
   on `arn:aws:s3:::your-bucket-name/products/*`
3. For browser thumbnails without signed URLs, allow public read on the `products/` prefix (bucket policy) **or** use CloudFront. Example bucket policy for public read of product images:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadProductImages",
      "Effect": "Allow",
      "Principal": "*",
      "Action": ["s3:GetObject"],
      "Resource": ["arn:aws:s3:::your-bucket-name/products/*"]
    }
  ]
}
```

4. Put the region, access key, secret key, and bucket name into `backend/.env`.
5. Restart the backend (`npm run dev`).
6. In the Products page, add/edit a product and choose a JPG/PNG/WEBP image (max 5 MB). The S3 URL is saved to `imagePath` and shown as a thumbnail.

### Validation

- Allowed types: `.jpg`, `.jpeg`, `.png`, `.webp`
- Max file size: 5 MB
- Failed S3 uploads return a clear API error message

## Database Setup

Local development uses SQLite (`file:./dev.db`). For production you can point `DATABASE_URL` at PostgreSQL.

### PostgreSQL (optional / production)

```sql
CREATE USER dairy WITH PASSWORD 'dairy123';
CREATE DATABASE dairy_db OWNER dairy;
```

Or use Docker Compose (starts Postgres + backend):

```bash
cd backend
docker compose up -d db
```

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name init
npm run seed
npm run dev
```

API runs at `http://localhost:5000`.

## Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

UI runs at `http://localhost:5173` (proxies `/api` to the backend).

## Prisma Commands

```bash
npx prisma generate
npx prisma migrate dev --name init
npx prisma migrate deploy
npm run seed
npx prisma studio
```

## API Endpoints

### Auth
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Current user profile |

### CRUD (all require Bearer token)
| Resource | Base path |
|----------|-----------|
| Farmers | `/api/farmers` |
| Milk Collections | `/api/milk-collections` |
| Customers | `/api/customers` |
| Subscriptions | `/api/subscriptions` |
| Products | `/api/products` |
| Sales Challans | `/api/challans` |
| Deliveries | `/api/deliveries` |
| Invoices | `/api/invoices` |
| Payments | `/api/payments` |

Standard methods: `GET /`, `GET /:id`, `POST /`, `PUT /:id`, `DELETE /:id`  
Query: `?page=1&limit=10&search=term`

### Special
| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/deliveries/generate` | Generate daily deliveries from subscriptions |
| POST | `/api/invoices/generate` | Generate monthly invoices |
| POST | `/api/products/:id/upload` | Upload product image to S3 (multipart) |
| POST | `/api/products/:id/stock` | Stock IN/OUT movement |
| POST | `/api/challans` | Create sales challan (DRAFT or CONFIRMED) |
| POST | `/api/challans/:id/confirm` | Confirm draft challan (reduces stock) |
| POST | `/api/challans/:id/cancel` | Cancel draft challan |

### Reports
| Method | Path |
|--------|------|
| GET | `/api/reports/dashboard` |
| GET | `/api/reports/daily-milk-collection?date=` |
| GET | `/api/reports/farmer-payments?from=&to=` |
| GET | `/api/reports/customer-billing?month=` |
| GET | `/api/reports/deliveries?date=` |
| GET | `/api/reports/inventory` |

Add `?format=csv` for CSV download.

## Role Access

| Role | Access |
|------|--------|
| ADMIN | Full access including sales challans |
| SALES | Farmers, milk, customers, subscriptions, products, challans, deliveries, invoices, payments, reports |
| FARMER | Farmers, milk collections, reports |
| DELIVERY | Products, deliveries, reports |

## Business Logic

- **Milk collection:** `totalAmount = quantityLiters × ratePerLiter` (server-side)
- **Inventory:** stock cannot go negative; every change logs a `StockMovement`
- **Sales challans:** draft does not change stock; confirm reduces stock in a Prisma transaction; insufficient stock returns HTTP 400
- **Deliveries:** generated from active subscriptions; marking DELIVERED decrements stock
- **Billing:** monthly invoice generation; payments update balance and status
- **SMS:** mock console logger on payment
- **Route optimization:** placeholder sorter by area/name
- **Validation:** frontend sanitization + express-validator on backend

## Docker Usage

```bash
cd backend
docker compose up --build
```

- Postgres: `localhost:5432`
- API: `localhost:5000`

After containers are up:

```bash
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npm run seed
```

## Deployment

### Database — Neon
1. Create a Neon Postgres project
2. Copy the connection string into `DATABASE_URL`
3. Run `npx prisma migrate deploy` and `npm run seed`

### Backend — Render
1. New Web Service from the `backend` folder
2. Build: `npm install && npx prisma generate && npm run build`
3. Start: `npx prisma migrate deploy && node dist/server.js`
4. Set `DATABASE_URL`, `JWT_SECRET`, `PORT`

### Frontend — Vercel
1. Import the `frontend` folder
2. Build command: `npm run build`
3. Output: `dist`
4. Set `VITE_API_URL` to your Render API URL (e.g. `https://your-api.onrender.com/api`)

## Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@farmfresh.com | Admin@123 | ADMIN |
| sales@farmfresh.com | Sales@123 | SALES |
| farmer@farmfresh.com | Farmer@123 | FARMER |
| delivery@farmfresh.com | Delivery@123 | DELIVERY |

## Postman

Import `dairy-management-system.postman_collection.json`.  
Set `baseUrl` to `http://localhost:5000/api`. Login request saves the JWT to `token`.

## Project Structure

```
dairy-management-system/
├── backend/
│   ├── prisma/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   └── server.ts
│   ├── uploads/images/
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   └── src/
│       ├── api/
│       ├── components/
│       ├── context/
│       ├── pages/
│       └── styles/
├── README.md
└── dairy-management-system.postman_collection.json
```

## License

MIT
