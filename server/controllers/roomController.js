import Room from '../models/Room.js';
import User from '../models/User.js';
import { sendSMS } from '../utils/smsService.js';

// Helper function to update room status
const updateRoomStatus = (room) => {
  if (room.occupants.length >= room.capacity) {
    room.status = 'Full';
  } else if (room.status !== 'Maintenance') {
    room.status = 'Available';
  }
};

// @desc    Get all rooms
// @route   GET /api/rooms
// @access  Private
export const getRooms = async (req, res) => {
  try {
    const rooms = await Room.find({}).populate('occupants', 'name email studentId');

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get single room
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('occupants', 'name email studentId phoneNumber');

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    res.json({
      success: true,
      data: room
    });
  } catch (error) {
    console.error('Get room by ID error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Create new room
// @route   POST /api/rooms
// @access  Private/Admin
export const createRoom = async (req, res) => {
  try {
    console.log('=== CREATE ROOM ===');
    console.log('Request body:', req.body);

    const { roomNumber, block, floor, capacity, amenities, rentPerBed } = req.body;

    // Validate required fields
    if (!roomNumber || !block || !floor || !capacity) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Check if room already exists
    const roomExists = await Room.findOne({ roomNumber });

    if (roomExists) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists'
      });
    }

    // Create room object
    const roomData = {
      roomNumber: roomNumber.trim(),
      block: block.trim(),
      floor: parseInt(floor),
      capacity: parseInt(capacity),
      occupants: [],
      status: 'Available',
      amenities: amenities || [],
      rentPerBed: rentPerBed ? parseFloat(rentPerBed) : 0
    };

    console.log('Creating room with data:', roomData);

    // Create room
    const room = new Room(roomData);
    await room.save();

    console.log('✅ Room created successfully:', room._id);

    res.status(201).json({
      success: true,
      data: room,
      message: 'Room created successfully'
    });
  } catch (error) {
    console.error('❌ Create room error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    res.status(500).json({
      success: false,
      message: error.message || 'Failed to create room',
      error: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// @desc    Update room
// @route   PUT /api/rooms/:id
// @access  Private/Admin
export const updateRoom = async (req, res) => {
  try {
    console.log('=== UPDATE ROOM ===');
    console.log('Room ID:', req.params.id);
    console.log('Update data:', req.body);

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Update fields (don't update occupants here)
    const allowedUpdates = ['roomNumber', 'block', 'floor', 'capacity', 'status', 'amenities', 'rentPerBed'];
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        room[field] = req.body[field];
      }
    });

    // Update status based on occupancy
    updateRoomStatus(room);

    await room.save();

    console.log('✅ Room updated successfully');

    res.json({
      success: true,
      data: room,
      message: 'Room updated successfully'
    });
  } catch (error) {
    console.error('❌ Update room error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Delete room
// @route   DELETE /api/rooms/:id
// @access  Private/Admin
export const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room has occupants
    if (room.occupants && room.occupants.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete room with occupants. Please reassign students first.'
      });
    }

    await Room.deleteOne({ _id: req.params.id });

    res.json({
      success: true,
      message: 'Room deleted successfully'
    });
  } catch (error) {
    console.error('Delete room error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Assign student to room
// @route   POST /api/rooms/:id/assign
// @access  Private/Admin
export const assignStudentToRoom = async (req, res) => {
  try {
    const { studentId } = req.body;

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    // Check if room is full
    if (room.occupants.length >= room.capacity) {
      return res.status(400).json({
        success: false,
        message: 'Room is already full'
      });
    }

    // Check if room is in maintenance
    if (room.status === 'Maintenance') {
      return res.status(400).json({
        success: false,
        message: 'Room is under maintenance'
      });
    }

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

    // Check if student already has a room
    if (student.roomAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Student is already assigned to a room. Please unassign first.'
      });
    }

    // Add student to room
    room.occupants.push(studentId);

    // Update room status
    updateRoomStatus(room);

    await room.save();

    // Update student's room assignment
    student.roomAssigned = room._id;
    await student.save();

    const updatedRoom = await Room.findById(room._id).populate('occupants', 'name email studentId');

    // Notify the student via SMS
    const assignMessage =
      `UniStay Hostel: You have been assigned to Room ${room.roomNumber}, ` +
      `Block ${room.block}, Floor ${room.floor}. ` +
      `Welcome to your new room! – Management`;
    sendSMS(student.phoneNumber, assignMessage);

    res.json({
      success: true,
      data: updatedRoom,
      message: 'Student assigned to room successfully'
    });
  } catch (error) {
    console.error('Assign student error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Remove student from room
// @route   POST /api/rooms/:id/unassign
// @access  Private/Admin
export const unassignStudentFromRoom = async (req, res) => {
  try {
    const { studentId } = req.body;

    const room = await Room.findById(req.params.id);

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }

    const student = await User.findById(studentId);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Remove student from room
    room.occupants = room.occupants.filter(
      occupant => occupant.toString() !== studentId
    );

    // Update room status
    updateRoomStatus(room);

    await room.save();

    // Update student's room assignment
    student.roomAssigned = null;
    await student.save();

    const updatedRoom = await Room.findById(room._id).populate('occupants', 'name email studentId');

    // Notify the student via SMS
    const unassignMessage =
      `UniStay Hostel: You have been unassigned from Room ${room.roomNumber}, Block ${room.block}. ` +
      `Please contact the warden for further details. – Management`;
    sendSMS(student.phoneNumber, unassignMessage);

    res.json({
      success: true,
      data: updatedRoom,
      message: 'Student removed from room successfully'
    });
  } catch (error) {
    console.error('Unassign student error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

// @desc    Get available rooms
// @route   GET /api/rooms/available
// @access  Private
export const getAvailableRooms = async (req, res) => {
  try {
    const rooms = await Room.find({ status: 'Available' });

    res.json({
      success: true,
      count: rooms.length,
      data: rooms
    });
  } catch (error) {
    console.error('Get available rooms error:', error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};