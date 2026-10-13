import express from 'express';
import {
  createReservation,
  getReservations,
  getMyReservations,
  updateReservationStatus,
  cancelReservation,
} from '../controllers/reservationController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', createReservation);
router.get('/', authorize('ADMIN', 'LIBRARIAN'), getReservations);
router.get('/my', getMyReservations);
router.put('/:id', authorize('ADMIN', 'LIBRARIAN'), updateReservationStatus);
router.delete('/:id', cancelReservation);

export default router;
