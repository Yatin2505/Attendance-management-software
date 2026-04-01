import React, { useState, useEffect, useMemo } from 'react';
import {
  getBatches, createBatch, updateBatch, deleteBatch,
  assignStudentToBatch, removeStudentFromBatch, getBatchStats
} from '../services/batchService';
import { getStudents } from '../services/studentService';
import { getCurrentUser } from '../services/authService';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, ChevronDown, Clock, Users, X,
  UserMinus, UserPlus, FolderOpen, GraduationCap, AlertTriangle,
  TrendingUp, Activity, CheckCircle
} from 'lucide-react';

// ─── Attendance % badge ───────────────────────────────────────────────────────
const PctBadge = ({ pct, small = false }) => {
  if (pct === null || pct === undefined) {
    return <span className={`${small ? 'text-xs' : 'text-sm'} text-slate-300 dark:text-slate-600 font-medium`}>No data</span>;
  }
  const color = pct >= 75
    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
    : pct >= 60
    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg font-bold border ${small ? 'text-xs' : 'text-sm'} ${color}`}>
      <TrendingUp className={small ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> {pct}%
    </span>
  );
};

// ─── Delete confirm modal ─────────────────────────────────────────────────────
const DeleteConfirm = ({ name, onConfirm, onCancel, processing }) => (
  <motion.div
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
  >
    <motion.div
      initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 max-w-sm w-full p-6"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-500/10 flex items-center justify-center flex-shrink-0">
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        </div>
        <div>
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">Delete Batch</h3>
          <p className="text-xs text-slate-400">Students will be unassigned</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
        Are you sure you want to delete <strong className="text-slate-900 dark:text-white">"{name}"</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={processing}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={processing}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
          {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Batches = () => {
  const [batches,       setBatches]       = useState([]);
  const [allStudents,   setAllStudents]   = useState([]);
  const [teachers,      setTeachers]      = useState([]);
  const [batchStats,    setBatchStats]    = useState({}); // { batchId: { pct, total, present } }
  const [loading,       setLoading]       = useState(true);
  const [searchQuery,   setSearchQuery]   = useState('');
  const [expandedBatch, setExpandedBatch] = useState(null);

  // Modal
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [currentBatch,   setCurrentBatch]   = useState(null);
  const [formData,       setFormData]       = useState({ name: '', timing: '', teacherId: '' });
  const [processing,     setProcessing]     = useState(false);

  // Delete confirm
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  // Student assignment
  const [selStudent,     setSelStudent]     = useState('');

  const currentUser = getCurrentUser();
  const isAdmin = currentUser?.role === 'admin';

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const promises = [getBatches(), getStudents()];
      if (isAdmin) promises.push(userService.getTeachers());
      const [batchesData, studentsData, teachersData] = await Promise.all(promises);
      setBatches(batchesData);
      setAllStudents(studentsData);
      if (teachersData) setTeachers(teachersData);

      // Fetch stats for all batches in background
      fetchAllStats(batchesData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStats = async (batchList) => {
    const results = await Promise.allSettled(
      batchList.map(b => getBatchStats(b._id).then(s => ({ id: b._id, ...s })))
    );
    const map = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') map[r.value.id] = r.value;
    });
    setBatchStats(map);
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredBatches = useMemo(() => {
    if (!searchQuery.trim()) return batches;
    const q = searchQuery.toLowerCase();
    return batches.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (b.timing ?? '').toLowerCase().includes(q) ||
      (b.teacherId?.name ?? '').toLowerCase().includes(q)
    );
  }, [batches, searchQuery]);

  // ── Modal helpers ────────────────────────────────────────────────────────────
  const handleOpenModal = (batch = null) => {
    if (batch) {
      setIsEditing(true);
      setCurrentBatch(batch);
      setFormData({ name: batch.name, timing: batch.timing ?? '', teacherId: batch.teacherId?._id || batch.teacherId || '' });
    } else {
      setIsEditing(false);
      setCurrentBatch(null);
      setFormData({ name: '', timing: '', teacherId: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (isEditing) {
        await updateBatch(currentBatch._id, formData);
        toast.success('Batch updated');
      } else {
        await createBatch(formData);
        toast.success('Batch created');
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save batch');
    } finally {
      setProcessing(false);
    }
  };

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteBatch(deleteTarget._id);
      toast.success('Batch deleted');
      setBatches(prev => prev.filter(b => b._id !== deleteTarget._id));
      if (expandedBatch === deleteTarget._id) setExpandedBatch(null);
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete batch');
    } finally {
      setDeleting(false);
    }
  };

  // ── Student assignment ───────────────────────────────────────────────────────
  const handleAssignStudent = async (batchId) => {
    if (!selStudent) return;
    setProcessing(true);
    try {
      await assignStudentToBatch(batchId, selStudent);
      toast.success('Student enrolled');
      setSelStudent('');
      fetchData();
    } catch {
      toast.error('Failed to enroll student');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveStudent = async (batchId, studentId, studentName) => {
    try {
      await removeStudentFromBatch(batchId, studentId);
      toast.success(`${studentName} removed from batch`);
      fetchData();
    } catch {
      toast.error('Failed to remove student');
    }
  };

  const getAvailableStudents = (batchStudents) => {
    if (!batchStudents?.length) return allStudents;
    const ids = new Set(batchStudents.map(s => s._id));
    return allStudents.filter(s => !ids.has(s._id));
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Batches</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {batches.length} cohort{batches.length !== 1 ? 's' : ''} · manage enrollment and attendance
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="batch-search"
              type="text"
              placeholder="Search batches…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition w-48"
            />
          </div>
          <button
            id="btn-create-batch"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20 active:scale-95 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Create Batch
          </button>
        </div>
      </motion.div>

      {/* ── Batch list ───────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : filteredBatches.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <FolderOpen className="w-12 h-12 opacity-30" />
          <p className="font-semibold text-slate-600 dark:text-slate-300">
            {searchQuery ? 'No batches match your search' : 'No batches yet'}
          </p>
          {!searchQuery && (
            <button onClick={() => handleOpenModal()}
              className="text-sm font-bold text-primary-500 hover:text-primary-600 transition">
              Create your first batch →
            </button>
          )}
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {filteredBatches.map((batch, idx) => {
            const stats = batchStats[batch._id];
            const isOpen = expandedBatch === batch._id;
            const teacherName = batch.teacherId?.name ?? null;
            const studentCount = batch.students?.length ?? 0;

            return (
              <motion.div
                key={batch._id} layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.2, delay: Math.min(idx * 0.04, 0.3) }}
                className="premium-card overflow-hidden"
              >
                {/* ── Batch header row ──────────────────────────────────── */}
                <div
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                  onClick={() => { setExpandedBatch(isOpen ? null : batch._id); setSelStudent(''); }}
                >
                  {/* Left: name + meta */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center flex-shrink-0">
                      <FolderOpen className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-base font-display font-bold text-slate-900 dark:text-white truncate">{batch.name}</h2>
                      <div className="flex flex-wrap items-center gap-3 mt-0.5">
                        {batch.timing && (
                          <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                            <Clock className="w-3 h-3" /> {batch.timing}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-xs text-slate-400 font-medium">
                          <Users className="w-3 h-3" /> {studentCount} student{studentCount !== 1 ? 's' : ''}
                        </span>
                        {teacherName && (
                          <span className="flex items-center gap-1 text-xs font-semibold text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-lg border border-violet-100 dark:border-violet-500/20">
                            <GraduationCap className="w-3 h-3" /> {teacherName}
                          </span>
                        )}
                        {!teacherName && isAdmin && (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: attendance % + actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={e => e.stopPropagation()}>
                    <PctBadge pct={stats?.pct} small />

                    {isAdmin && (
                      <>
                        <button
                          onClick={() => handleOpenModal(batch)}
                          className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                          title="Edit batch"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(batch)}
                          className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                          title="Delete batch"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    <div className={`p-1.5 rounded-lg transition-all ${isOpen ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-500' : 'text-slate-300 dark:text-slate-600'}`}>
                      <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* ── Expanded student roster ───────────────────────────── */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/30 p-5 space-y-4">

                        {/* Stats bar */}
                        {stats && stats.total > 0 && (
                          <div className="flex flex-wrap gap-3 p-3 bg-white dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center gap-2 text-xs font-semibold">
                              <Activity className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-slate-500">Sessions:</span>
                              <span className="text-slate-800 dark:text-white">{stats.total}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-semibold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                              <span className="text-slate-500">Present:</span>
                              <span className="text-emerald-600 dark:text-emerald-400">{stats.present}</span>
                            </div>
                            <PctBadge pct={stats.pct} small />
                          </div>
                        )}

                        {/* Enroll student row */}
                        <div className="flex items-center gap-3">
                          <select
                            value={selStudent}
                            onChange={e => setSelStudent(e.target.value)}
                            disabled={processing}
                            className="flex-1 px-3.5 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                          >
                            <option value="">Select student to enroll…</option>
                            {getAvailableStudents(batch.students).map(s => (
                              <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
                            ))}
                          </select>
                          <button
                            onClick={() => handleAssignStudent(batch._id)}
                            disabled={!selStudent || processing}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-50 active:scale-95 whitespace-nowrap"
                          >
                            <UserPlus className="w-4 h-4" />
                            {processing ? 'Adding…' : 'Enroll'}
                          </button>
                        </div>

                        {/* Students table */}
                        {(!batch.students || batch.students.length === 0) ? (
                          <div className="flex flex-col items-center justify-center py-8 gap-2 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl text-slate-400">
                            <Users className="w-8 h-8 opacity-40" />
                            <p className="text-sm font-medium">No students enrolled</p>
                          </div>
                        ) : (
                          <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                            <table className="w-full text-left">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-700 text-xs font-bold uppercase tracking-wide text-slate-400 bg-slate-50 dark:bg-slate-800/70">
                                  <th className="py-3 px-4">#</th>
                                  <th className="py-3 px-4">Student</th>
                                  <th className="py-3 px-4">Roll No.</th>
                                  <th className="py-3 px-4 text-right">Action</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                {batch.students.map((student, sIdx) => (
                                  <tr key={student._id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group/row">
                                    <td className="py-3 px-4 text-xs text-slate-400">{sIdx + 1}</td>
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2.5">
                                        <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                                          {student.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span className="text-sm font-semibold text-slate-800 dark:text-white">{student.name}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-4 font-mono text-xs text-slate-400">#{student.rollNumber}</td>
                                    <td className="py-3 px-4 text-right">
                                      <button
                                        onClick={() => handleRemoveStudent(batch._id, student._id, student.name)}
                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition opacity-0 group-hover/row:opacity-100"
                                      >
                                        <UserMinus className="w-3.5 h-3.5" /> Remove
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      )}

      {/* ── Create / Edit modal ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-4 h-4 text-primary-500" /> : <Plus className="w-4 h-4 text-primary-500" />}
                  {isEditing ? 'Edit Batch' : 'Create Batch'}
                </h3>
                <button onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Batch Name *</label>
                  <input
                    type="text" required placeholder="e.g. Morning Batch A"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={processing}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">
                    Timing <span className="text-slate-400 font-normal normal-case">(optional)</span>
                  </label>
                  <input
                    type="text" placeholder="e.g. 9:00 AM – 12:00 PM"
                    value={formData.timing}
                    onChange={e => setFormData({ ...formData, timing: e.target.value })}
                    disabled={processing}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                  />
                </div>

                {isAdmin && (
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                      <GraduationCap className="w-3.5 h-3.5" /> Assign Teacher
                    </label>
                    <select
                      value={formData.teacherId}
                      onChange={e => setFormData({ ...formData, teacherId: e.target.value })}
                      disabled={processing}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                    >
                      <option value="">— No Teacher Assigned —</option>
                      {teachers.map(t => (
                        <option key={t._id} value={t._id}>{t.name} · {t.email}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={processing}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center gap-2 min-w-[130px] justify-center">
                    {processing
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : (isEditing ? 'Save Changes' : 'Create Batch')
                    }
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Delete confirm ───────────────────────────────────────────────────── */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            name={deleteTarget.name}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            processing={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Batches;
