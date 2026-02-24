import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Please provide a room number'],
    unique: true,
    trim: true
  },
  block: {
    type: String,
    required: [true, 'Please provide a block'],
    trim: true
  },
  floor: {
    type: Number,
    required: [true, 'Please provide a floor number']
  },
  capacity: {
    type: Number,
    required: [true, 'Please provide room capacity'],
    min: 1,
    max: 10
  },
  occupants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  status: {
    type: String,
    enum: ['Available', 'Full', 'Maintenance'],
    default: 'Available'
  },
  amenities: [String],
  rentPerBed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true // This automatically adds createdAt and updatedAt
});

const Room = mongoose.model('Room', roomSchema);

export default Room;