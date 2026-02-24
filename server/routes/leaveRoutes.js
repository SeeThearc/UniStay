import express from 'express';
import {
  getAllLeaves,
  getMyLeaves,
  getLeaveById,
  applyLeave,
  updateLeaveStatus,
  deleteLeave,
  getPendingLeaves
} from '../controllers/leaveController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, isAdminOrWarden, isStudent } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, isAdminOrWarden, getAllLeaves)
  .post(protect, isStudent, applyLeave);

router.get('/my', protect, isStudent, getMyLeaves);
router.get('/pending', protect, isAdminOrWarden, getPendingLeaves);

router.route('/:id')
  .get(protect, getLeaveById)
  .delete(protect, deleteLeave);

router.put('/:id/status', protect, isAdminOrWarden, updateLeaveStatus);

export default router;