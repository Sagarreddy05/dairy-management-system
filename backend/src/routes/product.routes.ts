import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/product.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { stockSchema } from '../controllers/product.controller';
import { optionalImageUpload, requireImageUpload } from '../middleware/upload';
import { productValidators, handleValidation } from '../middleware/validators';

const router = Router();
const roles = [Role.ADMIN, Role.SALES, Role.DELIVERY];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', optionalImageUpload, productValidators, handleValidation, ctrl.create);
router.put('/:id', optionalImageUpload, productValidators, handleValidation, ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/upload', requireImageUpload, ctrl.uploadImage);
router.post('/:id/stock', validate(stockSchema), ctrl.adjustStock);

export default router;
 
