import express from 'express';
import { askAI } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import { isAdminOrWarden } from '../middleware/roleMiddleware.js';

const router = express.Router();

// POST /api/ai/query  — admin and warden only
router.post('/query', protect, isAdminOrWarden, askAI);

export default router;
