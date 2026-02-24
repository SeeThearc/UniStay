import Fee from '../models/Fee.js';
import User from '../models/User.js';

// @desc    Get all fees
// @route   GET /api/fees
// @access  Private/Admin
export const getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find({})
      .populate('studentId', 'name email studentId phoneNumber')
      .sort('-createdAt');

    res.json({
      success: true,
      count: fees.length,
      data: fees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get student's fee details
// @route   GET /api/fees/my
// @access  Private/Student
export const getMyFees = async (req, res) => {
  try {
    const fee = await Fee.findOne({ studentId: req.user._id })
      .populate('studentId', 'name email studentId');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    res.json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get fee by student ID
// @route   GET /api/fees/student/:studentId
// @access  Private/Admin/Warden
export const getFeeByStudentId = async (req, res) => {
  try {
    const fee = await Fee.findOne({ studentId: req.params.studentId })
      .populate('studentId', 'name email studentId phoneNumber');

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    res.json({
      success: true,
      data: fee
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create or update fee
// @route   POST /api/fees
// @access  Private/Admin
export const createOrUpdateFee = async (req, res) => {
  try {
    const { studentId, totalFee, semester, dueDate } = req.body;

    // Check if student exists
    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    if (student.role !== 'student') {
      return res.status(400).json({
        success: false,
        message: 'User is not a student'
      });
    }

    // Check if fee record exists
    let fee = await Fee.findOne({ studentId });

    if (fee) {
      // Update existing fee
      fee.totalFee = totalFee;
      fee.semester = semester || fee.semester;
      fee.dueDate = dueDate || fee.dueDate;
      await fee.save();
    } else {
      // Create new fee record
      fee = await Fee.create({
        studentId,
        totalFee,
        semester,
        dueDate
      });
    }

    const populatedFee = await Fee.findById(fee._id)
      .populate('studentId', 'name email studentId');

    res.json({
      success: true,
      data: populatedFee,
      message: 'Fee record updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Update payment
// @route   PUT /api/fees/:id/payment
// @access  Private/Admin
export const updatePayment = async (req, res) => {
  try {
    const { amount, paymentMethod, transactionId, remarks } = req.body;

    const fee = await Fee.findById(req.params.id);

    if (!fee) {
      return res.status(404).json({
        success: false,
        message: 'Fee record not found'
      });
    }

    // Add to payment history
    fee.paymentHistory.push({
      amount,
      paymentMethod,
      transactionId,
      remarks,
      paymentDate: Date.now()
    });

    // Update amount paid
    fee.amountPaid += amount;

    await fee.save();

    const updatedFee = await Fee.findById(fee._id)
      .populate('studentId', 'name email studentId');

    res.json({
      success: true,
      data: updatedFee,
      message: 'Payment updated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get fee statistics
// @route   GET /api/fees/stats
// @access  Private/Admin
export const getFeeStats = async (req, res) => {
  try {
    const fees = await Fee.find({});

    const stats = {
      totalFeeAmount: 0,
      totalCollected: 0,
      totalPending: 0,
      paidCount: 0,
      partiallyPaidCount: 0,
      unpaidCount: 0
    };

    fees.forEach(fee => {
      stats.totalFeeAmount += fee.totalFee;
      stats.totalCollected += fee.amountPaid;
      stats.totalPending += fee.remainingDues;

      if (fee.status === 'Paid') stats.paidCount++;
      else if (fee.status === 'Partially Paid') stats.partiallyPaidCount++;
      else stats.unpaidCount++;
    });

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};