import express from 'express';
import { signup, login, refresh, logout } from '../controllers/authController.js';
import validate from '../middlewares/validate.js';
import tenantResolver from '../middlewares/tenantResolver.js';
import { signupSchema, loginSchema } from '../validators/auth.js';

const router = express.Router();

router.post('/signup', validate(signupSchema), signup);
router.post('/login', tenantResolver, validate(loginSchema), login);
router.post('/refresh', refresh);
router.post('/logout', logout);

export default router;
