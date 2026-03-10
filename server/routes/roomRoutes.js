import express from 'express';
import {
  getRooms,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  assignStudentToRoom,
  unassignStudentFromRoom,
  getAvailableRooms
} from '../controllers/roomController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdmin, isAdminOrWarden } from '../middleware/roleMiddleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getRooms)
  .post(protect, isAdmin, createRoom);

router.get('/available', protect, getAvailableRooms);

router.route('/:id')
  .get(protect, getRoomById)
  .put(protect, isAdmin, updateRoom)
  .delete(protect, isAdmin, deleteRoom);

router.post('/:id/assign', protect, isAdminOrWarden, assignStudentToRoom);
router.post('/:id/unassign', protect, isAdminOrWarden, unassignStudentFromRoom);

export default router;