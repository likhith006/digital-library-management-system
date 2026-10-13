import express from 'express';
import { getDashboardStats, getBorrowingReport, getOverdueReport } from '../controllers/reportController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('ADMIN', 'LIBRARIAN'));

router.get('/dashboard', getDashboardStats);
router.get('/borrowing', getBorrowingReport);
router.get('/overdue', getOverdueReport);

export default router;
