import express from 'express';
import {
  getAllFees,
  getMyFees,
  getFeeByStudentId,
  createOrUpdateFee,
  updatePayment,
  getFeeStats
} from '../controllers/feeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, isAdminOrWarden, isStudent } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/', protect, isAdmin, getAllFees);
router.get('/my', protect, isStudent, getMyFees);
router.get('/stats', protect, isAdmin, getFeeStats);
router.post('/', protect, isAdmin, createOrUpdateFee);
router.get('/student/:studentId', protect, isAdminOrWarden, getFeeByStudentId);
router.put('/:id/payment', protect, isAdmin, updatePayment);

export default router;