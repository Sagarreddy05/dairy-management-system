export const Role = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  FARMER: 'FARMER',
  DELIVERY: 'DELIVERY',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const MilkType = {
  COW: 'COW',
  BUFFALO: 'BUFFALO',
} as const;
export type MilkType = (typeof MilkType)[keyof typeof MilkType];

export const CustomerType = {
  HOME: 'HOME',
  SHOP: 'SHOP',
  HOTEL: 'HOTEL',
} as const;
export type CustomerType = (typeof CustomerType)[keyof typeof CustomerType];

export const ProductCategory = {
  MILK: 'MILK',
  CURD: 'CURD',
  GHEE: 'GHEE',
  BUTTER: 'BUTTER',
  PANEER: 'PANEER',
} as const;
export type ProductCategory = (typeof ProductCategory)[keyof typeof ProductCategory];

export const MovementType = {
  IN: 'IN',
  OUT: 'OUT',
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export const DeliveryStatus = {
  PENDING: 'PENDING',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const PaymentStatus = {
  UNPAID: 'UNPAID',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const EntityStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type EntityStatus = (typeof EntityStatus)[keyof typeof EntityStatus];

export const ChallanStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  CANCELLED: 'CANCELLED',
} as const;
export type ChallanStatus = (typeof ChallanStatus)[keyof typeof ChallanStatus];
 
