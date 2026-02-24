import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromDate: {
    type: Date,
    required: [true, 'Please provide start date']
  },
  toDate: {
    type: Date,
    required: [true, 'Please provide end date']
  },
  reason: {
    type: String,
    required: [true, 'Please provide a reason'],
    trim: true,
    maxlength: 500
  },
  status: {
    type: String,
    enum: ['Pending', 'Approved', 'Rejected'],
    default: 'Pending'
  },
  leaveType: {
    type: String,
    enum: ['Medical', 'Emergency', 'Personal', 'Other'],
    default: 'Personal'
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String
  },
  numberOfDays: {
    type: Number
  }
}, {
  timestamps: true
});

// Calculate number of days - no next() needed
leaveSchema.pre('save', function() {
  if (this.fromDate && this.toDate) {
    const diffTime = Math.abs(this.toDate - this.fromDate);
    this.numberOfDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  }
});

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;