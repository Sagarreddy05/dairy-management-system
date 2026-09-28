import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/invoice.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { invoiceSchema, generateSchema } from '../controllers/invoice.controller';

const router = Router();
const roles = [Role.ADMIN, Role.SALES];

router.use(authenticateJWT, authorizeRoles(...roles));

router.post('/generate', validate(generateSchema), ctrl.generate);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(invoiceSchema), ctrl.create);
router.put('/:id', validate(invoiceSchema.partial()), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
 
