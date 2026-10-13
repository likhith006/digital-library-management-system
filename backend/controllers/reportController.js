import Book from '../models/Book.js';
import User from '../models/User.js';
import Issue from '../models/Issue.js';
import Reservation from '../models/Reservation.js';
import Fine from '../models/Fine.js';

// @desc    Get complete dashboard stats & chart datasets
// @route   GET /api/reports/dashboard
// @access  Private (ADMIN, LIBRARIAN)
export const getDashboardStats = async (req, res) => {
  try {
    const totalBooks = await Book.countDocuments();
    const books = await Book.find();

    const totalCopiesSum = books.reduce((acc, b) => acc + (b.totalCopies || 0), 0);
    const availableCopiesSum = books.reduce((acc, b) => acc + (b.availableCopies || 0), 0);

    const totalIssued = await Issue.countDocuments({ status: 'ISSUED' });
    const totalOverdue = await Issue.countDocuments({ status: 'OVERDUE' });
    const totalReturned = await Issue.countDocuments({ status: 'RETURNED' });

    const totalStudents = await User.countDocuments({ role: 'STUDENT', isActive: true });
    const totalFaculty = await User.countDocuments({ role: 'FACULTY', isActive: true });

    const activeReservations = await Reservation.countDocuments({ status: { $in: ['PENDING', 'APPROVED'] } });

    const fines = await Fine.find();
    const totalFinesAmount = fines.reduce((sum, f) => sum + (f.amount || 0), 0);
    const unpaidFinesAmount = fines.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + (f.amount || 0), 0);
    const paidFinesAmount = fines.filter(f => f.status === 'PAID').reduce((sum, f) => sum + (f.amount || 0), 0);

    // 1. Books by Category (Pie Chart)
    const categoryMap = {};
    books.forEach(b => {
      const cat = b.category || 'Other';
      categoryMap[cat] = (categoryMap[cat] || 0) + 1;
    });

    const booksByCategory = Object.keys(categoryMap).map(category => ({
      name: category,
      value: categoryMap[category],
    }));

    // 2. Monthly Book Issues (Bar/Line Chart for last 6 months)
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const monthlyIssuesMap = {};

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
      monthlyIssuesMap[label] = { month: label, issues: 0, returns: 0 };
    }

    const allIssues = await Issue.find();
    allIssues.forEach(issue => {
      if (issue.issueDate) {
        const d = new Date(issue.issueDate);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        if (monthlyIssuesMap[label]) {
          monthlyIssuesMap[label].issues += 1;
        }
      }
      if (issue.returnDate) {
        const d = new Date(issue.returnDate);
        const label = `${monthNames[d.getMonth()]} ${d.getFullYear().toString().slice(-2)}`;
        if (monthlyIssuesMap[label]) {
          monthlyIssuesMap[label].returns += 1;
        }
      }
    });

    const monthlyIssues = Object.values(monthlyIssuesMap);

    // 3. Most Borrowed Books (Top 5)
    const bookBorrowCountMap = {};
    allIssues.forEach(issue => {
      if (issue.bookId) {
        const bId = issue.bookId.toString();
        bookBorrowCountMap[bId] = (bookBorrowCountMap[bId] || 0) + 1;
      }
    });

    const topBookIds = Object.keys(bookBorrowCountMap)
      .sort((a, b) => bookBorrowCountMap[b] - bookBorrowCountMap[a])
      .slice(0, 5);

    const mostBorrowedBooks = [];
    for (let id of topBookIds) {
      const b = await Book.findById(id);
      if (b) {
        mostBorrowedBooks.push({
          title: b.title.length > 25 ? b.title.substring(0, 22) + '...' : b.title,
          borrows: bookBorrowCountMap[id],
          category: b.category,
        });
      }
    }

    // 4. User Activity Distribution
    const studentIssuesCount = await Issue.countDocuments({ userId: { $in: await User.find({ role: 'STUDENT' }).distinct('_id') } });
    const facultyIssuesCount = await Issue.countDocuments({ userId: { $in: await User.find({ role: 'FACULTY' }).distinct('_id') } });

    const userActivity = [
      { role: 'Students', borrows: studentIssuesCount },
      { role: 'Faculty', borrows: facultyIssuesCount },
    ];

    return res.json({
      success: true,
      data: {
        summary: {
          totalBooks,
          totalCopiesSum,
          availableCopiesSum,
          totalIssued,
          totalOverdue,
          totalReturned,
          totalStudents,
          totalFaculty,
          activeReservations,
          totalFinesAmount,
          unpaidFinesAmount,
          paidFinesAmount,
        },
        charts: {
          booksByCategory,
          monthlyIssues,
          mostBorrowedBooks,
          userActivity,
        },
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get borrowing report details
// @route   GET /api/reports/borrowing
// @access  Private (ADMIN, LIBRARIAN)
export const getBorrowingReport = async (req, res) => {
  try {
    const { startDate, endDate, department, status } = req.query;

    const query = {};

    if (status && status !== 'All') {
      query.status = status;
    }

    if (startDate || endDate) {
      query.issueDate = {};
      if (startDate) query.issueDate.$gte = new Date(startDate);
      if (endDate) query.issueDate.$lte = new Date(endDate);
    }

    let issues = await Issue.find(query)
      .populate('userId', 'name email studentId employeeId department role')
      .populate('bookId', 'title author ISBN category department')
      .sort({ issueDate: -1 });

    if (department && department !== 'All') {
      issues = issues.filter(i => i.userId?.department === department || i.bookId?.department === department);
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

// @desc    Get overdue books report
// @route   GET /api/reports/overdue
// @access  Private (ADMIN, LIBRARIAN)
export const getOverdueReport = async (req, res) => {
  try {
    const now = new Date();
    const overdueIssues = await Issue.find({
      $or: [{ status: 'OVERDUE' }, { status: 'ISSUED', dueDate: { $lt: now } }],
    })
      .populate('userId', 'name email phone studentId employeeId department role')
      .populate('bookId', 'title author ISBN coverImage shelfNumber rackNumber')
      .sort({ dueDate: 1 });

    return res.json({
      success: true,
      count: overdueIssues.length,
      data: overdueIssues,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
