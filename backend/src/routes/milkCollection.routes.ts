import { Router } from 'express';
import { Role } from '../types/enums';
import * as ctrl from '../controllers/milkCollection.controller';
import { authenticateJWT, authorizeRoles } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { milkCollectionSchema } from '../controllers/milkCollection.controller';

const router = Router();
const roles = [Role.ADMIN, Role.SALES, Role.FARMER];

router.use(authenticateJWT, authorizeRoles(...roles));

router.get('/', ctrl.list);
router.get('/:id', ctrl.getById);
router.post('/', validate(milkCollectionSchema), ctrl.create);
router.put('/:id', validate(milkCollectionSchema.partial()), ctrl.update);
router.delete('/:id', ctrl.remove);

export default router;
