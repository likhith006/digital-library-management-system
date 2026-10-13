import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { reservationService } from '../services/reservationService';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { FiClock, FiCheckCircle, FiXCircle, FiBookOpen } from 'react-icons/fi';

const ReservationsPage = () => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const res = isAdminOrLibrarian
        ? await reservationService.getReservations(statusFilter !== 'All' ? { status: statusFilter } : {})
        : await reservationService.getMyReservations();

      if (res.success) {
        setReservations(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await reservationService.updateStatus(id, status);
      fetchReservations();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCancel = async (id) => {
    if (window.confirm('Cancel this reservation request?')) {
      try {
        await reservationService.cancelReservation(id);
        fetchReservations();
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
            <FiClock className="w-6 h-6 text-purple-400" /> Book Reservation Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {isAdminOrLibrarian
              ? 'Manage student and faculty reservations for unavailable academic books.'
              : 'Track your reserved book status. You will be notified when books become available.'}
          </p>
        </div>

        {isAdminOrLibrarian && (
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">All Statuses</option>
            <option value="PENDING">Pending Approval</option>
            <option value="APPROVED">Approved / Ready</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        )}
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner text="Fetching reservations list..." />
      ) : reservations.length === 0 ? (
        <EmptyState icon={FiClock} title="No active reservations" message="There are currently no book reservations recorded." />
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="p-4">Book Title</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Reservation Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {reservations.map((res) => (
                  <tr key={res._id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="p-4 font-bold text-slate-200">
                      <div className="flex items-center gap-3">
                        <img
                          src={res.bookId?.coverImage}
                          alt={res.bookId?.title}
                          className="w-8 h-11 object-cover rounded-md flex-shrink-0"
                        />
                        <div>
                          <p>{res.bookId?.title}</p>
                          <p className="text-[10px] text-slate-400 font-mono">ISBN: {res.bookId?.ISBN}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 text-slate-300">
                      <div>{res.userId?.name || user?.name}</div>
                      <div className="text-[10px] text-slate-400">{res.userId?.email || user?.email}</div>
                    </td>

                    <td className="p-4 text-slate-400">
                      {new Date(res.reservationDate).toLocaleDateString()}
                    </td>

                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                        res.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400' : res.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' : res.status === 'COMPLETED' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-rose-500/20 text-rose-400'
                      }`}>
                        {res.status}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-2">
                      {isAdminOrLibrarian ? (
                        <>
                          {res.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(res._id, 'APPROVED')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px]"
                            >
                              Approve
                            </button>
                          )}
                          {res.status !== 'CANCELLED' && res.status !== 'COMPLETED' && (
                            <button
                              onClick={() => handleUpdateStatus(res._id, 'CANCELLED')}
                              className="px-2.5 py-1 rounded-lg bg-rose-600/80 hover:bg-rose-600 text-white font-bold text-[11px]"
                            >
                              Cancel
                            </button>
                          )}
                        </>
                      ) : (
                        res.status === 'PENDING' && (
                          <button
                            onClick={() => handleCancel(res._id)}
                            className="px-3 py-1 rounded-xl bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 text-[11px] font-semibold"
                          >
                            Cancel
                          </button>
                        )
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

export default ReservationsPage;
