import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  getAllUsers,
  getStudents
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, isAdminOrWarden } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/users', protect, isAdmin, getAllUsers);
router.get('/students', protect, isAdminOrWarden, getStudents);

export default router;