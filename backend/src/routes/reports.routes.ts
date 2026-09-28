import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/reports.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';

const router = Router();
const roles = [Role.ADMIN, Role.SALES, Role.FARMER, Role.DELIVERY];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/dashboard', ctrl.dashboard);
router.get('/daily-milk-collection', ctrl.dailyMilk);
router.get('/farmer-payments', ctrl.farmerPayments);
router.get('/customer-billing', ctrl.customerBilling);
router.get('/deliveries', ctrl.deliveries);
router.get('/inventory', ctrl.inventory);

export default router;
 
