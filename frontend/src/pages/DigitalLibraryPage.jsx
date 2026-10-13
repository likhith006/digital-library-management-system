import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { digitalService } from '../services/digitalService';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import EmptyState from '../components/EmptyState';
import {
  FiFileText,
  FiDownload,
  FiSearch,
  FiPlus,
  FiTrash2,
  FiBookOpen,
  FiFolder,
  FiCheckCircle,
} from 'react-icons/fi';

const CATEGORIES = [
  'All',
  'PDF',
  'STUDY_MATERIAL',
  'NOTES',
  'QUESTION_PAPER',
  'JOURNAL',
  'REFERENCE',
];

const DEPARTMENTS = [
  'All',
  'Computer Science & Engineering',
  'Electronics & Communication',
  'Mechanical Engineering',
  'Civil Engineering',
  'Electrical Engineering',
];

const DigitalLibraryPage = () => {
  const { user } = useAuth();
  const isAdminOrLibrarian = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [department, setDepartment] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    author: '',
    category: 'PDF',
    department: 'Computer Science & Engineering',
    subject: '',
    semester: 'Semester 1',
    description: '',
    fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    fileSize: '4.5 MB',
  });

  const fetchResources = async () => {
    try {
      setLoading(true);
      const params = {};
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (department !== 'All') params.department = department;

      const res = await digitalService.getResources(params);
      if (res.success) {
        setResources(res.data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [search, category, department]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError('');

    try {
      const res = await digitalService.createResource(formData);
      if (res.success) {
        setIsModalOpen(false);
        fetchResources();
      }
    } catch (err) {
      setFormError(err.message || 'Failed to add resource.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to remove this digital resource?')) {
      try {
        await digitalService.deleteResource(id);
        fetchResources();
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const handleDownload = async (resource) => {
    try {
      await digitalService.downloadResource(resource._id);
      window.open(resource.fileUrl, '_blank');
      fetchResources();
    } catch (err) {
      window.open(resource.fileUrl, '_blank');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <FiFileText className="w-6 h-6 text-sky-400" /> Digital E-Library & Academic Resources
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Access, preview, and download semester notes, lecture slides, question papers, and research journals.
          </p>
        </div>

        {isAdminOrLibrarian && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 flex items-center gap-2"
          >
            <FiPlus className="w-4 h-4" /> Add Digital Resource
          </button>
        )}
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-5 rounded-3xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by Title, Subject, Author, or Keywords..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {CATEGORIES.map(cat => (
            <option key={cat} value={cat}>Format: {cat.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
        >
          {DEPARTMENTS.map(dept => (
            <option key={dept} value={dept}>Dept: {dept}</option>
          ))}
        </select>
      </div>

      {/* Resource Cards Grid */}
      {loading ? (
        <LoadingSpinner text="Searching digital repository..." />
      ) : resources.length === 0 ? (
        <EmptyState icon={FiFileText} title="No digital materials found" message="Try searching for another subject or department." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((item) => (
            <div key={item._id} className="glass-card rounded-2xl p-5 border border-slate-800 flex flex-col justify-between hover:border-sky-500/40 group">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">
                    {item.category.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-400 font-medium">{item.fileSize}</span>
                </div>

                <h4 className="font-bold text-slate-100 text-sm group-hover:text-sky-300 transition-colors line-clamp-2">
                  {item.title}
                </h4>
                <p className="text-xs text-slate-400 mt-1">Author: {item.author}</p>

                <p className="text-xs text-slate-300 mt-3 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>

                <div className="mt-4 pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Subject: <strong className="text-slate-200">{item.subject}</strong></span>
                  <span>Semester: <strong className="text-slate-200">{item.semester}</strong></span>
                  <span>Dept: <strong className="text-slate-200">{item.department}</strong></span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  📥 {item.downloadsCount} downloads
                </span>

                <div className="flex items-center gap-2">
                  {isAdminOrLibrarian && (
                    <button
                      onClick={() => handleDelete(item._id)}
                      className="p-2 rounded-xl bg-slate-900 text-rose-400 hover:text-rose-300 border border-slate-800"
                      title="Delete Resource"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDownload(item)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs shadow-md shadow-sky-600/30 flex items-center gap-1.5"
                  >
                    <FiDownload className="w-3.5 h-3.5" /> Download PDF
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Digital Resource Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Upload Digital Study Material">
        {formError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Resource Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Data Structures & Algorithms Solved Papers"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Category *</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="PDF">PDF E-Book</option>
                <option value="STUDY_MATERIAL">Study Material</option>
                <option value="NOTES">Lecture Notes</option>
                <option value="QUESTION_PAPER">Question Paper</option>
                <option value="JOURNAL">Research Journal</option>
                <option value="REFERENCE">Reference Guide</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department *</label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                {DEPARTMENTS.filter(d => d !== 'All').map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Subject</label>
              <input
                type="text"
                placeholder="e.g. Data Structures"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Semester</label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
              >
                <option value="Semester 1">Semester 1</option>
                <option value="Semester 2">Semester 2</option>
                <option value="Semester 3">Semester 3</option>
                <option value="Semester 4">Semester 4</option>
                <option value="Semester 5">Semester 5</option>
                <option value="Semester 6">Semester 6</option>
                <option value="Semester 7">Semester 7</option>
                <option value="Semester 8">Semester 8</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">File URL / Download Link *</label>
            <input
              type="text"
              required
              value={formData.fileUrl}
              onChange={(e) => setFormData({ ...formData, fileUrl: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-2.5 text-white focus:outline-none focus:border-indigo-500"
            />
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
              {submitting ? 'Uploading...' : 'Save Digital Resource'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default DigitalLibraryPage;
