import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/delivery.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { deliverySchema, generateSchema } from '../controllers/delivery.controller';

const router = Router();
const roles = [Role.ADMIN, Role.SALES, Role.DELIVERY];

router.use(authenticateJWT, authorizeRoles(...roles));

router.post('/generate', validate(generateSchema), ctrl.generate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(deliverySchema), ctrl.create);
router.put('/:id', validate(deliverySchema.partial()), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
 
