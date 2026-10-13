import User from '../models/User.js';
import generateToken from '../utils/generateToken.js';
import bcrypt from 'bcryptjs';

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, employeeId, department, year, phone } = req.body;

    const cleanedName = typeof name === 'string' ? name.trim() : '';
    const cleanedEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
    const passwordValue = typeof password === 'string' ? password : '';
    const cleanedRole = typeof role === 'string' ? role.trim().toUpperCase() : 'STUDENT';
    const cleanedDepartment = typeof department === 'string' && department.trim() ? department.trim() : 'Computer Science & Engineering';
    const cleanedYear = typeof year === 'string' && year.trim() ? year.trim() : '1st Year';
    const cleanedPhone = typeof phone === 'string' ? phone.trim() : '';

    if (!cleanedName || !cleanedEmail || !passwordValue) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (cleanedRole !== 'STUDENT') {
      return res.status(403).json({
        success: false,
        message: 'Public registration is only available to students. Faculty and staff accounts must be created by an administrator.',
      });
    }

    if (passwordValue.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const userExists = await User.findOne({ email: cleanedEmail });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const assignedRole = 'STUDENT';

    const user = await User.create({
      name: cleanedName,
      email: cleanedEmail,
      password: passwordValue,
      role: assignedRole,
      studentId: (studentId || '').toString().trim() || (assignedRole === 'STUDENT' ? `STU-${Date.now().toString().slice(-5)}` : ''),
      employeeId: (employeeId || '').toString().trim() || (assignedRole === 'FACULTY' ? `FAC-${Date.now().toString().slice(-5)}` : ''),
      department: cleanedDepartment,
      year: cleanedYear,
      phone: cleanedPhone,
    });

    const token = generateToken(user._id, user.role);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        year: user.year,
        profileImage: user.profileImage,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Your account has been deactivated. Please contact admin/librarian.' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    const token = generateToken(user._id, user.role);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        studentId: user.studentId,
        employeeId: user.employeeId,
        department: user.department,
        year: user.year,
        phone: user.phone,
        profileImage: user.profileImage,
        token,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    return res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    user.name = req.body.name || user.name;
    user.phone = req.body.phone !== undefined ? req.body.phone : user.phone;
    user.department = req.body.department || user.department;
    user.year = req.body.year || user.year;
    user.profileImage = req.body.profileImage || user.profileImage;

    const updatedUser = await user.save();

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
