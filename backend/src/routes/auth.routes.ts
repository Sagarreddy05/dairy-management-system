import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { authenticateJWT } from '../middleware/auth.middleware';
import { loginValidators, handleValidation } from '../middleware/validators';

const router = Router();

router.post('/login', loginValidators, handleValidation, authController.login);
router.get('/me', authenticateJWT, authController.me);

export default router;
