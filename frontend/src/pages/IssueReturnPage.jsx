import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { issueService } from '../services/issueService';
import { userService } from '../services/userService';
import { bookService } from '../services/bookService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  FiBookOpen,
  FiUserCheck,
  FiSearch,
  FiPlus,
  FiRotateCcw,
  FiCheckCircle,
  FiAlertCircle,
  FiCalendar,
  FiDollarSign,
} from 'react-icons/fi';

const IssueReturnPage = () => {
  const [searchParams] = useSearchParams();
  const preselectedBookId = searchParams.get('bookId') || '';

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Issue Modal State
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(!!preselectedBookId);
  const [usersList, setUsersList] = useState([]);
  const [booksList, setBooksList] = useState([]);

  const [selectedUser, setSelectedUser] = useState('');
  const [selectedBook, setSelectedBook] = useState(preselectedBookId);
  const [customDueDate, setCustomDueDate] = useState('');
  const [issueSubmitting, setIssueSubmitting] = useState(false);
  const [issueError, setIssueError] = useState('');

  // Return Modal State
  const [selectedIssueToReturn, setSelectedIssueToReturn] = useState(null);
  const [returning, setReturning] = useState(false);

  const fetchIssues = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus !== 'All') params.status = filterStatus;
      if (searchQuery) params.search = searchQuery;

      const res = await issueService.getIssues(params);
      if (res.success) {
        setIssues(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDropdownData = async () => {
    try {
      const [uRes, bRes] = await Promise.all([
        userService.getUsers({ status: 'active' }),
        bookService.getBooks({ availability: 'available' }),
      ]);
      if (uRes.success) setUsersList(uRes.data || []);
      if (bRes.success) setBooksList(bRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchIssues();
  }, [filterStatus, searchQuery]);

  useEffect(() => {
    if (isIssueModalOpen) {
      fetchDropdownData();
    }
  }, [isIssueModalOpen]);

  const handleIssueSubmit = async (e) => {
    e.preventDefault();
    setIssueSubmitting(true);
    setIssueError('');

    try {
      const res = await issueService.issueBook({
        userId: selectedUser,
        bookId: selectedBook,
        customDueDate: customDueDate || undefined,
      });

      if (res.success) {
        setIsIssueModalOpen(false);
        setSelectedUser('');
        setSelectedBook('');
        fetchIssues();
      }
    } catch (err) {
      setIssueError(err.message || 'Failed to issue book.');
    } finally {
      setIssueSubmitting(false);
    }
  };

  const handleConfirmReturn = async () => {
    if (!selectedIssueToReturn) return;
    setReturning(true);
    try {
      const res = await issueService.returnBook(selectedIssueToReturn._id);
      if (res.success) {
        alert(res.message);
        setSelectedIssueToReturn(null);
        fetchIssues();
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setReturning(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FiBookOpen className="w-6 h-6 text-indigo-400" /> Book Issue & Return Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authorize book borrowing, record library returns, and automate fine calculations.
          </p>
        </div>

        <button
          onClick={() => {
            setIssueError('');
            setIsIssueModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <FiPlus className="w-4 h-4" /> Issue Book to Student / Faculty
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search issue records by Student Name, Email, Book Title, or ISBN..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">All Loan Statuses</option>
          <option value="ISSUED">Currently Issued</option>
          <option value="OVERDUE">Overdue Books</option>
          <option value="RETURNED">Returned Books</option>
        </select>
      </div>

      {/* Issues Table */}
      {loading ? (
        <LoadingSpinner text="Fetching loan records..." />
      ) : issues.length === 0 ? (
        <EmptyState icon={FiBookOpen} title="No issue records found" message="Try searching for another user or changing status filter." />
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Student / Faculty Details</th>
                  <th className="p-4">Book Details</th>
                  <th className="p-4">Issue & Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Return Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {issues.map((issue) => (
                  <tr key={issue._id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-100">{issue.userId?.name}</div>
                      <div className="text-[11px] text-slate-400">{issue.userId?.email}</div>
                      <div className="text-[10px] text-indigo-400 font-mono mt-0.5">
                        {issue.userId?.studentId || issue.userId?.employeeId} ({issue.userId?.role})
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-200">{issue.bookId?.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">ISBN: {issue.bookId?.ISBN}</div>
                      <div className="text-[10px] text-slate-400">Shelf {issue.bookId?.shelfNumber} (Rack {issue.bookId?.rackNumber})</div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-300">Issued: {new Date(issue.issueDate).toLocaleDateString()}</div>
                      <div className="text-indigo-300 font-semibold mt-0.5">Due: {new Date(issue.dueDate).toLocaleDateString()}</div>
                    </td>

                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        issue.status === 'OVERDUE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : issue.status === 'RETURNED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      }`}>
                        {issue.status}
                      </span>
                      {issue.fineAmount > 0 && (
                        <span className="block text-[11px] font-mono font-bold text-amber-400 mt-1">
                          Fine: ₹{issue.fineAmount}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-right">
                      {issue.status !== 'RETURNED' && (
                        <button
                          onClick={() => setSelectedIssueToReturn(issue)}
                          className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 inline-flex items-center gap-1.5"
                        >
                          <FiRotateCcw className="w-3.5 h-3.5" /> Return Book
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issue Book Modal */}
      <Modal isOpen={isIssueModalOpen} onClose={() => setIsIssueModalOpen(false)} title="Issue Academic Book">
        {issueError && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {issueError}
          </div>
        )}

        <form onSubmit={handleIssueSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Student / Faculty Member *</label>
            <select
              required
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose User --</option>
              {usersList.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} ({u.role}) - {u.studentId || u.employeeId || u.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Select Book Title *</label>
            <select
              required
              value={selectedBook}
              onChange={(e) => setSelectedBook(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
            >
              <option value="">-- Choose Book --</option>
              {booksList.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.title} (ISBN: {b.ISBN}) - Available Copies: {b.availableCopies}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Custom Due Date (Optional)</label>
            <input
              type="date"
              value={customDueDate}
              onChange={(e) => setCustomDueDate(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[10px] text-slate-400 mt-1">If left blank, automatically set to 14 days for Students and 30 days for Faculty.</p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsIssueModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={issueSubmitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              {issueSubmitting ? 'Issuing...' : 'Confirm Book Issue'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Return Confirmation Modal */}
      {selectedIssueToReturn && (
        <Modal
          isOpen={true}
          onClose={() => setSelectedIssueToReturn(null)}
          title="Confirm Book Return"
          maxWidth="max-w-md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <p><span className="text-slate-400">Book:</span> <strong className="text-slate-100">{selectedIssueToReturn.bookId?.title}</strong></p>
              <p><span className="text-slate-400">Borrower:</span> <strong className="text-slate-100">{selectedIssueToReturn.userId?.name}</strong></p>
              <p><span className="text-slate-400">Due Date:</span> <strong className="text-indigo-300">{new Date(selectedIssueToReturn.dueDate).toLocaleDateString()}</strong></p>
            </div>

            <p className="text-slate-300">
              Returning this book will automatically increase available copies in inventory. If overdue, fine calculation will be applied automatically at configured library rates.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedIssueToReturn(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReturn}
                disabled={returning}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30"
              >
                {returning ? 'Processing Return...' : 'Accept Return'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default IssueReturnPage;
