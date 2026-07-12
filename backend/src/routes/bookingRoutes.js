import express from 'express';
import { createBooking, getBookings, cancelBooking } from '../controllers/bookingController.js';
import auth from '../middlewares/auth.js';
import validate from '../middlewares/validate.js';
import { bookingCreateSchema } from '../validators/booking.js';

const router = express.Router();

router.use(auth);

router.get('/', getBookings);
router.post('/', validate(bookingCreateSchema), createBooking);
router.patch('/:id/cancel', cancelBooking);

export default router;
