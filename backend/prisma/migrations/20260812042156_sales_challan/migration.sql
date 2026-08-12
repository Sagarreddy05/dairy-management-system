-- CreateTable
CREATE TABLE "SalesChallan" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "totalQuantity" REAL NOT NULL DEFAULT 0,
    "totalAmount" REAL NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SalesChallan_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "SalesChallan_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "SalesChallanItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "challanId" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productUnit" TEXT NOT NULL,
    "unitPrice" REAL NOT NULL,
    "imageUrl" TEXT,
    "quantity" INTEGER NOT NULL,
    "lineTotal" REAL NOT NULL,
    CONSTRAINT "SalesChallanItem_challanId_fkey" FOREIGN KEY ("challanId") REFERENCES "SalesChallan" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesChallan_challanNumber_key" ON "SalesChallan"("challanNumber");

-- CreateIndex
CREATE INDEX "SalesChallan_customerId_idx" ON "SalesChallan"("customerId");

-- CreateIndex
CREATE INDEX "SalesChallan_status_idx" ON "SalesChallan"("status");

-- CreateIndex
CREATE INDEX "SalesChallan_challanNumber_idx" ON "SalesChallan"("challanNumber");

-- CreateIndex
CREATE INDEX "SalesChallanItem_challanId_idx" ON "SalesChallanItem"("challanId");

-- CreateIndex
CREATE INDEX "SalesChallanItem_productId_idx" ON "SalesChallanItem"("productId");
