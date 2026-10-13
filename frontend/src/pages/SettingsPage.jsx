import React, { useState, useEffect } from 'react';
import { settingService } from '../services/settingService';
import LoadingSpinner from '../components/LoadingSpinner';
import { FiSettings, FiDollarSign, FiClock, FiBook, FiSave, FiCheckCircle } from 'react-icons/fi';

const SettingsPage = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const [settings, setSettings] = useState({
    finePerDay: 2,
    studentMaxBooks: 3,
    studentIssueDays: 14,
    facultyMaxBooks: 6,
    facultyIssueDays: 30,
    collegeName: 'Gist Institute of Learning',
  });

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await settingService.getSettings();
      if (res.success && res.data) {
        setSettings(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const res = await settingService.updateSettings(settings);
      if (res.success) {
        setMessage('Library policy settings updated successfully!');
      }
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner text="Loading system settings..." />;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="glass-panel p-6 rounded-3xl border border-slate-800">
        <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
          <FiSettings className="w-6 h-6 text-purple-400" /> Library Policy & System Settings
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure daily fine rates, borrowing limits for students vs. faculty, and institutional parameters.
        </p>
      </div>

      {message && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
          <FiCheckCircle className="w-4 h-4" /> {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Fine Calculation Policy */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FiDollarSign className="w-4 h-4 text-amber-400" /> Overdue Fine Calculation Policy
          </h3>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">Fine Rate per Overdue Day (₹)</label>
            <input
              type="number"
              min="0"
              required
              value={settings.finePerDay}
              onChange={(e) => setSettings({ ...settings, finePerDay: Number(e.target.value) })}
              className="w-full max-w-xs bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-indigo-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Late returns are charged automatically as: Overdue Days × ₹{settings.finePerDay}.
            </p>
          </div>
        </div>

        {/* Student Borrowing Limits */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FiBook className="w-4 h-4 text-sky-400" /> Student Borrowing Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Active Books Allowed</label>
              <input
                type="number"
                min="1"
                required
                value={settings.studentMaxBooks}
                onChange={(e) => setSettings({ ...settings, studentMaxBooks: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Standard Loan Period (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={settings.studentIssueDays}
                onChange={(e) => setSettings({ ...settings, studentIssueDays: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Faculty Borrowing Limits */}
        <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <FiClock className="w-4 h-4 text-emerald-400" /> Faculty Borrowing Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Maximum Active Books Allowed</label>
              <input
                type="number"
                min="1"
                required
                value={settings.facultyMaxBooks}
                onChange={(e) => setSettings({ ...settings, facultyMaxBooks: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Standard Loan Period (Days)</label>
              <input
                type="number"
                min="1"
                required
                value={settings.facultyIssueDays}
                onChange={(e) => setSettings({ ...settings, facultyIssueDays: Number(e.target.value) })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <FiSave className="w-4 h-4" /> {saving ? 'Saving Changes...' : 'Save Settings'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsPage;
