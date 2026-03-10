import Leave from '../models/Leave.js';
import User from '../models/User.js';
import { sendSMS, notifyWardens } from '../utils/smsService.js';

// @desc    Get all leaves
// @route   GET /api/leaves
// @access  Private/Admin/Warden
export const getAllLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({})
      .populate('studentId', 'name email studentId phoneNumber')
      .populate('approvedBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student's leaves
// @route   GET /api/leaves/my
// @access  Private/Student
export const getMyLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ studentId: req.user._id })
      .populate('approvedBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
export const getLeaveById = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id)
      .populate('studentId', 'name email studentId phoneNumber')
      .populate('approvedBy', 'name email');

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check if user is authorized
    if (
      req.user.role === 'student' &&
      leave.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this leave request'
      });
    }

    res.json({
      success: true,
      data: leave
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Apply for leave
// @route   POST /api/leaves
// @access  Private/Student
export const applyLeave = async (req, res) => {
  try {
    const { fromDate, toDate, reason, leaveType } = req.body;

    // Validate dates
    const from = new Date(fromDate);
    const to = new Date(toDate);

    if (from > to) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const leave = await Leave.create({
      studentId: req.user._id,
      fromDate,
      toDate,
      reason,
      leaveType: leaveType || 'Personal'
    });

    const populatedLeave = await Leave.findById(leave._id)
      .populate('studentId', 'name email studentId phoneNumber');

    // Notify all active wardens via SMS
    const student = populatedLeave.studentId;
    const fromStr = new Date(fromDate).toLocaleDateString('en-IN');
    const toStr = new Date(toDate).toLocaleDateString('en-IN');
    const wardenMessage =
      `UniStay Hostel: Leave request from ${student.name} (ID: ${student.studentId || 'N/A'}). ` +
      `Type: ${leaveType || 'Personal'} | From: ${fromStr} To: ${toStr} | Reason: ${reason}. ` +
      `Please review in the portal.`;
    await notifyWardens(wardenMessage, User);

    // Send confirmation SMS to the student
    const studentMessage =
      `UniStay Hostel: Your leave request has been submitted successfully. ` +
      `Type: ${leaveType || 'Personal'} | From: ${fromStr} To: ${toStr} | Reason: ${reason}. ` +
      `Status: Pending. We will notify you once it is reviewed. – Management`;
    await sendSMS(student.phoneNumber, studentMessage);

    res.status(201).json({
      success: true,
      data: populatedLeave,
      message: 'Leave application submitted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update leave status
// @route   PUT /api/leaves/:id/status
// @access  Private/Admin/Warden
export const updateLeaveStatus = async (req, res) => {
  try {
    const { status, rejectionReason } = req.body;

    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    if (leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: `Leave has already been ${leave.status.toLowerCase()}`
      });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvedAt = Date.now();

    if (status === 'Rejected' && rejectionReason) {
      leave.rejectionReason = rejectionReason;
    }

    await leave.save();

    const updatedLeave = await Leave.findById(leave._id)
      .populate('studentId', 'name email studentId phoneNumber')
      .populate('approvedBy', 'name email');

    // Notify the student via SMS
    const studentPhone = updatedLeave.studentId?.phoneNumber;
    const fromStr = new Date(updatedLeave.fromDate).toLocaleDateString('en-IN');
    const toStr = new Date(updatedLeave.toDate).toLocaleDateString('en-IN');
    let studentMessage =
      `UniStay Hostel: Your leave request from ${fromStr} to ${toStr} has been ${status}. `;
    if (status === 'Rejected' && rejectionReason) {
      studentMessage += `Reason: ${rejectionReason}. `;
    }
    studentMessage += `– Management`;
    await sendSMS(studentPhone, studentMessage);

    res.json({
      success: true,
      data: updatedLeave,
      message: `Leave ${status.toLowerCase()} successfully`
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete leave
// @route   DELETE /api/leaves/:id
// @access  Private/Student (own) or Admin
export const deleteLeave = async (req, res) => {
  try {
    const leave = await Leave.findById(req.params.id);

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: 'Leave request not found'
      });
    }

    // Check authorization
    if (
      req.user.role === 'student' &&
      leave.studentId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this leave request'
      });
    }

    // Students can only delete pending leaves
    if (req.user.role === 'student' && leave.status !== 'Pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete approved/rejected leave requests'
      });
    }

    await leave.deleteOne();

    res.json({
      success: true,
      message: 'Leave request deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get pending leaves
// @route   GET /api/leaves/pending
// @access  Private/Admin/Warden
export const getPendingLeaves = async (req, res) => {
  try {
    const leaves = await Leave.find({ status: 'Pending' })
      .populate('studentId', 'name email studentId phoneNumber')
      .sort('-createdAt');

    res.json({
      success: true,
      count: leaves.length,
      data: leaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};