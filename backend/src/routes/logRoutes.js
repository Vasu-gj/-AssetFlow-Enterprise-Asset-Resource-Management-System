import express from 'express';
import { getActivityLogs } from '../controllers/logController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getActivityLogs);

export default router;
