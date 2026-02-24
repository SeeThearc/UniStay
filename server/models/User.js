import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email']
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 4,
    select: false
  },
  role: {
    type: String,
    enum: ['admin', 'warden', 'student'],
    default: 'student'
  },
  studentId: {
    type: String,
    unique: true,
    sparse: true
  },
  phoneNumber: {
    type: String,
    trim: true
  },
  roomAssigned: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null
  },
  dateOfBirth: {
    type: Date
  },
  address: {
    type: String
  },
  guardianName: {
    type: String
  },
  guardianContact: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // Automatically adds createdAt and updatedAt
});

// Hash password before saving - async middleware doesn't need next()
userSchema.pre('save', async function() {
  if (!this.isModified('password')) {
    return; // Early return if password not modified
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;