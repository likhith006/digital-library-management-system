import React, { useState, useEffect } from 'react';
import { reportService } from '../services/reportService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  FiBarChart2,
  FiDownload,
  FiCalendar,
  FiBookOpen,
  FiAlertCircle,
  FiDollarSign,
  FiFilter,
} from 'react-icons/fi';

const ReportsPage = () => {
  const [reportType, setReportType] = useState('borrowing'); // 'borrowing' | 'overdue'
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);

  // Date Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchReport = async () => {
    try {
      setLoading(true);
      if (reportType === 'borrowing') {
        const params = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (statusFilter !== 'All') params.status = statusFilter;

        const res = await reportService.getBorrowingReport(params);
        if (res.success) setData(res.data || []);
      } else {
        const res = await reportService.getOverdueReport();
        if (res.success) setData(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, startDate, endDate, statusFilter]);

  // Export CSV Functionality
  const exportToCSV = () => {
    if (data.length === 0) return alert('No report data to export.');

    let csvContent = 'data:text/csv;charset=utf-8,';

    if (reportType === 'borrowing') {
      csvContent += 'Issue ID,Student Name,Email,Role,Book Title,ISBN,Issue Date,Due Date,Return Date,Status,Fine Amount\n';
      data.forEach(item => {
        const row = [
          item._id,
          `"${item.userId?.name || ''}"`,
          `"${item.userId?.email || ''}"`,
          item.userId?.role || '',
          `"${item.bookId?.title || ''}"`,
          item.bookId?.ISBN || '',
          new Date(item.issueDate).toLocaleDateString(),
          new Date(item.dueDate).toLocaleDateString(),
          item.returnDate ? new Date(item.returnDate).toLocaleDateString() : 'N/A',
          item.status,
          item.fineAmount || 0,
        ].join(',');
        csvContent += row + '\n';
      });
    } else {
      csvContent += 'Issue ID,Student Name,Phone,Book Title,ISBN,Shelf,Due Date,Days Overdue,Fine Incurred\n';
      data.forEach(item => {
        const due = new Date(item.dueDate);
        const now = new Date();
        const diffDays = Math.ceil((now - due) / (1000 * 60 * 60 * 24));
        const row = [
          item._id,
          `"${item.userId?.name || ''}"`,
          item.userId?.phone || '',
          `"${item.bookId?.title || ''}"`,
          item.bookId?.ISBN || '',
          item.bookId?.shelfNumber || '',
          due.toLocaleDateString(),
          diffDays,
          item.fineAmount || (diffDays * 2),
        ].join(',');
        csvContent += row + '\n';
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `library_${reportType}_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FiBarChart2 className="w-6 h-6 text-emerald-400" /> Library Analytics & Formal Reports
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Generate, filter, and export administrative borrowing logs and overdue compliance reports.
          </p>
        </div>

        <button
          onClick={exportToCSV}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/30 flex items-center gap-2"
        >
          <FiDownload className="w-4 h-4" /> Export Report (CSV)
        </button>
      </div>

      {/* Filter & Controls Panel */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 font-bold focus:outline-none focus:border-indigo-500"
        >
          <option value="borrowing">Borrowing History Log</option>
          <option value="overdue">Overdue Books & Fines Report</option>
        </select>

        {reportType === 'borrowing' && (
          <>
            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <span className="text-[10px] text-slate-400 font-bold uppercase">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300">
              <span className="text-[10px] text-slate-400 font-bold uppercase">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-white focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">Status: All</option>
              <option value="ISSUED">Issued</option>
              <option value="OVERDUE">Overdue</option>
              <option value="RETURNED">Returned</option>
            </select>
          </>
        )}
      </div>

      {/* Report Table */}
      {loading ? (
        <LoadingSpinner text="Generating analytical report..." />
      ) : data.length === 0 ? (
        <EmptyState icon={FiBarChart2} title="No report records found" message="Try adjusting your date range or report type." />
      ) : reportType === 'borrowing' ? (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Borrower Name & Role</th>
                  <th className="p-4">Book Title & ISBN</th>
                  <th className="p-4">Issue Date</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{item.userId?.name}</div>
                      <div className="text-[10px] text-slate-400">{item.userId?.email} ({item.userId?.role})</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-300">{item.bookId?.title}</div>
                      <div className="text-[10px] font-mono text-slate-400">{item.bookId?.ISBN}</div>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(item.issueDate).toLocaleDateString()}</td>
                    <td className="p-4 text-indigo-300 font-semibold">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        item.status === 'RETURNED' ? 'bg-emerald-500/20 text-emerald-400' : item.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400' : 'bg-indigo-500/20 text-indigo-300'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right font-mono font-bold text-amber-400">
                      ₹{item.fineAmount || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Overdue Report Table */
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Student / Faculty</th>
                  <th className="p-4">Contact Phone</th>
                  <th className="p-4">Overdue Book Title</th>
                  <th className="p-4">Shelf Location</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4 text-right">Incurred Fine</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{item.userId?.name}</div>
                      <div className="text-[10px] text-slate-400">{item.userId?.email}</div>
                    </td>
                    <td className="p-4 text-slate-300 font-mono">{item.userId?.phone || '+91 9876543210'}</td>
                    <td className="p-4">
                      <div className="font-bold text-rose-300">{item.bookId?.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ISBN: {item.bookId?.ISBN}</div>
                    </td>
                    <td className="p-4 text-slate-400">Shelf {item.bookId?.shelfNumber}</td>
                    <td className="p-4 text-rose-400 font-bold">{new Date(item.dueDate).toLocaleDateString()}</td>
                    <td className="p-4 text-right font-mono font-bold text-amber-400 text-sm">
                      ₹{item.fineAmount || 10}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
