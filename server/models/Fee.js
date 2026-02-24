import mongoose from 'mongoose';

const feeSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalFee: {
    type: Number,
    required: [true, 'Please provide total fee amount'],
    min: 0
  },
  amountPaid: {
    type: Number,
    default: 0,
    min: 0
  },
  remainingDues: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['Paid', 'Partially Paid', 'Unpaid'],
    default: 'Unpaid'
  },
  semester: {
    type: String,
    default: 'Current'
  },
  dueDate: {
    type: Date
  },
  paymentHistory: [{
    amount: Number,
    paymentDate: {
      type: Date,
      default: Date.now
    },
    paymentMethod: String,
    transactionId: String,
    remarks: String
  }],
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Calculate remaining dues and status - no next() needed
feeSchema.pre('save', function() {
  this.remainingDues = this.totalFee - this.amountPaid;
  
  if (this.amountPaid >= this.totalFee) {
    this.status = 'Paid';
  } else if (this.amountPaid > 0) {
    this.status = 'Partially Paid';
  } else {
    this.status = 'Unpaid';
  }
  
  this.lastUpdated = Date.now();
});

const Fee = mongoose.model('Fee', feeSchema);

export default Fee;