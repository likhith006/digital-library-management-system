import Reservation from '../models/Reservation.js';
import Book from '../models/Book.js';
import Notification from '../models/Notification.js';

// @desc    Reserve an unavailable book
// @route   POST /api/reservations
// @access  Private (STUDENT, FACULTY)
export const createReservation = async (req, res) => {
  try {
    const { bookId } = req.body;

    if (!bookId) {
      return res.status(400).json({ success: false, message: 'Book ID is required' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check duplicate active reservation
    const existingRes = await Reservation.findOne({
      userId: req.user._id,
      bookId: book._id,
      status: { $in: ['PENDING', 'APPROVED'] },
    });

    if (existingRes) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active reservation for this book',
      });
    }

    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + 7); // 7 day initial reservation window

    const reservation = await Reservation.create({
      userId: req.user._id,
      bookId: book._id,
      reservationDate: new Date(),
      status: 'PENDING',
      expiryDate,
    });

    await Notification.create({
      userId: req.user._id,
      title: 'Reservation Request Submitted',
      message: `Your reservation request for "${book.title}" has been recorded. You will be notified when it becomes available.`,
      type: 'RESERVATION',
    });

    const populatedRes = await Reservation.findById(reservation._id)
      .populate('bookId', 'title author ISBN coverImage category availableCopies');

    return res.status(201).json({
      success: true,
      message: 'Book reserved successfully',
      data: populatedRes,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (ADMIN, LIBRARIAN)
export const getReservations = async (req, res) => {
  try {
    const { status } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    const reservations = await Reservation.find(query)
      .populate('userId', 'name email studentId employeeId role department phone')
      .populate('bookId', 'title author ISBN category coverImage totalCopies availableCopies shelfNumber')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user's reservations
// @route   GET /api/reservations/my
// @access  Private
export const getMyReservations = async (req, res) => {
  try {
    const reservations = await Reservation.find({ userId: req.user._id })
      .populate('bookId', 'title author ISBN category coverImage availableCopies totalCopies shelfNumber rackNumber')
      .sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: reservations.length,
      data: reservations,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update reservation status
// @route   PUT /api/reservations/:id
// @access  Private (ADMIN, LIBRARIAN)
export const updateReservationStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await Reservation.findById(req.params.id)
      .populate('bookId')
      .populate('userId');

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation record not found' });
    }

    if (!['PENDING', 'APPROVED', 'CANCELLED', 'COMPLETED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid reservation status' });
    }

    reservation.status = status;
    await reservation.save();

    await Notification.create({
      userId: reservation.userId._id,
      title: `Reservation ${status}`,
      message: `Your reservation for "${reservation.bookId.title}" has been marked as ${status.toLowerCase()}.`,
      type: 'RESERVATION',
    });

    return res.json({
      success: true,
      message: `Reservation status updated to ${status}`,
      data: reservation,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Cancel reservation (User / Admin)
// @route   DELETE /api/reservations/:id
// @access  Private
export const cancelReservation = async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    // Check ownership if not admin/librarian
    if (
      req.user.role !== 'ADMIN' &&
      req.user.role !== 'LIBRARIAN' &&
      reservation.userId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this reservation' });
    }

    reservation.status = 'CANCELLED';
    await reservation.save();

    return res.json({
      success: true,
      message: 'Reservation cancelled successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
