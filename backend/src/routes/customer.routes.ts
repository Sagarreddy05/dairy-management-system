import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/customer.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { customerValidators, handleValidation } from '../middleware/validators';

const router = Router();
const roles = [Role.ADMIN, Role.SALES];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', customerValidators, handleValidation, ctrl.create);
router.put('/:id', customerValidators, handleValidation, ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
 
