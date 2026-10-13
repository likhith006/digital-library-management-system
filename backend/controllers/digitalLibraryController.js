import DigitalResource from '../models/DigitalResource.js';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

// @desc    Get digital resources
// @route   GET /api/digital-library
// @access  Public
export const getDigitalResources = async (req, res) => {
  try {
    const { search, category, department, subject, semester } = req.query;

    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { subject: searchRegex },
        { description: searchRegex },
        { department: searchRegex },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (subject && subject !== 'All') {
      query.subject = subject;
    }

    if (semester && semester !== 'All') {
      query.semester = semester;
    }

    const resources = await DigitalResource.find(query)
      .populate('uploadedBy', 'name role')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: resources.length,
      data: resources,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new digital resource
// @route   POST /api/digital-library
// @access  Private (ADMIN, LIBRARIAN)
export const createDigitalResource = async (req, res) => {
  try {
    const { title, author, category, department, subject, semester, description, fileUrl, fileSize } = req.body;

    if (!title || !department || !fileUrl) {
      return res.status(400).json({ success: false, message: 'Title, Department, and File URL are required' });
    }

    const resource = await DigitalResource.create({
      title,
      author: author || req.user.name,
      category: category || 'PDF',
      department,
      subject: subject || 'General Core',
      semester: semester || 'Semester 1',
      description: description || 'Digital learning material for student reference.',
      fileUrl,
      fileSize: fileSize || '3.5 MB',
      uploadedBy: req.user._id,
    });

    return res.status(201).json({
      success: true,
      message: 'Digital resource added successfully',
      data: resource,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete digital resource
// @route   DELETE /api/digital-library/:id
// @access  Private (ADMIN, LIBRARIAN)
export const deleteDigitalResource = async (req, res) => {
  try {
    const resource = await DigitalResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Digital resource not found' });
    }

    await resource.deleteOne();

    return res.json({
      success: true,
      message: 'Digital resource removed successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Track download count & stream resource
// @route   GET /api/digital-library/:id/download
// @access  Public / Private
export const downloadDigitalResource = async (req, res) => {
  try {
    const resource = await DigitalResource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ success: false, message: 'Digital resource not found' });
    }

    resource.downloadsCount += 1;
    await resource.save();

    return res.json({
      success: true,
      message: 'Resource download initialized',
      downloadUrl: resource.fileUrl,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
