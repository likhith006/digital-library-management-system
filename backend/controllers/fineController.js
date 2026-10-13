import Fine from '../models/Fine.js';
import Notification from '../models/Notification.js';

// @desc    Get all fines (Admin/Librarian)
// @route   GET /api/fines
// @access  Private (ADMIN, LIBRARIAN)
export const getFines = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const fines = await Fine.find(query)
      .populate('userId', 'name email studentId employeeId role department phone')
      .populate({
        path: 'issueId',
        populate: { path: 'bookId', select: 'title ISBN coverImage' },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's fines
// @route   GET /api/fines/my
// @access  Private
export const getMyFines = async (req, res) => {
  try {
    const fines = await Fine.find({ userId: req.user._id })
      .populate({
        path: 'issueId',
        populate: { path: 'bookId', select: 'title ISBN coverImage' },
      })
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: fines.length,
      data: fines,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Pay or waive a fine
// @route   PUT /api/fines/:id/pay
// @access  Private
export const payFine = async (req, res) => {
  try {
    const { action } = req.body; // 'PAID' or 'WAIVED'
    const fine = await Fine.findById(req.params.id);

    if (!fine) {
      return res.status(404).json({ success: false, message: 'Fine record not found' });
    }

    if (fine.status !== 'UNPAID') {
      return res.status(400).json({ success: false, message: `Fine is already marked as ${fine.status}` });
    }

    const targetStatus = action === 'WAIVED' && (req.user.role === 'ADMIN' || req.user.role === 'LIBRARIAN') ? 'WAIVED' : 'PAID';

    fine.status = targetStatus;
    fine.paidDate = new Date();
    await fine.save();

    await Notification.create({
      userId: fine.userId,
      title: targetStatus === 'PAID' ? 'Fine Payment Confirmed' : 'Fine Waived',
      message: targetStatus === 'PAID' 
        ? `Payment of ₹${fine.amount} has been successfully recorded.` 
        : `Your fine of ₹${fine.amount} has been waived by library management.`,
      type: 'FINE',
    });

    return res.json({
      success: true,
      message: `Fine status updated to ${targetStatus}`,
      data: fine,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
