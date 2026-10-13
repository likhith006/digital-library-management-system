import express from 'express';
import { getBooks, getBookById, createBook, updateBook, deleteBook, searchExternalBooks } from '../controllers/bookController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getBooks);
router.get('/external/search', searchExternalBooks);
router.get('/:id', getBookById);
router.post('/', protect, authorize('ADMIN', 'LIBRARIAN'), createBook);
router.put('/:id', protect, authorize('ADMIN', 'LIBRARIAN'), updateBook);
router.delete('/:id', protect, authorize('ADMIN', 'LIBRARIAN'), deleteBook);

export default router;

