import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FiGrid,
  FiBook,
  FiFileText,
  FiBookmark,
  FiClock,
  FiDollarSign,
  FiBell,
  FiUser,
  FiUsers,
  FiArrowRightCircle,
  FiBarChart2,
  FiSettings,
  FiBookOpen,
} from 'react-icons/fi';

const Sidebar = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const studentFacultyLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Browse Books', path: '/books', icon: FiBook },
    { name: 'Digital Library', path: '/digital-library', icon: FiFileText },
    { name: 'My Books', path: '/my-books', icon: FiBookmark },
    { name: 'Reservations', path: '/reservations', icon: FiClock },
    { name: 'Fines & Penalties', path: '/fines', icon: FiDollarSign },
    { name: 'Notifications', path: '/notifications', icon: FiBell },
    { name: 'Profile', path: '/profile', icon: FiUser },
  ];

  const adminLibrarianLinks = [
    { name: 'Dashboard', path: '/dashboard', icon: FiGrid },
    { name: 'Books Management', path: '/books', icon: FiBook },
    { name: 'Users Directory', path: '/users', icon: FiUsers },
    { name: 'Issue / Return', path: '/issue-book', icon: FiArrowRightCircle },
    { name: 'Reservations', path: '/reservations', icon: FiClock },
    { name: 'Digital Library', path: '/digital-library', icon: FiFileText },
    { name: 'Fines Management', path: '/fines', icon: FiDollarSign },
    { name: 'Reports & Analytics', path: '/reports', icon: FiBarChart2 },
    { name: 'Library Settings', path: '/settings', icon: FiSettings },
  ];

  const navLinks = isAdminOrLibrarian ? adminLibrarianLinks : studentFacultyLinks;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
        />
      )}

      <aside
        className={`fixed lg:static top-0 bottom-0 left-0 z-40 w-64 bg-[#f9f4ee] border-r border-[#eadcc9] transform transition-transform duration-300 ease-in-out flex flex-col justify-between ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation Items */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="mb-6 px-3 pt-2">
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#6a564d]">
              {user?.role} PORTAL
            </span>
          </div>

          <nav className="space-y-1.5">
            {navLinks.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-[#ba6d43] to-[#d8a15e] text-white shadow-lg shadow-[#ba6d43]/25'
                        : 'text-[#5b463f] hover:text-[#2d231f] hover:bg-[#f1e5d7]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.name}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Card Footer */}
        <div className="p-4 border-t border-[#eadcc9] bg-[#f5ebdf]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-[#fffaf5] border border-[#eadcc9]">
            <div className="w-8 h-8 rounded-lg bg-[#f3d7ba] text-[#8a4e2a] flex items-center justify-center font-bold text-xs">
              {user?.name ? user.name.charAt(0) : 'U'}
            </div>
            <div className="overflow-hidden">
              <p className="text-xs font-semibold text-[#2d231f] truncate">{user?.name}</p>
              <p className="text-[10px] text-[#6b5a52] truncate">{user?.department || 'Academic Staff'}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
