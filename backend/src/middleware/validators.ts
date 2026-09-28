import { body, param, validationResult, ValidationChain } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

export const handleValidation = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({
        field: 'path' in e ? e.path : undefined,
        message: e.msg,
      })),
    });
  }
  next();
};

export const nameRule = (field = 'name') =>
  body(field)
    .trim()
    .notEmpty()
    .withMessage(`${field} is required`)
    .matches(/^[A-Za-z ]+$/)
    .withMessage(`${field} must contain alphabets and spaces only`);

export const mobileRule = (field = 'mobileNumber') =>
  body(field)
    .trim()
    .matches(/^\d{10}$/)
    .withMessage('Mobile number must be exactly 10 digits');

export const emailRule = (field = 'email') =>
  body(field).trim().isEmail().withMessage('Valid email is required');

export const priceRule = (field = 'unitPrice') =>
  body(field).isFloat({ gt: 0 }).withMessage(`${field} must be a positive number`);

export const quantityRule = (field = 'quantity') =>
  body(field).isInt({ gt: 0 }).withMessage(`${field} must be a positive integer`);

export const skuRule = (field = 'sku') =>
  body(field)
    .trim()
    .matches(/^[A-Za-z0-9-]+$/)
    .withMessage('SKU must contain letters, numbers, and hyphens only');

export const passwordRule = (field = 'password') =>
  body(field)
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/)
    .withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain a lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain a number');

export const loginValidators: ValidationChain[] = [
  emailRule('email'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const farmerValidators: ValidationChain[] = [
  nameRule('farmerName'),
  mobileRule('mobileNumber'),
  body('village').trim().notEmpty().withMessage('Village is required'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('cattleCount').optional().isInt({ min: 0 }).withMessage('Cattle count must be >= 0'),
];

export const customerValidators: ValidationChain[] = [
  nameRule('customerName'),
  mobileRule('mobileNumber'),
  body('address').trim().notEmpty().withMessage('Address is required'),
  body('area').trim().notEmpty().withMessage('Area is required'),
  body('customerType').isIn(['HOME', 'SHOP', 'HOTEL']).withMessage('Invalid customer type'),
];

export const productValidators: ValidationChain[] = [
  nameRule('productName'),
  skuRule('sku'),
  body('category').isIn(['MILK', 'CURD', 'GHEE', 'BUTTER', 'PANEER']).withMessage('Invalid category'),
  priceRule('unitPrice'),
  body('currentStock').optional().isFloat({ min: 0 }).withMessage('Stock must be >= 0'),
  body('minStockAlertQty').optional().isFloat({ min: 0 }).withMessage('Min alert must be >= 0'),
];

export const challanValidators: ValidationChain[] = [
  body('customerId').trim().notEmpty().withMessage('Customer is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.productId').trim().notEmpty().withMessage('Product is required'),
  body('items.*.quantity').isInt({ gt: 0 }).withMessage('Quantity must be a positive integer'),
  body('status').optional().isIn(['DRAFT', 'CONFIRMED']).withMessage('Invalid status'),
];

export const idParam = [param('id').trim().notEmpty().withMessage('ID is required')];
 
