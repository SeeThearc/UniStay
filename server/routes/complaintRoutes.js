import express from 'express';
import {
  getComplaints,
  getMyComplaints,
  getComplaintById,
  createComplaint,
  updateComplaintStatus,
  addComment,
  deleteComplaint
} from '../controllers/complaintController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, isAdminOrWarden, isStudent } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, isAdminOrWarden, getComplaints)
  .post(protect, isStudent, createComplaint);

router.get('/my', protect, isStudent, getMyComplaints);

router.route('/:id')
  .get(protect, getComplaintById)
  .delete(protect, isAdmin, deleteComplaint);

router.put('/:id/status', protect, isAdminOrWarden, updateComplaintStatus);
router.post('/:id/comments', protect, addComment);

export default router;