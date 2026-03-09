import express from 'express';
import {
  login,
  getMe,
  updateProfile,
  getAllUsers,
  getStudents,
  getWardens,
  createUser,
  bulkCreateUsers,
  toggleUserStatus,
  deleteUser,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, isAdminOrWarden } from '../middleware/roleMiddleware.js';

const router = express.Router();

// ── Public ────────────────────────────────────
router.post('/login', login);

// ── Current user ─────────────────────────────
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);

// ── Admin: read users ─────────────────────────
router.get('/users', protect, isAdmin, getAllUsers);
router.get('/students', protect, isAdminOrWarden, getStudents);
router.get('/wardens', protect, isAdmin, getWardens);

// ── Admin: create / manage users ─────────────
router.post('/admin/users', protect, isAdmin, createUser);
router.post('/admin/users/bulk', protect, isAdmin, bulkCreateUsers);
router.put('/admin/users/:id/toggle', protect, isAdmin, toggleUserStatus);
router.delete('/admin/users/:id', protect, isAdmin, deleteUser);

export default router;