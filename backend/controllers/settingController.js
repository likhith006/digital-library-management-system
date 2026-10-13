import Setting from '../models/Setting.js';

// @desc    Get library settings
// @route   GET /api/settings
// @access  Public / Private
export const getSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = await Setting.create({});
    }

    return res.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update library settings
// @route   PUT /api/settings
// @access  Private (ADMIN, LIBRARIAN)
export const updateSettings = async (req, res) => {
  try {
    let settings = await Setting.findOne();
    if (!settings) {
      settings = new Setting({});
    }

    const {
      finePerDay,
      studentMaxBooks,
      studentIssueDays,
      facultyMaxBooks,
      facultyIssueDays,
      collegeName,
    } = req.body;

    if (finePerDay !== undefined) settings.finePerDay = Number(finePerDay);
    if (studentMaxBooks !== undefined) settings.studentMaxBooks = Number(studentMaxBooks);
    if (studentIssueDays !== undefined) settings.studentIssueDays = Number(studentIssueDays);
    if (facultyMaxBooks !== undefined) settings.facultyMaxBooks = Number(facultyMaxBooks);
    if (facultyIssueDays !== undefined) settings.facultyIssueDays = Number(facultyIssueDays);
    if (collegeName) settings.collegeName = collegeName;

    const updatedSettings = await settings.save();

    return res.json({
      success: true,
      message: 'Library settings updated successfully',
      data: updatedSettings,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
