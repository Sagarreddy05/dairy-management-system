import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/farmer.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { farmerValidators, handleValidation } from '../middleware/validators';

const router = Router();
const roles = [Role.ADMIN, Role.SALES, Role.FARMER];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', farmerValidators, handleValidation, ctrl.create);
router.put('/:id', farmerValidators, handleValidation, ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
 
