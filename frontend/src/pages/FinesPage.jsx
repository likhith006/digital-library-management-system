import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fineService } from '../services/fineService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { FiDollarSign, FiCheckCircle, FiShield } from 'react-icons/fi';

const FinesPage = () => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [fines, setFines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchFines = async () => {
    try {
      setLoading(true);
      const res = isAdminOrLibrarian
        ? await fineService.getFines(statusFilter !== 'All' ? { status: statusFilter } : {})
        : await fineService.getMyFines();

      if (res.success) {
        setFines(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFines();
  }, [statusFilter]);

  const handleAction = async (id, action) => {
    try {
      await fineService.payFine(id, action);
      fetchFines();
    } catch (err) {
      alert(err.message);
    }
  };

  const totalUnpaid = fines.filter(f => f.status === 'UNPAID').reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FiDollarSign className="w-6 h-6 text-amber-400" /> Library Fines & Penalties Management
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAdminOrLibrarian
              ? 'View overdue late return fines, record payments, and process fine waivers.'
              : 'Track your overdue book fines and make instant online fine clearances.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-right">
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Total Unpaid Fines</span>
            <span className="text-lg font-extrabold font-mono text-amber-300">₹{totalUnpaid}</span>
          </div>

          {isAdminOrLibrarian && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Fines</option>
              <option value="UNPAID">Unpaid Only</option>
              <option value="PAID">Paid Only</option>
              <option value="WAIVED">Waived Only</option>
            </select>
          )}
        </div>
      </div>

      {/* Fines Table */}
      {loading ? (
        <LoadingSpinner text="Loading fine records..." />
      ) : fines.length === 0 ? (
        <EmptyState icon={FiDollarSign} title="No fines found" message="All clear! No outstanding or past fine receipts recorded." />
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Borrower</th>
                  <th className="p-4">Reason / Details</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {fines.map((fine) => (
                  <tr key={fine._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-200">{fine.userId?.name || user?.name}</div>
                      <div className="text-[11px] text-slate-400">{fine.userId?.email || user?.email}</div>
                    </td>

                    <td className="p-4">
                      <div className="text-slate-200 font-medium">{fine.reason}</div>
                      <div className="text-[10px] text-slate-400">{new Date(fine.createdAt).toLocaleDateString()}</div>
                    </td>

                    <td className="p-4 font-mono font-extrabold text-amber-400 text-sm">
                      ₹{fine.amount}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        fine.status === 'PAID'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : fine.status === 'WAIVED'
                          ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}>
                        {fine.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {fine.status === 'UNPAID' && (
                        <>
                          <button
                            onClick={() => handleAction(fine._id, 'PAID')}
                            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/20"
                          >
                            Mark Paid
                          </button>
                          {isAdminOrLibrarian && (
                            <button
                              onClick={() => handleAction(fine._id, 'WAIVED')}
                              className="px-3 py-1.5 rounded-xl bg-purple-600/80 hover:bg-purple-600 text-white text-xs font-bold"
                            >
                              Waive Fine
                            </button>
                          )}
                        </>
                      )}
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

export default FinesPage;
