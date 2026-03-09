import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Generate JWT Token
const generateToken = (id) => {
  const secret = process.env.JWT_SECRET || 'fallback-secret-key-change-this';
  const expiresIn = process.env.JWT_EXPIRE || '7d';
  return jwt.sign({ id }, secret, { expiresIn });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ success: false, message: 'Invalid credentials' });

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Your account has been deactivated. Please contact admin.' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        roomAssigned: user.roomAssigned,
        token,
      },
      message: 'Login successful',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate('roomAssigned');
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile (own)
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.name = req.body.name || user.name;
    user.phoneNumber = req.body.phoneNumber ?? user.phoneNumber;
    user.dateOfBirth = req.body.dateOfBirth || user.dateOfBirth;
    user.address = req.body.address ?? user.address;
    user.guardianName = req.body.guardianName ?? user.guardianName;
    user.guardianContact = req.body.guardianContact ?? user.guardianContact;

    if (req.body.password) user.password = req.body.password;

    const updated = await user.save();

    res.json({
      success: true,
      data: {
        _id: updated._id,
        name: updated.name,
        email: updated.email,
        role: updated.role,
        phoneNumber: updated.phoneNumber,
        address: updated.address,
        guardianName: updated.guardianName,
        guardianContact: updated.guardianContact,
      },
      message: 'Profile updated successfully',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all users (Admin only)
// @route   GET /api/auth/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}).select('-password').populate('roomAssigned');
    res.json({ success: true, count: users.length, data: users });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get students only
// @route   GET /api/auth/students
// @access  Private/Admin/Warden
export const getStudents = async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password').populate('roomAssigned');
    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get wardens only
// @route   GET /api/auth/wardens
// @access  Private/Admin
export const getWardens = async (req, res) => {
  try {
    const wardens = await User.find({ role: 'warden' }).select('-password');
    res.json({ success: true, count: wardens.length, data: wardens });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin creates a single user (student or warden)
// @route   POST /api/auth/admin/users
// @access  Private/Admin
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, phoneNumber, address, guardianName, guardianContact } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'name, email, password and role are required' });
    }
    if (!['student', 'warden'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Role must be student or warden' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ success: false, message: 'User already exists with this email' });

    if (role === 'student' && studentId) {
      const sidExists = await User.findOne({ studentId });
      if (sidExists) return res.status(400).json({ success: false, message: 'Student ID already exists' });
    }

    const user = await User.create({
      name, email, password, role,
      studentId: role === 'student' ? studentId : undefined,
      phoneNumber, address, guardianName, guardianContact,
    });

    res.status(201).json({
      success: true,
      data: { _id: user._id, name: user.name, email: user.email, role: user.role, studentId: user.studentId },
      message: `${role.charAt(0).toUpperCase() + role.slice(1)} created successfully`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin bulk-creates users from array (parsed from Excel on client)
// @route   POST /api/auth/admin/users/bulk
// @access  Private/Admin
export const bulkCreateUsers = async (req, res) => {
  try {
    const { users } = req.body; // array of {name, email, password, role, studentId, phoneNumber}
    if (!Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ success: false, message: 'users array is required' });
    }

    const results = { created: [], failed: [] };

    for (const u of users) {
      try {
        const { name, email, password, role, studentId, phoneNumber } = u;
        if (!name || !email || !password || !role) {
          results.failed.push({ email, reason: 'Missing required fields (name, email, password, role)' });
          continue;
        }
        if (!['student', 'warden'].includes(role)) {
          results.failed.push({ email, reason: 'Role must be student or warden' });
          continue;
        }

        const exists = await User.findOne({ email });
        if (exists) { results.failed.push({ email, reason: 'Email already exists' }); continue; }

        if (role === 'student' && studentId) {
          const sidExists = await User.findOne({ studentId });
          if (sidExists) { results.failed.push({ email, reason: 'Student ID already exists' }); continue; }
        }

        const created = await User.create({
          name, email, password, role,
          studentId: role === 'student' ? studentId : undefined,
          phoneNumber,
        });
        results.created.push({ _id: created._id, name: created.name, email: created.email, role: created.role });
      } catch (err) {
        results.failed.push({ email: u.email, reason: err.message });
      }
    }

    res.status(201).json({
      success: true,
      data: results,
      message: `${results.created.length} users created, ${results.failed.length} failed`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin toggles user active/inactive
// @route   PUT /api/auth/admin/users/:id/toggle
// @access  Private/Admin
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot deactivate admin' });

    user.isActive = !user.isActive;
    await user.save();

    res.json({ success: true, data: { isActive: user.isActive }, message: `User ${user.isActive ? 'activated' : 'deactivated'}` });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Admin deletes a user
// @route   DELETE /api/auth/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    if (user.role === 'admin') return res.status(403).json({ success: false, message: 'Cannot delete admin' });

    await user.deleteOne();
    res.json({ success: true, message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};