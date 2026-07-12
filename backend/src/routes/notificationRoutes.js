import express from 'express';
import { getNotifications, markAsRead } from '../controllers/notificationController.js';
import auth from '../middlewares/auth.js';

const router = express.Router();

router.use(auth);

router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export default router;
