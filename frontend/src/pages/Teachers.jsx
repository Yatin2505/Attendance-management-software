import React, { useState, useEffect, useMemo } from 'react';
import { userService } from '../services/userService';
import { getBatches, updateBatch } from '../services/batchService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Trash2, X, Shield, Mail, Key,
  GraduationCap, Layers, AlertTriangle, ChevronDown,
  CheckSquare, Square, Edit2, Eye, EyeOff
} from 'lucide-react';

// ─── Delete confirm modal ─────────────────────────────────────────────────────
const DeleteConfirm = ({ teacher, onConfirm, onCancel, processing }) => (
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
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">Remove Teacher</h3>
          <p className="text-xs text-slate-400">They will lose system access immediately</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
        Are you sure you want to remove <strong className="text-slate-900 dark:text-white">{teacher?.name}</strong> from the system?
      </p>
      <div className="flex gap-3">
        <button onClick={onCancel} disabled={processing}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
          Cancel
        </button>
        <button onClick={onConfirm} disabled={processing}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2">
          {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Remove
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Assign Batches modal ──────────────────────────────────────────────────────
const AssignBatchesModal = ({ teacher, allBatches, onClose, onSave }) => {
  // The batches currently assigned to this teacher
  const initial = useMemo(
    () => new Set(allBatches.filter(b => (b.teacherId?._id || b.teacherId) === teacher._id).map(b => b._id)),
    [allBatches, teacher._id]
  );
  const [selected, setSelected] = useState(initial);
  const [saving, setSaving] = useState(false);

  const toggle = (id) => setSelected(prev => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      // For each batch, update teacherId if changed
      const promises = allBatches.map(b => {
        const wasAssigned = initial.has(b._id);
        const isNowSelected = selected.has(b._id);
        if (wasAssigned && !isNowSelected) {
          // un-assign: clear teacherId
          return updateBatch(b._id, { teacherId: null });
        }
        if (!wasAssigned && isNowSelected) {
          // assign to this teacher
          return updateBatch(b._id, { teacherId: teacher._id });
        }
        return Promise.resolve();
      });
      await Promise.all(promises);
      toast.success(`Batches updated for ${teacher.name}`);
      onSave();
      onClose();
    } catch {
      toast.error('Failed to update batch assignments');
    } finally {
      setSaving(false);
    }
  };

  return (
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
          <div>
            <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">Assign Batches</h3>
            <p className="text-xs text-slate-400 mt-0.5">{teacher.name}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {allBatches.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6">No batches created yet.</p>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {allBatches.map(b => {
                const isSelected = selected.has(b._id);
                const currentTeacher = b.teacherId?._id || b.teacherId;
                const takenByOther = currentTeacher && currentTeacher !== teacher._id;
                return (
                  <label
                    key={b._id}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500/50'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300'
                    } ${takenByOther ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className={`transition-colors flex-shrink-0 ${isSelected ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'}`}>
                      {isSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isSelected ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                        {b.name}
                      </p>
                      {b.timing && <p className="text-xs text-slate-400">{b.timing}</p>}
                      {takenByOther && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Assigned to {b.teacherId?.name ?? 'another teacher'}
                        </p>
                      )}
                    </div>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={isSelected}
                      disabled={takenByOther}
                      onChange={() => !takenByOther && toggle(b._id)}
                    />
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button onClick={onClose} disabled={saving}
              className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center">
              {saving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Save Assignments'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ─── Teacher Card ─────────────────────────────────────────────────────────────
const TeacherCard = ({ teacher, assignedBatches, onDelete, onAssignBatches, delay }) => (
  <motion.div
    layout
    initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, scale: 0.97 }}
    transition={{ duration: 0.2, delay }}
    className="premium-card p-5 flex flex-col gap-4"
  >
    {/* Header */}
    <div className="flex items-start justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-100 to-indigo-100 dark:from-violet-500/10 dark:to-indigo-500/10 flex items-center justify-center text-violet-700 dark:text-violet-400 font-bold text-lg flex-shrink-0">
          {teacher.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white">{teacher.name}</h3>
          <span className="text-[10px] font-bold uppercase tracking-widest text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-500/10 px-2 py-0.5 rounded-md border border-violet-100 dark:border-violet-500/20 inline-block mt-0.5">
            Faculty
          </span>
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors flex-shrink-0"
        title="Remove teacher"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>

    {/* Email & Password */}
    <div className="space-y-1">
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
        <Mail className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="truncate">{teacher.email}</span>
      </div>
      {teacher.plainPassword && (
        <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
          <Key className="w-3.5 h-3.5 flex-shrink-0" />
          <code className="px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded font-mono text-[10px] text-primary-600 dark:text-primary-400">
            {teacher.plainPassword}
          </code>
        </div>
      )}
    </div>

    {/* Assigned batches */}
    <div className="flex-1">
      {assignedBatches.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {assignedBatches.map(b => (
            <span key={b._id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20">
              <Layers className="w-2.5 h-2.5" /> {b.name}
            </span>
          ))}
        </div>
      ) : (
        <p className="text-xs text-slate-300 dark:text-slate-600 font-medium">No batches assigned</p>
      )}
    </div>

    {/* Assign batches CTA */}
    <button
      onClick={onAssignBatches}
      className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-primary-400 hover:text-primary-600 dark:hover:border-primary-500/50 dark:hover:text-primary-400 transition-all"
    >
      <Layers className="w-3.5 h-3.5" />
      {assignedBatches.length > 0 ? 'Manage Batches' : 'Assign Batches'}
    </button>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Teachers = () => {
  const [teachers,     setTeachers]     = useState([]);
  const [batches,      setBatches]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [searchQuery,  setSearchQuery]  = useState('');

  // Add teacher modal
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [formData,     setFormData]     = useState({ name: '', email: '', password: '' });
  const [showPwd,      setShowPwd]      = useState(false);
  const [processing,   setProcessing]   = useState(false);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting,     setDeleting]     = useState(false);

  // Assign batches modal
  const [assignTarget, setAssignTarget] = useState(null);

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [teachersData, batchesData] = await Promise.all([
        userService.getTeachers(),
        getBatches()
      ]);
      setTeachers(teachersData);
      setBatches(batchesData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // ── Filters ─────────────────────────────────────────────────────────────────
  const filteredTeachers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return teachers;
    return teachers.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.email.toLowerCase().includes(q)
    );
  }, [teachers, searchQuery]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const getAssignedBatches = (teacherId) =>
    batches.filter(b => (b.teacherId?._id || b.teacherId) === teacherId);

  // ── Create teacher ───────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await userService.createTeacher(formData);
      toast.success(`Teacher account created for ${formData.name}`);
      setFormData({ name: '', email: '', password: '' });
      setIsModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create teacher');
    } finally {
      setProcessing(false);
    }
  };

  // ── Delete teacher ────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await userService.deleteTeacher(deleteTarget._id);
      toast.success('Teacher removed');
      setTeachers(prev => prev.filter(t => t._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove teacher');
    } finally {
      setDeleting(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-violet-500" /> Faculty
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {teachers.length} teacher{teachers.length !== 1 ? 's' : ''} · manage accounts and batch assignments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="teacher-search"
              type="text"
              placeholder="Search teachers…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition w-44"
            />
          </div>
          <button
            id="btn-add-teacher"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white shadow-sm shadow-violet-500/20 active:scale-95 transition whitespace-nowrap"
          >
            <Plus className="w-4 h-4" /> Add Faculty
          </button>
        </div>
      </motion.div>

      {/* ── Teacher cards grid ───────────────────────────────────────────────── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
          ))}
        </div>
      ) : filteredTeachers.length === 0 ? (
        <div className="premium-card flex flex-col items-center justify-center py-20 gap-3">
          <Shield className="w-12 h-12 text-slate-300 dark:text-slate-700" />
          <p className="font-semibold text-slate-600 dark:text-slate-400">
            {searchQuery ? 'No teachers match your search' : 'No teachers yet'}
          </p>
          {!searchQuery && (
            <button onClick={() => setIsModalOpen(true)}
              className="text-sm font-bold text-violet-500 hover:text-violet-600 transition">
              Add your first teacher →
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence initial={false}>
            {filteredTeachers.map((teacher, idx) => (
              <TeacherCard
                key={teacher._id}
                teacher={teacher}
                assignedBatches={getAssignedBatches(teacher._id)}
                onDelete={() => setDeleteTarget(teacher)}
                onAssignBatches={() => setAssignTarget(teacher)}
                delay={Math.min(idx * 0.04, 0.3)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* ── Batch assignments summary ────────────────────────────────────────── */}
      {!loading && batches.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="premium-card p-5"
        >
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary-500" /> Batch Assignment Overview
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[480px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wide text-slate-400">
                  <th className="py-2.5 px-3">Batch</th>
                  <th className="py-2.5 px-3">Timing</th>
                  <th className="py-2.5 px-3">Assigned To</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                {batches.map(b => {
                  const teacher = teachers.find(t => t._id === (b.teacherId?._id || b.teacherId));
                  return (
                    <tr key={b._id} className="text-sm hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-white">{b.name}</td>
                      <td className="py-2.5 px-3 text-slate-400 text-xs">{b.timing ?? '—'}</td>
                      <td className="py-2.5 px-3">
                        {teacher ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-violet-600 dark:text-violet-400">
                            <div className="w-5 h-5 rounded-md bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center text-[10px] font-bold">
                              {teacher.name.charAt(0)}
                            </div>
                            {teacher.name}
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">Unassigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* ── Add teacher modal ────────────────────────────────────────────────── */}
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
                  <Shield className="w-4 h-4 text-violet-500" /> Add Faculty
                </h3>
                <button onClick={() => setIsModalOpen(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Full Name *</label>
                  <input
                    type="text" required placeholder="e.g. Rahul Sharma" autoComplete="off"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    disabled={processing}
                    className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Email *</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type="email" required placeholder="teacher@institute.com" autoComplete="off"
                      value={formData.email}
                      onChange={e => setFormData({ ...formData, email: e.target.value })}
                      disabled={processing}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Password *</label>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                    <input
                      type={showPwd ? 'text' : 'password'} required placeholder="Min. 6 characters" autoComplete="new-password"
                      value={formData.password}
                      onChange={e => setFormData({ ...formData, password: e.target.value })}
                      disabled={processing}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/40 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
                    >
                      {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setIsModalOpen(false)} disabled={processing}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-violet-600 hover:bg-violet-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center gap-2 min-w-[140px] justify-center">
                    {processing
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : 'Create Account'
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
            teacher={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            processing={deleting}
          />
        )}
      </AnimatePresence>

      {/* ── Assign batches modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {assignTarget && (
          <AssignBatchesModal
            teacher={assignTarget}
            allBatches={batches}
            onClose={() => setAssignTarget(null)}
            onSave={fetchAll}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Teachers;
