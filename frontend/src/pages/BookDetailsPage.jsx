import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/bookService';
import { reservationService } from '../services/reservationService';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  FiBook,
  FiBookmark,
  FiMapPin,
  FiCalendar,
  FiGlobe,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiDownload,
  FiArrowLeft,
  FiUserCheck,
  FiCheck,
} from 'react-icons/fi';

const BookDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const fetchBookDetails = async () => {
    try {
      setLoading(true);
      const res = await bookService.getBookById(id);
      if (res.success) {
        setBook(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookDetails();
  }, [id]);

  const handleReserve = async () => {
    setReserving(true);
    setFeedback({ type: '', message: '' });
    try {
      const res = await reservationService.createReservation({ bookId: book._id });
      if (res.success) {
        setFeedback({ type: 'success', message: 'Book reserved successfully! You will be notified when it becomes available.' });
        fetchBookDetails();
      }
    } catch (err) {
      setFeedback({ type: 'error', message: err.message || 'Failed to place reservation.' });
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Fetching book information..." />;
  }

  if (!book) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Book not found.</p>
        <Link to="/books" className="text-indigo-400 font-semibold mt-2 inline-block">Back to Catalog</Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Back Navigation */}
      <button
        onClick={() => navigate(-1)}
        className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
      >
        <FiArrowLeft className="w-4 h-4" /> Back to Books Catalog
      </button>

      {/* Main Details Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Cover Column */}
        <div className="md:col-span-4 lg:col-span-3">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 aspect-[3/4]">
            <img
              src={book.coverImage}
              alt={book.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
              }}
            />
          </div>
        </div>

        {/* Info Column */}
        <div className="md:col-span-8 lg:col-span-9 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {book.category}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
                Dept: {book.department}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
              {book.title}
            </h1>
            <p className="text-sm font-medium text-slate-400 mt-1">by <span className="text-slate-200 font-semibold">{book.author}</span></p>

            {/* Status Badges */}
            <div className="mt-4 flex items-center gap-3">
              {book.availableCopies > 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <FiCheckCircle className="w-4 h-4" /> Available for Issue ({book.availableCopies} of {book.totalCopies} copies in library)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  <FiXCircle className="w-4 h-4" /> Currently Out of Stock (0 Available)
                </span>
              )}
            </div>

            {/* Description */}
            <div className="mt-6 pt-6 border-t border-slate-800">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2">Description & Summary</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-normal">{book.description}</p>
            </div>

            {/* Specs Grid */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block uppercase font-mono">ISBN</span>
                <span className="font-bold text-slate-200 font-mono">{book.ISBN}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Publisher</span>
                <span className="font-semibold text-slate-200">{book.publisher}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Publication Year</span>
                <span className="font-semibold text-slate-200">{book.publicationYear}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block uppercase">Shelf & Rack</span>
                <span className="font-semibold text-indigo-300">Shelf {book.shelfNumber} / Rack {book.rackNumber}</span>
              </div>
            </div>

            {feedback.message && (
              <div className={`mt-4 p-3.5 rounded-2xl text-xs font-medium border ${
                feedback.type === 'success' ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30' : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}>
                {feedback.message}
              </div>
            )}
          </div>

          {/* Role-Based Action Buttons */}
          <div className="pt-6 border-t border-slate-800 flex flex-wrap gap-3">
            {isAdminOrLibrarian ? (
              <>
                <Link
                  to={`/issue-book?bookId=${book._id}`}
                  className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                >
                  <FiUserCheck className="w-4 h-4" /> Issue This Book
                </Link>
              </>
            ) : (
              <>
                {book.availableCopies > 0 ? (
                  <button
                    onClick={() => alert(`To borrow "${book.title}", please visit the library counter at Shelf ${book.shelfNumber} / Rack ${book.rackNumber}. Your student ID is registered.`)}
                    className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-600/30 flex items-center gap-2"
                  >
                    <FiCheck className="w-4 h-4" /> Request / Borrow Book
                  </button>
                ) : book.userActiveReservation ? (
                  <span className="px-6 py-3 rounded-xl bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold text-xs flex items-center gap-2">
                    <FiClock className="w-4 h-4" /> Active Reservation Placed
                  </span>
                ) : (
                  <button
                    onClick={handleReserve}
                    disabled={reserving}
                    className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 flex items-center gap-2"
                  >
                    {reserving ? 'Reserving...' : <><FiClock className="w-4 h-4" /> Reserve Book</>}
                  </button>
                )}

                {(book.format === 'BOTH' || book.format === 'DIGITAL') && book.digitalFile && (
                  <a
                    href={book.digitalFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 flex items-center gap-2"
                  >
                    <FiDownload className="w-4 h-4 text-indigo-400" /> Download E-Book (PDF)
                  </a>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetailsPage;
