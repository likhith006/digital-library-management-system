import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationDropdown from './NotificationDropdown';
import {
  FiBookOpen,
  FiSearch,
  FiUser,
  FiLogOut,
  FiMenu,
  FiShield,
  FiBook,
  FiUsers,
  FiClock,
  FiFileText,
  FiBarChart2,
  FiSettings,
} from 'react-icons/fi';

const Navbar = ({ onToggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/books?search=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  return (
    <header className="sticky top-0 z-40 bg-[#f9f4ee]/90 backdrop-blur-md border-b border-[#eadcc9]">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-4">
        {/* Left: Mobile Menu Toggle & Brand Logo */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-xl text-[#4a352d] hover:bg-[#f1e5d7] hover:text-[#2a1f1a]"
            aria-label="Toggle Sidebar"
          >
            <FiMenu className="w-6 h-6" />
          </button>

          <Link to="/dashboard" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 group-hover:scale-105 transition-transform">
              <FiBookOpen className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-extrabold text-base tracking-tight text-[#2d231f] block leading-none">
                GIST <span className="text-[#ba6d43]">DIGITAL LIBRARY</span>
              </span>
              <span className="text-[10px] font-medium text-[#6b5a52] block mt-0.5 tracking-wider">
                ACADEMIC SYSTEM
              </span>
            </div>
          </Link>
        </div>

        {/* Middle: Global Search */}
        <div className="flex-1 max-w-md hidden md:block">
          <form onSubmit={handleSearchSubmit} className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search books by title, author, ISBN, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#fffaf5] border border-[#eadac3] rounded-xl pl-10 pr-4 py-2 text-xs font-medium text-[#2d231f] placeholder-[#7d6a60] focus:outline-none focus:border-[#ba6d43] focus:ring-1 focus:ring-[#ba6d43] transition-all"
            />
          </form>
        </div>

        {/* Right: Quick Access, Notifications & Profile Menu */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Quick Access Icons for Admin/Librarian */}
          {isAdminOrLibrarian && (
            <div className="hidden xl:flex items-center gap-1 border-r border-slate-800 pr-3 mr-1">
              <Link
                to="/issue-book"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#4b382f] hover:text-[#2d231f] hover:bg-[#f1e5d7] transition-colors flex items-center gap-1.5"
                title="Issue/Return Books"
              >
                <FiBook className="w-3.5 h-3.5 text-indigo-400" /> Issue
              </Link>
              <Link
                to="/reservations"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#4b382f] hover:text-[#2d231f] hover:bg-[#f1e5d7] transition-colors flex items-center gap-1.5"
                title="Manage Reservations"
              >
                <FiClock className="w-3.5 h-3.5 text-purple-400" /> Requests
              </Link>
              <Link
                to="/reports"
                className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#4b382f] hover:text-[#2d231f] hover:bg-[#f1e5d7] transition-colors flex items-center gap-1.5"
                title="Reports & Analytics"
              >
                <FiBarChart2 className="w-3.5 h-3.5 text-emerald-400" /> Analytics
              </Link>
            </div>
          )}

          {/* Notification Bell */}
          <NotificationDropdown />

          {/* User Profile Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-[#f1e5d7] transition-colors"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-[11px] font-bold text-white shadow-md shadow-orange-500/25">
                {(user?.name || 'U').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left pr-1">
                <p className="text-xs font-semibold text-[#2d231f] leading-none">{user?.name}</p>
                <span className="text-[10px] font-bold text-[#ba6d43] tracking-wider">
                  {user?.role}
                </span>
              </div>
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 glass-panel rounded-2xl shadow-2xl border border-slate-700/80 z-50 p-2 animate-fade-in">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-slate-100">{user?.name}</p>
                  <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
                </div>

                <Link
                  to="/profile"
                  onClick={() => setShowUserMenu(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                >
                  <FiUser className="w-4 h-4 text-indigo-400" /> Profile Settings
                </Link>

                {isAdminOrLibrarian && (
                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors"
                  >
                    <FiSettings className="w-4 h-4 text-purple-400" /> Library Settings
                  </Link>
                )}

                <button
                  onClick={() => {
                    setShowUserMenu(false);
                    logout();
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors mt-1"
                >
                  <FiLogOut className="w-4 h-4" /> Log Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
