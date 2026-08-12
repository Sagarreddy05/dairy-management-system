import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/payment.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { paymentSchema } from '../controllers/payment.controller';

const router = Router();
const roles = [Role.ADMIN, Role.SALES];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(paymentSchema), ctrl.create);
router.put('/:id', validate(paymentSchema.partial()), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
