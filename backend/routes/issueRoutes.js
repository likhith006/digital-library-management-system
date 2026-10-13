import express from 'express';
import { issueBook, getIssues, getMyIssues, returnBook } from '../controllers/issueController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.post('/', authorize('ADMIN', 'LIBRARIAN'), issueBook);
router.get('/', authorize('ADMIN', 'LIBRARIAN'), getIssues);
router.get('/my', getMyIssues);
router.put('/:id/return', authorize('ADMIN', 'LIBRARIAN'), returnBook);

export default router;
