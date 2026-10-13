import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  FiUsers,
  FiUserPlus,
  FiSearch,
  FiEdit,
  FiTrash2,
  FiCheckCircle,
  FiXCircle,
  FiLock,
} from 'react-icons/fi';

const ROLES = ['All', 'ADMIN', 'LIBRARIAN', 'STUDENT', 'FACULTY'];
const DEPARTMENTS = [
  'All',
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
  'Library Administration',
  'Central Library',
];

const UsersPage = () => {
  const { user } = useAuth();
  const canManageRoles = user?.role === 'ADMIN';
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUserId, setEditUserId] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'STUDENT',
    studentId: '',
    employeeId: '',
    department: 'Computer Science & Engineering',
    year: '1st Year',
    phone: '',
    isActive: true,
  });

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (roleFilter !== 'All') params.role = roleFilter;
      if (deptFilter !== 'All') params.department = deptFilter;
      if (statusFilter !== 'All') params.status = statusFilter;

      const res = await userService.getUsers(params);
      if (res.success) {
        setUsers(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [search, roleFilter, deptFilter, statusFilter]);

  const handleOpenAddModal = () => {
    setEditUserId(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'STUDENT',
      studentId: '',
      employeeId: '',
      department: 'Computer Science & Engineering',
      year: '1st Year',
      phone: '',
      isActive: true,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (user) => {
    setEditUserId(user._id);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // blank unless changing
      role: user.role,
      studentId: user.studentId || '',
      employeeId: user.employeeId || '',
      department: user.department || 'Computer Science & Engineering',
      year: user.year || '1st Year',
      phone: user.phone || '',
      isActive: user.isActive,
    });
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      if (editUserId) {
        await userService.updateUser(editUserId, formData);
      } else {
        await userService.createUser(formData);
      }
      setIsModalOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.message || 'Failed to save user.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleDeactivate = async (user) => {
    const actionName = user.isActive ? 'deactivate' : 'reactivate';
    if (window.confirm(`Are you sure you want to ${actionName} account for ${user.name}?`)) {
      try {
        await userService.updateUser(user._id, { isActive: !user.isActive });
        fetchUsers();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FiUsers className="w-6 h-6 text-indigo-400" /> College Users & Member Directory
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage library memberships. Faculty and staff access can only be granted by an administrator.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
        >
          <FiUserPlus className="w-4 h-4" /> Add New Member
        </button>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Name, Email, Student ID, or Employee ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {ROLES.map(r => (
            <option key={r} value={r}>Role: {r}</option>
          ))}
        </select>

        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {DEPARTMENTS.map(d => (
            <option key={d} value={d}>Dept: {d}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          <option value="All">Status: All</option>
          <option value="active">Active Only</option>
          <option value="inactive">Deactivated Only</option>
        </select>
      </div>

      {/* Users Table */}
      {loading ? (
        <LoadingSpinner text="Fetching user directory..." />
      ) : users.length === 0 ? (
        <EmptyState icon={FiUsers} title="No users found" message="No user accounts match your active search filter." />
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Member Name & Email</th>
                  <th className="p-4">ID & Department</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-[11px] font-bold text-white border border-indigo-500/30 flex-shrink-0">
                          {(u.name || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-100">{u.name}</div>
                          <div className="text-[11px] text-slate-400">{u.email}</div>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <div className="font-mono text-indigo-300 font-bold">{u.studentId || u.employeeId || 'N/A'}</div>
                      <div className="text-[11px] text-slate-400">{u.department}</div>
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        u.role === 'ADMIN' ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : u.role === 'LIBRARIAN' ? 'bg-purple-500/20 text-purple-300' : u.role === 'FACULTY' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-sky-500/20 text-sky-300'
                      }`}>
                        {u.role}
                      </span>
                    </td>

                    <td className="p-4">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-bold">
                          <FiCheckCircle className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 font-bold">
                          <FiXCircle className="w-3.5 h-3.5" /> Inactive
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEditModal(u)}
                          className="p-1.5 rounded-lg bg-slate-800 text-indigo-400 hover:text-indigo-300"
                          title="Edit User"
                        >
                          <FiEdit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleDeactivate(u)}
                          className={`p-1.5 rounded-lg text-xs font-semibold ${
                            u.isActive ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20' : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          }`}
                          title={u.isActive ? 'Deactivate Account' : 'Reactivate Account'}
                        >
                          {u.isActive ? 'Deactivate' : 'Enable'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit User Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editUserId ? 'Edit Member Details' : 'Create New Member Account'}
      >
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Password {editUserId ? '(leave blank to keep current)' : '*'}</label>
              <input
                type="password"
                required={!editUserId}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Account Role *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="STUDENT">Student</option>
                <option value="FACULTY" disabled={!canManageRoles && formData.role !== 'FACULTY'}>Faculty{!canManageRoles ? ' (Admin only)' : ''}</option>
                <option value="LIBRARIAN" disabled={!canManageRoles && formData.role !== 'LIBRARIAN'}>Librarian{!canManageRoles ? ' (Admin only)' : ''}</option>
                <option value="ADMIN" disabled={!canManageRoles && formData.role !== 'ADMIN'}>Administrator{!canManageRoles ? ' (Admin only)' : ''}</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {DEPARTMENTS.filter(d => d !== 'All').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Student / Employee ID</label>
              <input
                type="text"
                value={formData.studentId || formData.employeeId}
                onChange={(e) => setFormData({ ...formData, studentId: e.target.value, employeeId: e.target.value })}
                placeholder="e.g. STU-2024-101"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl font-medium text-slate-400 hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30"
            >
              {submitting ? 'Saving...' : editUserId ? 'Update Member' : 'Create Member'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default UsersPage;
