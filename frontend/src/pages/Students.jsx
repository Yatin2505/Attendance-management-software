import React, { useState, useEffect, useMemo } from 'react';
import {
  getStudents, createStudent, updateStudent,
  deleteStudent, importStudents
} from '../services/studentService';
import { getBatches } from '../services/batchService';
import { getStudentReport } from '../services/reportService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Edit2, Trash2, Filter, Users, X,
  GraduationCap, CheckSquare, Square, Inbox, UploadCloud,
  Eye, ChevronDown, AlertTriangle, Download
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '../services/authService';
import StudentProfile from '../components/StudentProfile';
import Pagination from '../components/Pagination';

// ─── Attendance % badge ───────────────────────────────────────────────────────
const PctBadge = ({ pct }) => {
  if (pct === null || pct === undefined) {
    return <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">—</span>;
  }
  const color = pct >= 75
    ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20'
    : pct >= 60
    ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
    : 'bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold border ${color}`}>
      {pct}%
    </span>
  );
};

// ─── Delete confirm modal ─────────────────────────────────────────────────────
const DeleteConfirm = ({ student, onConfirm, onCancel, processing }) => (
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
          <h3 className="text-base font-display font-bold text-slate-900 dark:text-white">Delete Student</h3>
          <p className="text-xs text-slate-400">This action cannot be undone</p>
        </div>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300 mb-5">
        Are you sure you want to delete <strong>{student?.name}</strong>? All attendance records for this student will be orphaned.
      </p>
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={processing}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={processing}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-rose-600 hover:bg-rose-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {processing ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-4 h-4" />}
          Delete
        </button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Students = () => {
  const [students,       setStudents]       = useState([]);
  const [batches,        setBatches]        = useState([]);
  const [attPct,         setAttPct]         = useState({}); // { studentId: pct }
  const [loading,        setLoading]        = useState(true);

  const [searchTerm,     setSearchTerm]     = useState('');
  const [filterBatch,    setFilterBatch]    = useState('');

  // Profile drawer
  const [profileId,      setProfileId]      = useState(null);

  // Pagination
  const PAGE_SIZE = 10;
  const [page, setPage] = useState(1);

  // Modal — add/edit
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [isEditing,      setIsEditing]      = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData,       setFormData]       = useState({ name: '', rollNumber: '', batches: [] });
  const [processing,     setProcessing]     = useState(false);

  // Delete confirm
  const [deleteTarget,   setDeleteTarget]   = useState(null);
  const [deleting,       setDeleting]       = useState(false);

  const [importing,      setImporting]      = useState(false);
  const currentUser = getCurrentUser();

  // ── Load ────────────────────────────────────────────────────────────────────
  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, batchesData] = await Promise.all([getStudents(), getBatches()]);
      setStudents(studentsData);
      setBatches(batchesData);

      // Fetch attendance % for each student (fire-and-forget after render)
      fetchAttendancePct(studentsData);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendancePct = async (studentList) => {
    // Fetch all student reports in parallel (cap at 50 to avoid thundering herd)
    const slice = studentList.slice(0, 50);
    const results = await Promise.allSettled(
      slice.map(s => getStudentReport(s._id).then(d => ({ id: s._id, pct: d.stats?.percentage ?? null })))
    );
    const map = {};
    results.forEach(r => {
      if (r.status === 'fulfilled') map[r.value.id] = r.value.pct;
    });
    setAttPct(map);
  };

  // ── File import ─────────────────────────────────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(ws);

      const formatted = json.map(row => ({
        name:       String(row.Name  || row.name  || ''),
        rollNumber: String(row['Roll Number'] || row.RollNumber || row.rollNumber || row.roll || ''),
        batchId:    filterBatch || null
      }));

      if (!formatted[0]?.name || !formatted[0]?.rollNumber) {
        toast.error("Invalid format. Ensure 'Name' and 'Roll Number' columns exist.");
        e.target.value = null; return;
      }

      const res = await importStudents(formatted);
      toast.success(res.message || 'Students imported successfully');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to parse file');
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  // ── Export template ─────────────────────────────────────────────────────────
  const handleExportTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([['Name', 'Roll Number'], ['Example Student', 'CS-001']]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'student_import_template.xlsx');
  };

  // ── Modal ───────────────────────────────────────────────────────────────────
  const handleOpenModal = (student = null) => {
    if (student) {
      setIsEditing(true);
      setCurrentStudent(student);
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber,
        batches: student.batches ? student.batches.map(b => b._id || b) : []
      });
    } else {
      setIsEditing(false);
      setCurrentStudent(null);
      setFormData({ name: '', rollNumber: '', batches: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', rollNumber: '', batches: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (isEditing) {
        await updateStudent(currentStudent._id, formData);
        toast.success('Student updated');
      } else {
        await createStudent(formData);
        toast.success('Student added');
      }
      handleCloseModal();
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save student');
    } finally {
      setProcessing(false);
    }
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    setDeleting(true);
    try {
      await deleteStudent(deleteTarget._id);
      toast.success('Student deleted');
      setStudents(prev => prev.filter(s => s._id !== deleteTarget._id));
      setDeleteTarget(null);
    } catch {
      toast.error('Failed to delete student');
    } finally {
      setDeleting(false);
    }
  };

  // ── Filter + Paginate ────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = searchTerm.toLowerCase().trim();
    setPage(1); // reset to page 1 when filter changes
    return students.filter(s => {
      const matchesSearch = !q ||
        s.name.toLowerCase().includes(q) ||
        s.rollNumber.toLowerCase().includes(q);
      const matchesBatch = !filterBatch ||
        (s.batches && s.batches.some(b => (b._id || b) === filterBatch));
      return matchesSearch && matchesBatch;
    });
  }, [students, searchTerm, filterBatch]);

  const totalPages = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const pagedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary-500" /> Students
          </h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Import */}
          {currentUser?.role === 'admin' && (
            <>
              <button
                onClick={handleExportTemplate}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                title="Download import template"
              >
                <Download className="w-4 h-4" /> Template
              </button>

              <div className="relative group/import">
                <input
                  type="file" accept=".xlsx,.xls,.csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  disabled={importing}
                />
                <button
                  type="button"
                  disabled={importing}
                  className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-primary-400 hover:text-primary-600 dark:hover:text-primary-400 transition group-hover/import:border-primary-400"
                >
                  {importing
                    ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                    : <UploadCloud className="w-4 h-4" />}
                  Import Excel
                </button>
              </div>
            </>
          )}

          {/* Add student */}
          <button
            id="btn-add-student"
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-500/20 active:scale-95 transition"
          >
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>
      </motion.div>

      {/* ── Filters bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex flex-wrap items-center gap-3"
      >
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            id="student-search"
            type="text"
            placeholder="Search name or roll…"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
          />
        </div>

        {/* Batch filter */}
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <select
            id="student-filter-batch"
            value={filterBatch}
            onChange={e => setFilterBatch(e.target.value)}
            className="pl-9 pr-8 py-2.5 rounded-xl text-sm font-medium bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition appearance-none min-w-[160px]"
          >
            <option value="">All Batches</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
        </div>

        {/* Result count */}
        <span className="text-xs text-slate-400 font-medium ml-auto">
          {filteredStudents.length} of {students.length}
        </span>
      </motion.div>

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="premium-card overflow-hidden flex flex-col flex-1"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <tr className="text-xs font-bold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                <th className="py-3.5 px-5">Student</th>
                <th className="py-3.5 px-4">Roll No.</th>
                <th className="py-3.5 px-4">Batches</th>
                <th className="py-3.5 px-4 text-center">Attendance</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                [...Array(6)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(5)].map((_, j) => (
                      <td key={j} className="py-3.5 px-4">
                        <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" style={{ animationDelay: `${i * 80}ms` }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <Inbox className="w-12 h-12 opacity-40" />
                      <p className="font-semibold text-slate-600 dark:text-slate-300">No students found</p>
                      <p className="text-sm">
                        {searchTerm || filterBatch ? 'Try different filters' : 'Add your first student to get started'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence initial={false}>
                  {pagedStudents.map((student, idx) => {
                    const pct = attPct[student._id];
                    return (
                      <motion.tr
                        key={student._id}
                        layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15, delay: Math.min(idx * 0.02, 0.3) }}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                      >
                        {/* Name + avatar */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm flex-shrink-0">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <button
                              onClick={() => setProfileId(student._id)}
                              className="font-semibold text-slate-800 dark:text-white text-sm hover:text-primary-600 dark:hover:text-primary-400 transition-colors text-left"
                            >
                              {student.name}
                            </button>
                          </div>
                        </td>

                        {/* Roll */}
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-xs text-slate-400 dark:text-slate-500">#{student.rollNumber}</span>
                        </td>

                        {/* Batches */}
                        <td className="py-3.5 px-4">
                          {student.batches?.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {student.batches.slice(0, 2).map((b, i) => (
                                <span key={i} className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-semibold bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20">
                                  {b.name || batches.find(bt => bt._id === (b._id || b))?.name || '…'}
                                </span>
                              ))}
                              {student.batches.length > 2 && (
                                <span className="text-xs text-slate-400 font-medium self-center">+{student.batches.length - 2}</span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 dark:text-slate-600 font-medium">Unassigned</span>
                          )}
                        </td>

                        {/* Attendance % */}
                        <td className="py-3.5 px-4 text-center">
                          <PctBadge pct={pct} />
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-end gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => setProfileId(student._id)}
                              className="p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-500/10 text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                              title="View Profile"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenModal(student)}
                              className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                              title="Edit"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setDeleteTarget(student)}
                              className="p-2 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-500/10 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-5 pb-4">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={PAGE_SIZE}
            totalItems={filteredStudents.length}
          />
        </div>
      </motion.div>


      {/* ── Add/Edit modal ───────────────────────────────────────────────────── */}
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
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
                <h3 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-4 h-4 text-primary-500" /> : <Plus className="w-4 h-4 text-primary-500" />}
                  {isEditing ? 'Edit Student' : 'Add Student'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Name *</label>
                    <input
                      type="text" required placeholder="Full name"
                      value={formData.name}
                      onChange={e => setFormData({ ...formData, name: e.target.value })}
                      disabled={processing}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-1.5">Roll Number *</label>
                    <input
                      type="text" required placeholder="e.g. CS-001"
                      value={formData.rollNumber}
                      onChange={e => setFormData({ ...formData, rollNumber: e.target.value })}
                      disabled={processing}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                    />
                  </div>
                </div>

                {/* Batch assignment */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" /> Assign to Batches
                  </label>
                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
                    {batches.length === 0 ? (
                      <p className="text-xs text-slate-400 py-4 text-center">No batches — create one first</p>
                    ) : batches.map(batch => {
                      const checked = formData.batches.includes(batch._id);
                      return (
                        <label key={batch._id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                            checked
                              ? 'border-primary-400 bg-primary-50 dark:bg-primary-500/10 dark:border-primary-500/50'
                              : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600'
                          }`}
                        >
                          <div className={`transition-colors ${checked ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'}`}>
                            {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold truncate ${checked ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>{batch.name}</p>
                            {batch.timing && <p className="text-xs text-slate-400">{batch.timing}</p>}
                          </div>
                          <input type="checkbox" className="sr-only" checked={checked}
                            onChange={e => setFormData({
                              ...formData,
                              batches: e.target.checked
                                ? [...formData.batches, batch._id]
                                : formData.batches.filter(id => id !== batch._id)
                            })}
                            disabled={processing}
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={handleCloseModal} disabled={processing}
                    className="px-4 py-2.5 rounded-xl text-sm font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                    Cancel
                  </button>
                  <button type="submit" disabled={processing}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition active:scale-95 disabled:opacity-60 flex items-center gap-2 min-w-[120px] justify-center">
                    {processing
                      ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      : (isEditing ? 'Save Changes' : 'Add Student')
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
            student={deleteTarget}
            onConfirm={handleDeleteConfirm}
            onCancel={() => setDeleteTarget(null)}
            processing={deleting}
          />
        )}
      </AnimatePresence>

      {/* ── Student Profile drawer ───────────────────────────────────────────── */}
      <StudentProfile
        studentId={profileId}
        onClose={() => setProfileId(null)}
      />
    </div>
  );
};

export default Students;
