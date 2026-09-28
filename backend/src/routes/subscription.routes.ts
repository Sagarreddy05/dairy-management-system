import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/subscription.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { subscriptionSchema } from '../controllers/subscription.controller';

const router = Router();
const roles = [Role.ADMIN, Role.SALES];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(subscriptionSchema), ctrl.create);
router.put('/:id', validate(subscriptionSchema.partial()), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
 
