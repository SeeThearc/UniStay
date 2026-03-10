import dotenv from 'dotenv';
// ⚠️ MUST be called before any other imports that read process.env (e.g. smsService)
dotenv.config();

import express from 'express';
import cors from 'cors';
import connectDB from './config/db.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

// Import routes
import authRoutes from './routes/authRoutes.js';
import roomRoutes from './routes/roomRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import feeRoutes from './routes/feeRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

// Connect to database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/', (req, res) => {
  res.json({
    message: 'Smart Hostel Management System API',
    version: '1.0.0',
    status: 'Running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error handling
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});