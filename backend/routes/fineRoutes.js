import express from 'express';
import { getFines, getMyFines, payFine } from '../controllers/fineController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'LIBRARIAN'), getFines);
router.get('/my', getMyFines);
router.put('/:id/pay', payFine);

export default router;
