import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { bookService } from '../services/bookService';
import BookCard from '../components/BookCard';
import Modal from '../components/Modal';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import {
  FiSearch,
  FiPlus,
  FiBook,
  FiGrid,
  FiList,
  FiTrash2,
  FiEdit,
  FiCheckCircle,
  FiXCircle,
  FiGlobe,
  FiBookOpen,
  FiAlertCircle,
  FiRefreshCw,
  FiExternalLink,
} from 'react-icons/fi';


const CATEGORIES = [
  'All','Computer Science','Software Engineering','Artificial Intelligence',
  'Electronics','Mechanical Engineering','Civil Engineering','Electrical Engineering',
  'Database Management','Networking','Mathematics','Physics','Management',
  'Cybersecurity','Cloud Computing',
];

const DEPARTMENTS = [
  'All','Computer Science & Engineering','Electronics & Communication',
  'Mechanical Engineering','Civil Engineering','Electrical Engineering',
  'General Engineering','Business & Management','Information Technology',
];

const QUICK_SEARCHES = [
  'Data Structures Algorithms','Machine Learning','Computer Networks',
  'Thermodynamics Engineering','Database Management Systems',
  'Operating Systems','Artificial Intelligence','Digital Electronics',
  'Calculus Engineering Mathematics','Software Engineering',
];

const BooksPage = () => {
  const { user, loading: authLoading } = useAuth();
  const isAdminOrLibrarian =
    user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [searchParams] = useSearchParams();

  // ── Tab State ──────────────────────────────────────
  const [activeTab, setActiveTab] = useState('library');

  // ── Library Catalog ────────────────────────────────
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDept, setSelectedDept] = useState('All');
  const [availability, setAvailability] = useState('All');
  const [importedISBNs, setImportedISBNs] = useState(new Set());

  // ── Google Books ───────────────────────────────────
  const [googleBooks, setGoogleBooks] = useState([]);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleSearch, setGoogleSearch] = useState('');
  const [googleError, setGoogleError] = useState('');
  const [importingISBN, setImportingISBN] = useState(null);
  const [importedSuccess, setImportedSuccess] = useState('');
  const [importedError, setImportedError] = useState('');

  // ── Add/Edit Modal ─────────────────────────────────
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editBookId, setEditBookId] = useState(null);
  const [editFormSnapshot, setEditFormSnapshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [formError, setFormError] = useState('');

  const defaultForm = {
    title: '', author: '', ISBN: '', publisher: 'Academic Press',
    category: 'Computer Science', department: 'Computer Science & Engineering',
    description: '', coverImage: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
    totalCopies: 5, availableCopies: 5, shelfNumber: 'A-01', rackNumber: 'R-01',
    publicationYear: 2024, language: 'English', format: 'PHYSICAL', digitalFile: '',
  };
  const [formData, setFormData] = useState(defaultForm);

  // ── Fetch Library Books ────────────────────────────
  const fetchBooks = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedDept !== 'All') params.department = selectedDept;
      if (availability !== 'All') params.availability = availability;
      const res = await bookService.getBooks(params);
      if (res.success) {
        setBooks(res.data || []);
        setImportedISBNs(new Set((res.data || []).map((b) => b.ISBN)));
      }
    } catch (err) {
      console.error('Failed to fetch books:', err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedCategory, selectedDept, availability]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // ── Fetch Google Books ─────────────────────────────
  const fetchGoogleBooks = async (query) => {
    const q = (query || googleSearch || 'engineering textbook').trim();
    if (!q) return;
    try {
      setGoogleLoading(true);
      setGoogleError('');
      setImportedError('');
      const res = await bookService.searchExternal(q, 60);
      if (res.success) {
        setGoogleBooks(res.data || []);
        if (!res.data || res.data.length === 0) {
          setGoogleError('No results found. Try a different keyword.');
        }
      } else {
        setGoogleError(res.message || 'Search failed.');
      }
    } catch (err) {
      setGoogleError(err.message || 'Failed to connect to Google Books API. Check backend is running.');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Auto-load Google Books when switching to that tab
  useEffect(() => {
    if (activeTab === 'google' && googleBooks.length === 0 && !googleLoading) {
      fetchGoogleBooks('computer science engineering textbook');
    }
  }, [activeTab]);

  const handleGoogleSearch = (e) => {
    e.preventDefault();
    fetchGoogleBooks(googleSearch);
  };

  // Google Books catalog browsing remains read-only in the library UX.
  // ── Add/Edit Modal ─────────────────────────────────
  const handleOpenAddModal = () => {
    setEditBookId(null);
    setFormData(defaultForm);
    setFormError('');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (book) => {
    const snap = {
      title: book.title,
      author: book.author,
      ISBN: book.ISBN,
      publisher: book.publisher || '',
      category: book.category,
      department: book.department || 'General Engineering',
      description: book.description || '',
      coverImage: book.coverImage || '',
      totalCopies: Number(book.totalCopies) || 1,
      availableCopies: Number(book.availableCopies) || Number(book.totalCopies) || 1,
      shelfNumber: book.shelfNumber || '',
      rackNumber: book.rackNumber || '',
      publicationYear: book.publicationYear || 2024,
      language: book.language || 'English',
      format: book.format || 'PHYSICAL',
      digitalFile: book.digitalFile || '',
    };
    setEditBookId(book._id);
    setEditFormSnapshot(snap);
    setFormData(snap);
    setFormError('');
    setIsModalOpen(true);
  };


  const handleSubmitForm = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      if (editBookId) {
        await bookService.updateBook(editBookId, formData);
      } else {
        await bookService.createBook(formData);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err) {
      setFormError(err.message || 'Failed to save. Check for duplicate ISBN.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async (id, title) => {
    if (!window.confirm(`Delete "${title}"?`)) return;
    try {
      await bookService.deleteBook(id);
      fetchBooks();
    } catch (err) {
      alert(err.message);
    }
  };

  // ── Form input helper ──────────────────────────────
  const inputCls = 'w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-400 transition-colors';
  const labelCls = 'block text-xs font-semibold text-slate-300 mb-1';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FiBook className="w-6 h-6 text-orange-400" /> Academic Book Catalog
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse your library catalog or explore millions of titles via Google Books API.
          </p>
          {!authLoading && user && (
            <p className="text-[11px] text-slate-500 mt-1">
              Logged in as: <span className="font-bold text-indigo-400">{user.name}</span>
              <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300">
                {user.role}
              </span>
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isAdminOrLibrarian && activeTab === 'library' && (
            <>
              <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800">
                <button onClick={() => setViewMode('grid')} title="Grid View"
                  className={`p-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'grid' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  <FiGrid className="w-4 h-4" />
                </button>
                <button onClick={() => setViewMode('table')} title="Table View"
                  className={`p-2 rounded-lg text-xs font-bold transition-all ${viewMode === 'table' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}>
                  <FiList className="w-4 h-4" />
                </button>
              </div>
              <button onClick={handleOpenAddModal}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-400 hover:to-amber-400 text-white text-xs font-bold shadow-lg shadow-orange-500/25 flex items-center gap-1.5 transition-all">
                <FiPlus className="w-4 h-4" /> Add New Book
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
        <button onClick={() => setActiveTab('library')}
          className={`flex-1 py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'library' ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
          <FiBookOpen className="w-4 h-4" />
          Library Catalog
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/20">{books.length}</span>
        </button>
        <button onClick={() => setActiveTab('google')}
          className={`flex-1 py-2.5 px-5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
            activeTab === 'google' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'}`}>
          <FiGlobe className="w-4 h-4" />
          Google Books Explorer
          <span className="px-2 py-0.5 rounded text-[9px] font-extrabold bg-white/20">LIVE API</span>
        </button>
      </div>

      {/* ══════════ LIBRARY CATALOG TAB ══════════ */}
      {activeTab === 'library' && (
        <>
          {/* Search & Filters */}
          <div className="glass-panel p-5 rounded-3xl border border-slate-800">
            <div className="flex flex-col md:flex-row gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Search by Title, Author, ISBN…"
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-orange-400" />
              </div>
              <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                {CATEGORIES.map((c) => <option key={c} value={c}>Category: {c}</option>)}
              </select>
              <select value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                {DEPARTMENTS.map((d) => <option key={d} value={d}>Dept: {d}</option>)}
              </select>
              <select value={availability} onChange={(e) => setAvailability(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500">
                <option value="All">Stock: All</option>
                <option value="available">Available Only</option>
                <option value="unavailable">Out of Stock</option>
              </select>
            </div>
          </div>

          {loading ? <LoadingSpinner text="Loading library catalog…" /> :
            books.length === 0 ? (
              <EmptyState icon={FiBook} title="No books found"
                message="Try different filters or import books from Google Books."
                actionButton={
                  <button onClick={() => setActiveTab('google')}
                    className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2">
                    <FiGlobe className="w-4 h-4" /> Browse Google Books
                  </button>
                } />
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {books.map((book) => (
                  <div key={book._id} className="relative group">
                    <BookCard book={book} />
                    {isAdminOrLibrarian && (
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button onClick={() => handleOpenEditModal(book)}
                          className="p-2 rounded-lg bg-slate-900/90 text-orange-400 hover:text-orange-300 border border-orange-500/30 backdrop-blur-md" title="Edit">
                          <FiEdit className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteBook(book._id, book.title)}
                          className="p-2 rounded-lg bg-slate-900/90 text-rose-400 hover:text-rose-300 border border-rose-500/30 backdrop-blur-md" title="Delete">
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel rounded-3xl border border-slate-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="p-4">Book</th>
                        <th className="p-4">ISBN</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Location</th>
                        <th className="p-4">Availability</th>
                        {isAdminOrLibrarian && <th className="p-4 text-right">Actions</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs">
                      {books.map((book) => (
                        <tr key={book._id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <img src={book.coverImage} alt={book.title}
                                className="w-9 h-12 object-cover rounded-md flex-shrink-0"
                                onError={(e) => { e.target.src = defaultForm.coverImage; }} />
                              <div>
                                <p className="font-bold text-slate-100">{book.title}</p>
                                <p className="text-[11px] text-slate-400">by {book.author}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 font-mono text-slate-300">{book.ISBN}</td>
                          <td className="p-4 text-slate-300">{book.category}</td>
                          <td className="p-4 text-slate-400">
                            Shelf {book.shelfNumber} · Rack {book.rackNumber}
                          </td>
                          <td className="p-4">
                            {book.availableCopies > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                <FiCheckCircle className="w-3 h-3" /> {book.availableCopies}/{book.totalCopies}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                                <FiXCircle className="w-3 h-3" /> Out of Stock
                              </span>
                            )}
                          </td>
                          {isAdminOrLibrarian && (
                            <td className="p-4">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleOpenEditModal(book)}
                                  className="p-1.5 rounded-lg bg-slate-800 text-orange-400 hover:text-orange-300">
                                  <FiEdit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDeleteBook(book._id, book.title)}
                                  className="p-1.5 rounded-lg bg-slate-800 text-rose-400 hover:text-rose-300">
                                  <FiTrash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </>
      )}

      {/* ══════════ GOOGLE BOOKS TAB ══════════ */}
      {activeTab === 'google' && (
        <div className="space-y-5">
          {/* Search Panel */}
          <div className="glass-panel p-5 rounded-3xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/20 to-slate-900/60">
            <div className="flex items-center gap-2 mb-3">
              <FiGlobe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
                Google Books API — Live Search
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold ml-auto">
                Powered by Google Books
              </span>
            </div>

            {/* Role info banner */}
            {!authLoading && (
              <div className={`mb-3 p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                isAdminOrLibrarian
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-300'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-300'
              }`}>
                {isAdminOrLibrarian ? (
                  <><FiCheckCircle className="w-4 h-4 flex-shrink-0" />
                  Browse external catalog records for reference while keeping library additions fully managed here.</>
                ) : (
                  <><FiAlertCircle className="w-4 h-4 flex-shrink-0" />
                  {user ? 'Only Admins and Librarians can import books.' : 'Log in as Admin or Librarian to import books.'}</>
                )}
              </div>
            )}

            <form onSubmit={handleGoogleSearch} className="flex gap-3">
              <div className="relative flex-1">
                <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <input type="text" placeholder="Search: 'machine learning', 'calculus', author name, ISBN…"
                  value={googleSearch} onChange={(e) => setGoogleSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500" />
              </div>
              <button type="submit" disabled={googleLoading}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-60 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition-all">
                {googleLoading ? <><FiRefreshCw className="w-4 h-4 animate-spin" /> Searching…</> : <><FiSearch className="w-4 h-4" /> Search</>}
              </button>
            </form>

            {/* Quick Searches */}
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[10px] text-slate-500 font-semibold self-center">Quick:</span>
              {QUICK_SEARCHES.map((q) => (
                <button key={q} type="button"
                  onClick={() => { setGoogleSearch(q); fetchGoogleBooks(q); }}
                  className="px-3 py-1 rounded-lg text-[11px] font-semibold bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Success / Error banners */}
          {importedSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 flex-shrink-0" /> {importedSuccess}
              <button onClick={() => setImportedSuccess('')} className="ml-auto text-emerald-400">✕</button>
            </div>
          )}
          {importedError && (
            <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-bold flex items-center gap-2">
              <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> {importedError}
              <button onClick={() => setImportedError('')} className="ml-auto text-rose-400">✕</button>
            </div>
          )}

          {/* Results */}
          {googleLoading ? (
            <LoadingSpinner text="Fetching from Google Books API…" />
          ) : googleError ? (
            <div className="p-6 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-1">Search Error</p>
                <p className="text-slate-400">{googleError}</p>
                <button onClick={() => fetchGoogleBooks('computer science engineering')}
                  className="mt-3 px-4 py-2 rounded-xl bg-amber-600/20 text-amber-300 text-xs font-bold border border-amber-500/30 hover:bg-amber-600/30">
                  Try Default Search
                </button>
              </div>
            </div>
          ) : googleBooks.length === 0 ? (
            <EmptyState icon={FiGlobe} title="Search Google Books to explore titles"
              message="Type any book name, author, or subject in the search box above. Results come directly from the Google Books database." />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  Found <span className="font-bold text-emerald-400">{googleBooks.length}</span> books from Google Books
                </p>
                <button onClick={() => fetchGoogleBooks(googleSearch || 'computer science')}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5">
                  <FiRefreshCw className="w-3.5 h-3.5" /> Refresh
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {googleBooks.map((book, idx) => {
                  const isImported = importedISBNs.has(book.ISBN);
                  const isImporting = importingISBN === book.ISBN;
                  return (
                    <div key={`${book.ISBN}-${idx}`}
                      className="glass-card rounded-2xl overflow-hidden flex flex-col border border-slate-800 hover:border-emerald-500/40 group transition-all duration-200">
                      {/* Cover */}
                      <div className="relative h-52 bg-slate-950 overflow-hidden flex items-center justify-center">
                        <img src={book.coverImage} alt={book.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-90 group-hover:opacity-100"
                          onError={(e) => { e.target.onerror = null; e.target.src = defaultForm.coverImage; }} />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />

                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900/80 text-slate-300 backdrop-blur-md border border-slate-700 max-w-[70%] truncate">
                            {book.category}
                          </span>
                          <span className="px-2 py-1 rounded-lg text-[10px] font-bold bg-emerald-500/20 text-emerald-400 backdrop-blur-md border border-emerald-500/30 flex items-center gap-1">
                            <FiGlobe className="w-2.5 h-2.5" /> Google
                          </span>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-bold text-slate-100 text-sm line-clamp-2 leading-tight">{book.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 line-clamp-1">by {book.author}</p>
                        <p className="text-[11px] text-slate-500 mt-2 font-mono">ISBN: {book.ISBN}</p>
                        <p className="text-[11px] text-slate-500">{book.publisher} · {book.publicationYear}</p>
                        {book.pageCount > 0 && (
                          <p className="text-[11px] text-slate-500">{book.pageCount} pages</p>
                        )}
                        {book.description && (
                          <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed flex-1">
                            {book.description}
                          </p>
                        )}

                        {/* Action Buttons */}
                        <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                          {isImported ? (
                            <span className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                              <FiCheckCircle className="w-3.5 h-3.5" /> Already in Library
                            </span>
                          ) : (
                            <a href={book.previewLink || `https://books.google.com/books?isbn=${book.ISBN}`}
                              target="_blank" rel="noopener noreferrer"
                              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600/15 text-emerald-300 text-xs font-bold border border-emerald-500/30 hover:bg-emerald-600/20">
                              View on Google Books <FiExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* ══════════ ADD / EDIT MODAL ══════════ */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editBookId ? 'Edit Book Details' : 'Add Book to Library'}>
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium flex items-center gap-2">
            <FiAlertCircle className="w-4 h-4 flex-shrink-0" /> {formError}
          </div>
        )}
        <form onSubmit={handleSubmitForm} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className={labelCls}>Title *</label>
              <input required type="text" value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Author(s) *</label>
              <input required type="text" value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>ISBN *</label>
              <input required type="text" value={formData.ISBN}
                onChange={(e) => setFormData({ ...formData, ISBN: e.target.value })} className={`${inputCls} font-mono`} /></div>
            <div><label className={labelCls}>Publisher</label>
              <input type="text" value={formData.publisher}
                onChange={(e) => setFormData({ ...formData, publisher: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Category *</label>
              <input required type="text" value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Department</label>
              <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} className={inputCls}>
                {DEPARTMENTS.filter((d) => d !== 'All').map((d) => <option key={d} value={d}>{d}</option>)}
              </select></div>
            <div><label className={labelCls}>Total Copies *</label>
              <input required type="number" min="1" value={formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, totalCopies: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Available Copies</label>
              <input type="number" min="0" value={formData.availableCopies ?? formData.totalCopies}
                onChange={(e) => setFormData({ ...formData, availableCopies: e.target.value })} className={inputCls} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={labelCls}>Shelf #</label>
                <input type="text" value={formData.shelfNumber}
                  onChange={(e) => setFormData({ ...formData, shelfNumber: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Rack #</label>
                <input type="text" value={formData.rackNumber}
                  onChange={(e) => setFormData({ ...formData, rackNumber: e.target.value })} className={inputCls} /></div>
            </div>
            <div><label className={labelCls}>Format</label>
              <select value={formData.format} onChange={(e) => setFormData({ ...formData, format: e.target.value })} className={inputCls}>
                <option value="PHYSICAL">Physical Only</option>
                <option value="DIGITAL">Digital E-Book Only</option>
                <option value="BOTH">Physical & E-Book</option>
              </select></div>
            <div><label className={labelCls}>Publication Year</label>
              <input type="number" value={formData.publicationYear}
                onChange={(e) => setFormData({ ...formData, publicationYear: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Language</label>
              <input type="text" value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })} className={inputCls} /></div>
            <div className="md:col-span-2"><label className={labelCls}>Cover Image URL</label>
              <input type="text" value={formData.coverImage}
                onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} className={inputCls} /></div>
          </div>
          <div><label className={labelCls}>Description</label>
            <textarea rows="3" value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`${inputCls} resize-none`} /></div>
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:bg-slate-800">Cancel</button>
            <button type="submit" disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white shadow-lg shadow-indigo-600/30">
              {submitting ? 'Saving…' : editBookId ? 'Update Book' : 'Add to Library'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default BooksPage;
