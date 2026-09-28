import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/challan.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { challanValidators, handleValidation, idParam } from '../middleware/validators';

const router = Router();
const roles = [Role.ADMIN, Role.SALES];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', idParam, handleValidation, ctrl.getById);
router.post('/', challanValidators, handleValidation, ctrl.create);
router.post('/:id/confirm', idParam, handleValidation, ctrl.confirm);
router.post('/:id/cancel', idParam, handleValidation, ctrl.cancel);

export default router;
 
