import express from 'express';
import {
  getAdminDashboard,
  getWardenDashboard,
  getStudentDashboard
} from '../controllers/dashboardController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authorize } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.get('/admin', protect, authorize('admin'), getAdminDashboard);
router.get('/warden', protect, authorize('warden'), getWardenDashboard);
router.get('/student', protect, authorize('student'), getStudentDashboard);

export default router;