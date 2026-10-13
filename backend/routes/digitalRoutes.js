import express from 'express';
import {
  getDigitalResources,
  createDigitalResource,
  deleteDigitalResource,
  downloadDigitalResource,
} from '../controllers/digitalLibraryController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', getDigitalResources);
router.post('/', protect, authorize('ADMIN', 'LIBRARIAN'), createDigitalResource);
router.delete('/:id', protect, authorize('ADMIN', 'LIBRARIAN'), deleteDigitalResource);
router.get('/:id/download', downloadDigitalResource);

export default router;
