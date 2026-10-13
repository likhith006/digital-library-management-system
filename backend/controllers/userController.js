import User from '../models/User.js';
import Issue from '../models/Issue.js';

// @desc    Get all users with search & filters
// @route   GET /api/users
// @access  Private (ADMIN, LIBRARIAN)
export const getUsers = async (req, res) => {
  try {
    const { search, role, department, status } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { studentId: searchRegex },
        { employeeId: searchRegex },
      ];
    }

    if (role && role !== 'All') {
      query.role = role;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single user details
// @route   GET /api/users/:id
// @access  Private (ADMIN, LIBRARIAN)
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const activeIssues = await Issue.find({
      userId: user._id,
      status: { $in: ['ISSUED', 'OVERDUE'] },
    }).populate('bookId', 'title ISBN category coverImage');

    return res.json({
      success: true,
      data: {
        ...user.toObject(),
        activeIssues,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new user by Admin/Librarian
// @route   POST /api/users
// @access  Private (ADMIN, LIBRARIAN)
export const createUser = async (req, res) => {
  try {
    const { name, email, password, role, studentId, employeeId, department, year, phone } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ success: false, message: 'Name, Email, Password, and Role are required' });
    }

    const assignedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
    if (!['ADMIN', 'LIBRARIAN', 'STUDENT', 'FACULTY'].includes(assignedRole)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid account role' });
    }

    if (req.user.role !== 'ADMIN' && assignedRole !== 'STUDENT') {
      return res.status(403).json({ success: false, message: 'Only an administrator can create faculty and staff accounts' });
    }

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User with this email already exists' });
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: assignedRole,
      studentId: studentId || (assignedRole === 'STUDENT' ? `STU-${Date.now().toString().slice(-5)}` : ''),
      employeeId: employeeId || (assignedRole === 'FACULTY' || assignedRole === 'LIBRARIAN' ? `EMP-${Date.now().toString().slice(-5)}` : ''),
      department: department || 'Computer Science & Engineering',
      year: year || '1st Year',
      phone: phone || '',
    });

    return res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: user,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update user details / status
// @route   PUT /api/users/:id
// @access  Private (ADMIN, LIBRARIAN)
export const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, email, role, studentId, employeeId, department, year, phone, isActive, password } = req.body;

    const updatedRole = typeof role === 'string' ? role.trim().toUpperCase() : role;
    if (updatedRole && !['ADMIN', 'LIBRARIAN', 'STUDENT', 'FACULTY'].includes(updatedRole)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid account role' });
    }

    if (updatedRole && updatedRole !== user.role && updatedRole !== 'STUDENT' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Only an administrator can grant faculty or staff access' });
    }

    if (email && email.toLowerCase() !== user.email) {
      const emailExists = await User.findOne({ email: email.toLowerCase() });
      if (emailExists) {
        return res.status(400).json({ success: false, message: 'Email already in use by another user' });
      }
      user.email = email.toLowerCase();
    }

    user.name = name || user.name;
    user.role = updatedRole || user.role;
    user.studentId = studentId !== undefined ? studentId : user.studentId;
    user.employeeId = employeeId !== undefined ? employeeId : user.employeeId;
    user.department = department || user.department;
    user.year = year || user.year;
    user.phone = phone !== undefined ? phone : user.phone;
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    if (password && password.trim().length >= 6) {
      user.password = password;
    }

    const updatedUser = await user.save();

    return res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete/Deactivate user
// @route   DELETE /api/users/:id
// @access  Private (ADMIN)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role === 'ADMIN' && req.user._id.toString() === user._id.toString()) {
      return res.status(400).json({ success: false, message: 'You cannot delete your own admin account' });
    }

    // Soft delete / toggle active
    user.isActive = false;
    await user.save();

    return res.json({
      success: true,
      message: 'User account deactivated successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
