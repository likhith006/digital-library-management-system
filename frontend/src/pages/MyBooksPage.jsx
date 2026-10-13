import React, { useState, useEffect } from 'react';
import { issueService } from '../services/issueService';
import { reservationService } from '../services/reservationService';
import { fineService } from '../services/fineService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  FiBookOpen,
  FiClock,
  FiBookmark,
  FiDollarSign,
  FiCheckCircle,
  FiAlertCircle,
  FiXCircle,
} from 'react-icons/fi';

const MyBooksPage = () => {
  const [activeTab, setActiveTab] = useState('issued'); // 'issued' | 'returned' | 'reserved' | 'fines'
  const [loading, setLoading] = useState(true);

  const [issues, setIssues] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [fines, setFines] = useState([]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [issuesRes, reservationsRes, finesRes] = await Promise.all([
        issueService.getMyIssues(),
        reservationService.getMyReservations(),
        fineService.getMyFines(),
      ]);

      if (issuesRes.success) setIssues(issuesRes.data || []);
      if (reservationsRes.success) setReservations(reservationsRes.data || []);
      if (finesRes.success) setFines(finesRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelReservation = async (id) => {
    if (window.confirm('Are you sure you want to cancel this reservation?')) {
      try {
        await reservationService.cancelReservation(id);
        fetchData();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handlePayFine = async (id) => {
    try {
      await fineService.payFine(id, 'PAID');
      alert('Fine payment processed successfully!');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const currentlyIssued = issues.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE');
  const returnedBooks = issues.filter(i => i.status === 'RETURNED');

  const getDaysRemaining = (dueDate) => {
    const due = new Date(dueDate);
    const now = new Date();
    due.setHours(0,0,0,0);
    now.setHours(0,0,0,0);
    const diff = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return `${Math.abs(diff)} days overdue`;
    if (diff === 0) return 'Due today!';
    return `${diff} days remaining`;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FiBookmark className="w-6 h-6 text-indigo-400" /> My Academic Loans & Activity
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Track your currently issued textbooks, borrowing history, active reservations, and fine receipts.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveTab('issued')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'issued' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FiBookOpen className="w-4 h-4" /> Currently Issued ({currentlyIssued.length})
        </button>

        <button
          onClick={() => setActiveTab('returned')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'returned' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FiCheckCircle className="w-4 h-4" /> Returned History ({returnedBooks.length})
        </button>

        <button
          onClick={() => setActiveTab('reserved')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'reserved' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FiClock className="w-4 h-4" /> Reserved Books ({reservations.length})
        </button>

        <button
          onClick={() => setActiveTab('fines')}
          className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'fines' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FiDollarSign className="w-4 h-4" /> Fines & Fees ({fines.filter(f => f.status === 'UNPAID').length})
        </button>
      </div>

      {/* Tab Content */}
      {loading ? (
        <LoadingSpinner text="Fetching your borrowing records..." />
      ) : activeTab === 'issued' ? (
        currentlyIssued.length === 0 ? (
          <EmptyState icon={FiBookOpen} title="No books currently issued" message="You don't have any active book borrowings." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentlyIssued.map(issue => (
              <div key={issue._id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-start gap-4">
                <img
                  src={issue.bookId?.coverImage}
                  alt={issue.bookId?.title}
                  className="w-16 h-22 object-cover rounded-xl flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mb-1 ${
                    issue.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {issue.status}
                  </span>
                  <h4 className="font-bold text-slate-100 text-sm truncate">{issue.bookId?.title}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">by {issue.bookId?.author}</p>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 text-[11px] space-y-1 text-slate-300">
                    <p><span className="text-slate-400">Issue Date:</span> {new Date(issue.issueDate).toLocaleDateString()}</p>
                    <p><span className="text-slate-400">Due Date:</span> {new Date(issue.dueDate).toLocaleDateString()}</p>
                    <p className={`font-bold ${issue.status === 'OVERDUE' ? 'text-rose-400' : 'text-indigo-400'}`}>
                      {getDaysRemaining(issue.dueDate)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : activeTab === 'returned' ? (
        returnedBooks.length === 0 ? (
          <EmptyState icon={FiCheckCircle} title="No returned books history" message="Returned books will appear here." />
        ) : (
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="p-4">Book Title</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Return Date</th>
                  <th className="p-4">Fine Incurred</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {returnedBooks.map(issue => (
                  <tr key={issue._id} className="hover:bg-slate-800/30">
                    <td className="p-4 font-bold text-slate-200">{issue.bookId?.title}</td>
                    <td className="p-4 text-slate-400">{new Date(issue.issueDate).toLocaleDateString()}</td>
                    <td className="p-4 text-emerald-400 font-medium">{new Date(issue.returnDate).toLocaleDateString()}</td>
                    <td className="p-4 text-slate-300 font-mono">₹{issue.fineAmount || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : activeTab === 'reserved' ? (
        reservations.length === 0 ? (
          <EmptyState icon={FiClock} title="No active reservations" message="When a book is out of stock, you can reserve it." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {reservations.map(res => (
              <div key={res._id} className="glass-card p-5 rounded-2xl border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase mb-2 ${
                    res.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : res.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {res.status}
                  </span>
                  <h4 className="font-bold text-slate-100 text-sm">{res.bookId?.title}</h4>
                  <p className="text-xs text-slate-400 mt-1">Reserved on: {new Date(res.reservationDate).toLocaleDateString()}</p>
                </div>

                {res.status === 'PENDING' && (
                  <button
                    onClick={() => handleCancelReservation(res._id)}
                    className="text-xs font-semibold text-rose-400 hover:text-rose-300 p-2 rounded-xl hover:bg-rose-500/10"
                  >
                    Cancel Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )
      ) : (
        /* Fines Tab */
        fines.length === 0 ? (
          <EmptyState icon={FiDollarSign} title="No fines incurred" message="Great job! You have no outstanding fines." />
        ) : (
          <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase">
                  <th className="p-4">Reason & Book</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fines.map(fine => (
                  <tr key={fine._id} className="hover:bg-slate-800/30">
                    <td className="p-4">
                      <p className="font-bold text-slate-200">{fine.reason}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{new Date(fine.createdAt).toLocaleDateString()}</p>
                    </td>
                    <td className="p-4 font-mono font-extrabold text-amber-400 text-sm">₹{fine.amount}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        fine.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : fine.status === 'WAIVED' ? 'bg-purple-500/20 text-purple-400' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {fine.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {fine.status === 'UNPAID' && (
                        <button
                          onClick={() => handlePayFine(fine._id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                        >
                          Pay Fine Now
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};

export default MyBooksPage;
