import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';
import { FiUser, FiMail, FiPhone, FiCheckCircle, FiSave } from 'react-icons/fi';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    department: user?.department || 'Computer Science & Engineering',
    year: user?.year || '1st Year',
    profileImage: user?.profileImage || '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await authService.updateProfile(formData);
      if (res.success) {
        updateUser(res.data);
        setMessage('Profile updated successfully!');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Profile Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800 flex items-center gap-5">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 text-xl font-extrabold text-white shadow-xl shadow-orange-500/20">
          {(user?.name || 'U').charAt(0).toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-white">{user?.name}</h1>
          <p className="text-xs text-slate-400 mt-0.5">{user?.email}</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/15 text-orange-300 border border-orange-500/30">
              {user?.role}
            </span>
            <span className="text-xs text-slate-300 font-mono">
              ID: {user?.studentId || user?.employeeId || 'N/A'}
            </span>
          </div>
        </div>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      {/* Edit Form */}
      <div className="glass-panel p-8 rounded-3xl border border-slate-800">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Year of Study</label>
              <input
                type="text"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-3 text-[11px] text-slate-400">
            Profile photos are disabled in this interface. Your account will use the initials badge instead.
          </div>

          <div className="pt-4 border-t border-slate-800 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-orange-500/25 flex items-center gap-2"
            >
              <FiSave className="w-4 h-4" /> {saving ? 'Saving...' : 'Update Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;
