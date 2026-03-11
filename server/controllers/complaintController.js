import Complaint from '../models/Complaint.js';
import User from '../models/User.js';
import { sendSMS, notifyWardens } from '../utils/smsService.js';

// @desc    Get all complaints
// @route   GET /api/complaints
// @access  Private/Admin/Warden
export const getComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({})
      .populate('studentId', 'name email studentId')
      .populate('resolvedBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get complaints by student
// @route   GET /api/complaints/my
// @access  Private/Student
export const getMyComplaints = async (req, res) => {
  try {
    const complaints = await Complaint.find({ studentId: req.user._id })
      .populate('resolvedBy', 'name email')
      .sort('-createdAt');

    res.json({
      success: true,
      count: complaints.length,
      data: complaints
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
export const getComplaintById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('studentId', 'name email studentId phoneNumber')
      .populate('resolvedBy', 'name email')
      .populate('comments.user', 'name email role');

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user is authorized to view this complaint
    if (
      req.user.role === 'student' &&
      complaint.studentId._id.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this complaint'
      });
    }

    res.json({
      success: true,
      data: complaint
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new complaint
// @route   POST /api/complaints
// @access  Private/Student
export const createComplaint = async (req, res) => {
  try {
    console.log('=== CREATE COMPLAINT ===');
    const { title, description, category, priority } = req.body;

    // Generate ticket ID manually
    const count = await Complaint.countDocuments();
    const ticketId = `TKT${String(count + 1).padStart(6, '0')}`;

    console.log('Generated ticket ID:', ticketId);
    console.log('Student ID:', req.user._id);

    const complaint = await Complaint.create({
      ticketId,
      studentId: req.user._id,
      title,
      description,
      category,
      priority: priority || 'Medium'
    });

    const populatedComplaint = await Complaint.findById(complaint._id)
      .populate('studentId', 'name email studentId phoneNumber');

    console.log('✅ Complaint created successfully:', complaint._id);

    // Notify all active wardens via SMS
    const student = populatedComplaint.studentId;
    const wardenMessage =
      `UniStay Hostel: New complaint by ${student.name} (ID: ${student.studentId || 'N/A'}). ` +
      `Ticket: #${complaint.ticketId} | Category: ${category} | Priority: ${priority || 'Medium'} | Issue: ${title}. ` +
      `Please review in the portal.`;
    notifyWardens(wardenMessage, User);

    // Send confirmation SMS to the student
    // const studentMessage =
    //   `UniStay Hostel: Your complaint has been received. ` +
    //   `Ticket ID: #${complaint.ticketId} | Category: ${category} | Priority: ${priority || 'Medium'}. ` +
    //   `We will update you once it is reviewed. – Management`;
    // await sendSMS(student.phoneNumber, studentMessage);

    res.status(201).json({
      success: true,
      data: populatedComplaint,
      message: 'Complaint created successfully'
    });
  } catch (error) {
    console.error('❌ Create complaint error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Private/Admin/Warden
export const updateComplaintStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    complaint.status = status;

    if (status === 'Resolved') {
      complaint.resolvedBy = req.user._id;
      complaint.resolvedAt = Date.now();
    }

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('studentId', 'name email studentId phoneNumber')
      .populate('resolvedBy', 'name email');

    // Notify the student via SMS
    const studentPhone = updatedComplaint.studentId?.phoneNumber;
    const studentMessage =
      `UniStay Hostel: Your complaint #${updatedComplaint.ticketId} status has been updated to "${status}". ` +
      `${status === 'Resolved' ? 'We are glad to have resolved your issue.' : 'Please check the portal for details.'} – Management`;
    sendSMS(studentPhone, studentMessage);

    res.json({
      success: true,
      data: updatedComplaint,
      message: 'Complaint status updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Add comment to complaint
// @route   POST /api/complaints/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    // Check if user is authorized
    if (
      req.user.role === 'student' &&
      complaint.studentId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to comment on this complaint'
      });
    }

    complaint.comments.push({
      user: req.user._id,
      userName: req.user.name,
      comment
    });

    await complaint.save();

    const updatedComplaint = await Complaint.findById(complaint._id)
      .populate('studentId', 'name email studentId')
      .populate('comments.user', 'name email role');

    res.json({
      success: true,
      data: updatedComplaint,
      message: 'Comment added successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Private/Admin
export const deleteComplaint = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);

    if (!complaint) {
      return res.status(404).json({
        success: false,
        message: 'Complaint not found'
      });
    }

    await complaint.deleteOne();

    res.json({
      success: true,
      message: 'Complaint deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};