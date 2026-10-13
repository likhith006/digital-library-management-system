import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { reportService } from '../services/reportService';
import { bookService } from '../services/bookService';
import { issueService } from '../services/issueService';
import StatCard from '../components/StatCard';
import BookCard from '../components/BookCard';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiBook,
  FiBookOpen,
  FiUsers,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiDollarSign,
  FiPlus,
  FiArrowRight,
  FiDownload,
  FiTrendingUp,
} from 'react-icons/fi';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';

const COLORS = ['#f97316', '#fb923c', '#fbbf24', '#f43f5e', '#14b8a6', '#38bdf8', '#f59e0b'];

const DashboardPage = () => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [recommendedBooks, setRecommendedBooks] = useState([]);
  const [myIssues, setMyIssues] = useState([]);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        setLoading(true);
        if (isAdminOrLibrarian) {
          const res = await reportService.getDashboardStats();
          if (res.success) {
            setDashboardData(res.data);
          }
        } else {
          // Fetch student/faculty specific data
          const [booksRes, issuesRes] = await Promise.all([
            bookService.getBooks({ availability: 'available' }),
            issueService.getMyIssues(),
          ]);

          if (booksRes.success) {
            setRecommendedBooks(booksRes.data.slice(0, 4));
          }
          if (issuesRes.success) {
            setMyIssues(issuesRes.data);
          }
        }
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [user, isAdminOrLibrarian]);

  if (loading) {
    return <LoadingSpinner text="Fetching real-time library analytics..." />;
  }

  // Render Admin / Librarian Dashboard
  if (isAdminOrLibrarian) {
    const summary = dashboardData?.summary || {};
    const charts = dashboardData?.charts || {};

    return (
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              Library Control Center
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Welcome back, {user?.name}. Real-time monitoring & administrative overview.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/issue-book"
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/25 flex items-center gap-1.5"
            >
              <FiPlus className="w-4 h-4" /> Issue Book
            </Link>
            <Link
              to="/books"
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-1.5"
            >
              <FiBook className="w-4 h-4 text-orange-400" /> Manage Books
            </Link>
          </div>
        </div>

        {/* Stat Cards Grid (8 Metrics as requested in #8) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Titles" value={summary.totalBooks || 0} icon={FiBook} color="orange" subtitle={`Total Copies: ${summary.totalCopiesSum || 0}`} />
          <StatCard title="Available Copies" value={summary.availableCopiesSum || 0} icon={FiCheckCircle} color="emerald" subtitle="Ready for issue" />
          <StatCard title="Currently Issued" value={summary.totalIssued || 0} icon={FiBookOpen} color="amber" subtitle="Active loans" />
          <StatCard title="Overdue Books" value={summary.totalOverdue || 0} icon={FiAlertCircle} color="rose" subtitle="Pending returns" />
          <StatCard title="Active Students" value={summary.totalStudents || 0} icon={FiUsers} color="sky" subtitle="Enrolled members" />
          <StatCard title="Faculty Members" value={summary.totalFaculty || 0} icon={FiUsers} color="teal" subtitle="Teaching staff" />
          <StatCard title="Active Reservations" value={summary.activeReservations || 0} icon={FiClock} color="orange" subtitle="In queue" />
          <StatCard title="Total Fines" value={`₹${summary.totalFinesAmount || 0}`} icon={FiDollarSign} color="rose" subtitle={`Unpaid: ₹${summary.unpaidFinesAmount || 0}`} />
        </div>

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 1. Books by Category (Pie / Donut) */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> Books by Category
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={charts.booksByCategory || []}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {(charts.booksByCategory || []).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                    itemStyle={{ color: '#f8fafc' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 2. Monthly Book Issues & Returns (Bar / Line) */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Monthly Book Issues & Returns
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.monthlyIssues || []}>
                  <XAxis dataKey="month" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
                  <Bar dataKey="issues" fill="#f97316" radius={[4, 4, 0, 0]} name="Books Issued" />
                  <Bar dataKey="returns" fill="#14b8a6" radius={[4, 4, 0, 0]} name="Books Returned" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 3. Most Borrowed Books (Horizontal Bar Chart) */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500" /> Most Borrowed Titles
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart layout="vertical" data={charts.mostBorrowedBooks || []}>
                  <XAxis type="number" stroke="#64748b" fontSize={11} />
                  <YAxis dataKey="title" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="borrows" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Times Borrowed" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* 4. User Activity Distribution */}
          <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex flex-col justify-between">
            <h3 className="text-base font-bold text-slate-100 mb-4 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500" /> Borrowing by User Group
            </h3>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={charts.userActivity || []}>
                  <XAxis dataKey="role" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', fontSize: '12px' }}
                  />
                  <Bar dataKey="borrows" fill="#38bdf8" radius={[4, 4, 0, 0]} name="Total Borrowings" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render Student / Faculty Dashboard
  const activeLoans = myIssues.filter(i => i.status === 'ISSUED' || i.status === 'OVERDUE');
  const overdueLoans = myIssues.filter(i => i.status === 'OVERDUE');
  const totalFine = myIssues.reduce((sum, i) => sum + (i.fineAmount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Student Welcome Banner */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800 relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="relative z-10 max-w-xl">
          <span className="px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            {user?.role} PORTAL
          </span>
          <h1 className="text-3xl font-extrabold text-white mt-3">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            Department of {user?.department || 'Engineering'}. Access textbook catalogs, digital notes, track your borrowed books, and reserve research materials.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to="/books"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-bold transition-all shadow-lg shadow-orange-500/25 flex items-center gap-2"
            >
              <FiBook className="w-4 h-4" /> Browse Catalog
            </Link>
            <Link
              to="/digital-library"
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 flex items-center gap-2"
            >
              <FiDownload className="w-4 h-4 text-orange-400" /> Digital Library
            </Link>
          </div>
        </div>
      </div>

      {/* Student Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Currently Issued" value={activeLoans.length} icon={FiBookOpen} color="orange" subtitle={`Max limit: ${user?.role === 'FACULTY' ? 6 : 3}`} />
        <StatCard title="Overdue Books" value={overdueLoans.length} icon={FiAlertCircle} color="rose" subtitle="Requires immediate return" />
        <StatCard title="Pending Fines" value={`₹${totalFine}`} icon={FiDollarSign} color="amber" subtitle="Overdue charges" />
        <StatCard title="Total Borrowed" value={myIssues.length} icon={FiCheckCircle} color="emerald" subtitle="All-time history" />
      </div>

      {/* Currently Issued Books & Due Dates */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FiClock className="w-5 h-5 text-orange-400" /> Currently Issued Books & Upcoming Due Dates
          </h3>
          <Link to="/my-books" className="text-xs font-semibold text-orange-400 hover:text-orange-300">
            View All &rarr;
          </Link>
        </div>

        {activeLoans.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">You have no books currently issued to your account.</p>
        ) : (
          <div className="space-y-3">
            {activeLoans.map((issue) => (
              <div key={issue._id} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img
                    src={issue.bookId?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
                    alt={issue.bookId?.title}
                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-slate-100">{issue.bookId?.title}</h4>
                    <p className="text-[11px] text-slate-400">by {issue.bookId?.author}</p>
                    <p className="text-[10px] text-slate-400 font-mono mt-1">ISBN: {issue.bookId?.ISBN}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                    issue.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                    {issue.status === 'OVERDUE' ? 'OVERDUE' : 'ISSUED'}
                  </span>
                  <p className="text-xs font-medium text-slate-300 mt-1">
                    Due: {new Date(issue.dueDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Books */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <FiTrendingUp className="w-5 h-5 text-indigo-400" /> Recommended Academic Books
          </h3>
          <Link to="/books" className="text-xs font-semibold text-indigo-400 hover:text-indigo-300">
            Explore All Catalog &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedBooks.map((book) => (
            <BookCard key={book._id} book={book} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
