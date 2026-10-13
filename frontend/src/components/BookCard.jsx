import React from 'react';
import { Link } from 'react-router-dom';
import { FiBook, FiBookmark, FiMapPin, FiCheckCircle, FiXCircle, FiAlertCircle, FiFileText } from 'react-icons/fi';

const BookCard = ({ book }) => {
  const getBadge = () => {
    if (book.availableCopies === 0) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
          <FiXCircle className="w-3.5 h-3.5" /> Unavailable
        </span>
      );
    }
    if (book.availableCopies <= 2) {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
          <FiAlertCircle className="w-3.5 h-3.5" /> Low Stock ({book.availableCopies})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
        <FiCheckCircle className="w-3.5 h-3.5" /> Available ({book.availableCopies})
      </span>
    );
  };

  return (
    <div className="glass-card rounded-2xl overflow-hidden flex flex-col h-full border border-slate-800 hover:border-indigo-500/40 group">
      {/* Cover Image */}
      <div className="relative h-52 bg-slate-950 overflow-hidden flex items-center justify-center">
        <img
          src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80'}
          alt={book.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
          <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wider bg-slate-900/80 text-indigo-300 border border-indigo-500/30 backdrop-blur-md">
            {book.category}
          </span>
          {getBadge()}
        </div>

        {book.format === 'BOTH' || book.format === 'DIGITAL' ? (
          <div className="absolute bottom-3 right-3 bg-indigo-600/90 text-white p-1.5 rounded-lg text-xs flex items-center gap-1 backdrop-blur-md" title="E-Book Available">
            <FiFileText className="w-3.5 h-3.5" /> E-Book
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-slate-100 text-base line-clamp-1 group-hover:text-indigo-400 transition-colors">
            {book.title}
          </h4>
          <p className="text-xs text-slate-400 mt-1 line-clamp-1">by {book.author}</p>

          <div className="mt-3 flex flex-wrap gap-y-1.5 text-[12px] text-slate-400">
            <span className="w-full flex items-center gap-1.5 text-slate-400">
              <FiBookmark className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span className="font-mono text-slate-300">ISBN: {book.ISBN}</span>
            </span>
            <span className="w-full flex items-center gap-1.5 text-slate-400">
              <FiMapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
              <span>Shelf {book.shelfNumber || 'N/A'} (Rack {book.rackNumber || 'N/A'})</span>
            </span>
          </div>
        </div>

        {/* Footer Link */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">{book.department}</span>
          <Link
            to={`/books/${book._id}`}
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
          >
            View Details &rarr;
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BookCard;
