import Issue from '../models/Issue.js';
import Book from '../models/Book.js';
import User from '../models/User.js';
import Setting from '../models/Setting.js';
import Notification from '../models/Notification.js';
import Fine from '../models/Fine.js';
import Reservation from '../models/Reservation.js';
import { calculateFine } from '../utils/fineCalculator.js';

// @desc    Issue a book to a student/faculty
// @route   POST /api/issues
// @access  Private (ADMIN, LIBRARIAN)
export const issueBook = async (req, res) => {
  try {
    const { userId, bookId, customDueDate } = req.body;

    if (!userId || !bookId) {
      return res.status(400).json({ success: false, message: 'User ID and Book ID are required' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Target user not found' });
    }

    if (!user.isActive) {
      return res.status(400).json({ success: false, message: 'Cannot issue book to an inactive user account' });
    }

    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    if (book.availableCopies <= 0) {
      return res.status(400).json({
        success: false,
        message: `Book "${book.title}" is currently out of stock (0 available copies)`,
      });
    }

    // Check existing active issues for this user and book
    const existingActiveIssue = await Issue.findOne({
      userId: user._id,
      bookId: book._id,
      status: { $in: ['ISSUED', 'OVERDUE'] },
    });

    if (existingActiveIssue) {
      return res.status(400).json({
        success: false,
        message: `User already has an active issue copy of "${book.title}"`,
      });
    }

    // Fetch settings for issue duration and limits
    const settings = await Setting.findOne() || {
      studentMaxBooks: 3,
      studentIssueDays: 14,
      facultyMaxBooks: 6,
      facultyIssueDays: 30,
    };

    const maxAllowed = user.role === 'FACULTY' ? settings.facultyMaxBooks : settings.studentMaxBooks;
    const issueDays = user.role === 'FACULTY' ? settings.facultyIssueDays : settings.studentIssueDays;

    // Check how many active books user currently holds
    const currentActiveCount = await Issue.countDocuments({
      userId: user._id,
      status: { $in: ['ISSUED', 'OVERDUE'] },
    });

    if (currentActiveCount >= maxAllowed) {
      return res.status(400).json({
        success: false,
        message: `Borrowing limit reached. ${user.role}s are allowed a maximum of ${maxAllowed} active book(s). Currently active: ${currentActiveCount}`,
      });
    }

    // Calculate due date
    let dueDate;
    if (customDueDate) {
      dueDate = new Date(customDueDate);
    } else {
      dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + issueDays);
    }

    // Create Issue
    const issue = await Issue.create({
      userId: user._id,
      bookId: book._id,
      issueDate: new Date(),
      dueDate,
      status: 'ISSUED',
      issuedBy: req.user._id,
    });

    // Decrease available copies
    book.availableCopies = Math.max(0, book.availableCopies - 1);
    await book.save();

    // If user had a pending reservation for this book, mark it completed
    await Reservation.updateMany(
      { userId: user._id, bookId: book._id, status: { $in: ['PENDING', 'APPROVED'] } },
      { status: 'COMPLETED' }
    );

    // Create Notification
    const formattedDueDate = dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    await Notification.create({
      userId: user._id,
      title: 'Book Issued Successfully',
      message: `"${book.title}" has been issued to you. Due date: ${formattedDueDate}.`,
      type: 'ISSUE',
    });

    const populatedIssue = await Issue.findById(issue._id)
      .populate('userId', 'name email studentId employeeId role department')
      .populate('bookId', 'title author ISBN coverImage category shelfNumber rackNumber');

    return res.status(201).json({
      success: true,
      message: 'Book issued successfully',
      data: populatedIssue,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all issue records (Admin / Librarian)
// @route   GET /api/issues
// @access  Private (ADMIN, LIBRARIAN)
export const getIssues = async (req, res) => {
  try {
    const { status, search } = req.query;

    const query = {};
    if (status && status !== 'All') {
      query.status = status;
    }

    let issues = await Issue.find(query)
      .populate('userId', 'name email studentId employeeId role department phone')
      .populate('bookId', 'title author ISBN coverImage category totalCopies availableCopies shelfNumber rackNumber')
      .populate('issuedBy', 'name role')
      .sort({ createdAt: -1 });

    // Check for overdue status updates on the fly
    const now = new Date();
    for (let issue of issues) {
      if (issue.status === 'ISSUED' && new Date(issue.dueDate) < now) {
        issue.status = 'OVERDUE';
        const fineData = await calculateFine(issue.dueDate, now);
        issue.fineAmount = fineData.fineAmount;
        await issue.save();
      }
    }

    if (search) {
      const s = search.toLowerCase();
      issues = issues.filter(issue => {
        const uName = issue.userId?.name?.toLowerCase() || '';
        const uEmail = issue.userId?.email?.toLowerCase() || '';
        const bTitle = issue.bookId?.title?.toLowerCase() || '';
        const bIsbn = issue.bookId?.ISBN?.toLowerCase() || '';
        return uName.includes(s) || uEmail.includes(s) || bTitle.includes(s) || bIsbn.includes(s);
      });
    }

    return res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user's issues
// @route   GET /api/issues/my
// @access  Private
export const getMyIssues = async (req, res) => {
  try {
    const issues = await Issue.find({ userId: req.user._id })
      .populate('bookId', 'title author ISBN coverImage category shelfNumber rackNumber format digitalFile')
      .sort({ createdAt: -1 });

    // Check overdue on the fly
    const now = new Date();
    for (let issue of issues) {
      if (issue.status === 'ISSUED' && new Date(issue.dueDate) < now) {
        issue.status = 'OVERDUE';
        const fineData = await calculateFine(issue.dueDate, now);
        issue.fineAmount = fineData.fineAmount;
        await issue.save();
      }
    }

    return res.json({
      success: true,
      count: issues.length,
      data: issues,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Return an issued book
// @route   PUT /api/issues/:id/return
// @access  Private (ADMIN, LIBRARIAN)
export const returnBook = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('bookId')
      .populate('userId');

    if (!issue) {
      return res.status(404).json({ success: false, message: 'Issue record not found' });
    }

    if (issue.status === 'RETURNED') {
      return res.status(400).json({ success: false, message: 'This book has already been returned' });
    }

    const returnDate = new Date();
    const fineResult = await calculateFine(issue.dueDate, returnDate);

    issue.returnDate = returnDate;
    issue.status = 'RETURNED';
    issue.fineAmount = fineResult.fineAmount;
    await issue.save();

    // Increment book available copies
    const book = await Book.findById(issue.bookId._id);
    if (book) {
      book.availableCopies = Math.min(book.totalCopies, book.availableCopies + 1);
      await book.save();
    }

    // Create Fine record if overdue
    if (fineResult.fineAmount > 0) {
      await Fine.create({
        userId: issue.userId._id,
        issueId: issue._id,
        amount: fineResult.fineAmount,
        reason: `Late return fine for "${book?.title}" (${fineResult.overdueDays} day(s) overdue)`,
        status: 'UNPAID',
      });

      await Notification.create({
        userId: issue.userId._id,
        title: 'Overdue Fine Generated',
        message: `A fine of ₹${fineResult.fineAmount} has been generated for late return of "${book?.title}".`,
        type: 'FINE',
      });
    }

    // Notify user of return
    await Notification.create({
      userId: issue.userId._id,
      title: 'Book Returned',
      message: `"${book?.title}" has been returned to the library successfully.`,
      type: 'RETURN',
    });

    // Check reservation queue for this book
    const nextReservation = await Reservation.findOne({
      bookId: book._id,
      status: 'PENDING',
    }).sort({ createdAt: 1 }).populate('userId');

    if (nextReservation) {
      nextReservation.status = 'APPROVED';
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + 3);
      nextReservation.expiryDate = expiry;
      await nextReservation.save();

      await Notification.create({
        userId: nextReservation.userId._id,
        title: 'Reserved Book Now Available!',
        message: `Good news! "${book.title}" is now available for collection. Please visit the library by ${expiry.toLocaleDateString()}.`,
        type: 'RESERVATION',
      });
    }

    return res.json({
      success: true,
      message: fineResult.fineAmount > 0
        ? `Book returned with fine of ₹${fineResult.fineAmount} (${fineResult.overdueDays} days overdue)`
        : 'Book returned successfully with zero fine',
      data: {
        issue,
        fineAmount: fineResult.fineAmount,
        overdueDays: fineResult.overdueDays,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
