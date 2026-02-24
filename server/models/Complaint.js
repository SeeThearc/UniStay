import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  comment: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const complaintSchema = new mongoose.Schema({
  ticketId: {
    type: String,
    unique: true,
    required: true
  },
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please provide a title'],
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: [true, 'Please provide a description'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Please select a category'],
    enum: ['Maintenance', 'Electrical', 'Plumbing', 'Cleaning', 'Security', 'Other']
  },
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved'],
    default: 'Pending'
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High'],
    default: 'Medium'
  },
  comments: [commentSchema],
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  resolvedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Auto-generate ticket ID - no next() needed with async
complaintSchema.pre('save', async function() {
  if (!this.ticketId) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.ticketId = `TKT${String(count + 1).padStart(6, '0')}`;
  }
});

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;