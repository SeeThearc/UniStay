import User from '../models/User.js';
import Room from '../models/Room.js';
import Complaint from '../models/Complaint.js';
import Fee from '../models/Fee.js';
import Leave from '../models/Leave.js';

// @desc    Get admin dashboard stats
// @route   GET /api/dashboard/admin
// @access  Private/Admin
export const getAdminDashboard = async (req, res) => {
  try {
    // Total students
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Total rooms
    const totalRooms = await Room.countDocuments();

    // Occupied rooms
    const occupiedRooms = await Room.countDocuments({ status: 'Full' });

    // Room occupancy percentage
    const roomOccupancyPercentage = totalRooms > 0 
      ? ((occupiedRooms / totalRooms) * 100).toFixed(2) 
      : 0;

    // Pending complaints
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });

    // Total complaints by status
    const complaintsByStatus = await Complaint.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Fee statistics
    const feeStats = await Fee.aggregate([
      {
        $group: {
          _id: null,
          totalFeeAmount: { $sum: '$totalFee' },
          totalCollected: { $sum: '$amountPaid' },
          totalPending: { $sum: '$remainingDues' }
        }
      }
    ]);

    // Leave requests count
    const totalLeaves = await Leave.countDocuments();
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });

    // Room status distribution
    const roomsByStatus = await Room.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Fee status distribution
    const feesByStatus = await Fee.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Recent complaints
    const recentComplaints = await Complaint.find({})
      .populate('studentId', 'name studentId')
      .sort('-createdAt')
      .limit(5);

    // Recent leaves
    const recentLeaves = await Leave.find({})
      .populate('studentId', 'name studentId')
      .sort('-createdAt')
      .limit(5);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalRooms,
          occupiedRooms,
          roomOccupancyPercentage,
          pendingComplaints,
          pendingLeaves,
          totalLeaves
        },
        feeStats: feeStats[0] || {
          totalFeeAmount: 0,
          totalCollected: 0,
          totalPending: 0
        },
        complaintsByStatus,
        roomsByStatus,
        feesByStatus,
        recentComplaints,
        recentLeaves
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get warden dashboard stats
// @route   GET /api/dashboard/warden
// @access  Private/Warden
export const getWardenDashboard = async (req, res) => {
  try {
    // Total students
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Pending complaints
    const pendingComplaints = await Complaint.countDocuments({ status: 'Pending' });
    const totalComplaints = await Complaint.countDocuments();

    // Pending leaves
    const pendingLeaves = await Leave.countDocuments({ status: 'Pending' });
    const totalLeaves = await Leave.countDocuments();

    // Room occupancy
    const totalRooms = await Room.countDocuments();
    const occupiedRooms = await Room.countDocuments({ status: 'Full' });

    // Recent complaints
    const recentComplaints = await Complaint.find({})
      .populate('studentId', 'name studentId')
      .sort('-createdAt')
      .limit(10);

    // Recent leaves
    const recentLeaves = await Leave.find({ status: 'Pending' })
      .populate('studentId', 'name studentId phoneNumber')
      .sort('-createdAt')
      .limit(10);

    res.json({
      success: true,
      data: {
        overview: {
          totalStudents,
          totalRooms,
          occupiedRooms,
          pendingComplaints,
          totalComplaints,
          pendingLeaves,
          totalLeaves
        },
        recentComplaints,
        recentLeaves
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student dashboard stats
// @route   GET /api/dashboard/student
// @access  Private/Student
export const getStudentDashboard = async (req, res) => {
  try {
    // Get student's room details
    const student = await User.findById(req.user._id).populate('roomAssigned');

    // Get student's complaints
    const myComplaints = await Complaint.find({ studentId: req.user._id })
      .sort('-createdAt')
      .limit(5);

    const complaintStats = {
      total: await Complaint.countDocuments({ studentId: req.user._id }),
      pending: await Complaint.countDocuments({ studentId: req.user._id, status: 'Pending' }),
      inProgress: await Complaint.countDocuments({ studentId: req.user._id, status: 'In Progress' }),
      resolved: await Complaint.countDocuments({ studentId: req.user._id, status: 'Resolved' })
    };

    // Get student's leaves
    const myLeaves = await Leave.find({ studentId: req.user._id })
      .sort('-createdAt')
      .limit(5);

    const leaveStats = {
      total: await Leave.countDocuments({ studentId: req.user._id }),
      pending: await Leave.countDocuments({ studentId: req.user._id, status: 'Pending' }),
      approved: await Leave.countDocuments({ studentId: req.user._id, status: 'Approved' }),
      rejected: await Leave.countDocuments({ studentId: req.user._id, status: 'Rejected' })
    };

    // Get student's fee details
    const myFee = await Fee.findOne({ studentId: req.user._id });

    res.json({
      success: true,
      data: {
        profile: {
          name: student.name,
          email: student.email,
          studentId: student.studentId,
          phoneNumber: student.phoneNumber
        },
        roomDetails: student.roomAssigned || null,
        feeDetails: myFee || null,
        complaintStats,
        leaveStats,
        recentComplaints: myComplaints,
        recentLeaves: myLeaves
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};