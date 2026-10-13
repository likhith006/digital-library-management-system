import express from 'express';
import { getUsers, getUserById, createUser, updateUser, deleteUser } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/', authorize('ADMIN', 'LIBRARIAN'), getUsers);
router.get('/:id', authorize('ADMIN', 'LIBRARIAN'), getUserById);
router.post('/', authorize('ADMIN', 'LIBRARIAN'), createUser);
router.put('/:id', authorize('ADMIN', 'LIBRARIAN'), updateUser);
router.delete('/:id', authorize('ADMIN'), deleteUser);

export default router;
