import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Search, Filter, CheckCircle, XCircle, Clock, 
  Plus, Inbox, ArrowRight, User, Layers, Info, Trash2, 
  Check, X, FileText, AlertTriangle
} from 'lucide-react';
import { getLeaveRequests, updateLeaveStatus, createLeaveRequest, deleteLeaveRequest } from '../services/leaveService';
import { getStudents } from '../services/studentService';
import { getBatches } from '../services/batchService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/ConfirmModal';

// ─── Constants ────────────────────────────────────────────────────────────────
const LEAVE_TYPES = ['Sick Leave', 'Personal Leave', 'Holiday', 'Other'];
const STATUS_COLORS = {
  pending: 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10 border-amber-100 dark:border-amber-500/20',
  approved: 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20',
  rejected: 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10 border-rose-100 dark:border-rose-500/20'
};

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

// ─── Main Component ───────────────────────────────────────────────────────────
const LeaveManagement = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  // Requests state
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all'); // all, pending, approved, rejected
  
  // Resources for the "Apply Leave" modal
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loadingResources, setLoadingResources] = useState(false);

  // Modal / Form state
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    studentId: '',
    batchId: '',
    startDate: '',
    endDate: '',
    type: 'Sick Leave',
    reason: ''
  });

  // Action modals
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionType, setActionType] = useState(''); // approved or rejected
  const [deleteTarget, setDeleteTarget] = useState(null);

  // ── Load Requests ──────────────────────────────────────────────────────────
  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await getLeaveRequests();
      setRequests(data);
    } catch {
      toast.error('Failed to load leave requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  // ── Load resources for modal ──────────────────────────────────────────────
  const openApplyModal = async () => {
    setIsApplyModalOpen(true);
    setLoadingResources(true);
    try {
      const [sData, bData] = await Promise.all([getStudents(), getBatches()]);
      setStudents(sData);
      setBatches(bData);
    } catch {
      toast.error('Failed to load student/batch data');
    } finally {
      setLoadingResources(false);
    }
  };

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLeaveRequest(formData);
      toast.success('Leave request submitted successfully');
      setIsApplyModalOpen(false);
      setFormData({ studentId: '', batchId: '', startDate: '', endDate: '', type: 'Sick Leave', reason: '' });
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit leave');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    setSubmitting(true);
    try {
      await updateLeaveStatus(selectedRequest._id, actionType, actionNotes);
      toast.success(`Leave request ${actionType}`);
      setIsActionModalOpen(false);
      setSelectedRequest(null);
      setActionNotes('');
      loadRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to process request');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!deleteTarget) return;
    try {
      await deleteLeaveRequest(deleteTarget._id);
      toast.success('Request deleted');
      setDeleteTarget(null);
      loadRequests();
    } catch {
      toast.error('Failed to delete request');
    }
  };

  // ── Filtered Requests ──────────────────────────────────────────────────────
  const filteredRequests = useMemo(() => {
    if (activeFilter === 'all') return requests;
    return requests.filter(r => r.status === activeFilter);
  }, [requests, activeFilter]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Leave Management</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Review, approve, and track student leave applications</p>
        </div>
        <button 
          onClick={openApplyModal}
          className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-primary-600 hover:bg-primary-700 text-white font-bold transition-all shadow-lg shadow-primary-500/20 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Apply for Student
        </button>
      </div>

      {/* Tabs / Filters */}
      <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl w-fit">
        {['all', 'pending', 'approved', 'rejected'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveFilter(tab)}
            className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-wide transition-all ${
              activeFilter === tab 
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' 
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Request Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-56 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="premium-card py-20 flex flex-col items-center justify-center text-center">
          <Inbox className="w-16 h-16 text-slate-200 dark:text-slate-700 mb-4" />
          <h3 className="text-xl font-bold text-slate-400">No requests found</h3>
          <p className="text-sm text-slate-400 mt-2 max-w-xs">There are no leave requests matching your current filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRequests.map((req, idx) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              key={req._id}
              className="premium-card p-5 group relative overflow-hidden"
            >
              {/* Status Header */}
              <div className="flex items-center justify-between mb-4">
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${STATUS_COLORS[req.status]}`}>
                  {req.status}
                </span>
                <p className="text-xs font-mono text-slate-400">ID: {req._id.slice(-6).toUpperCase()}</p>
              </div>

              {/* Student Info */}
              <div className="flex items-center gap-3 mb-5">
                <div className="w-11 h-11 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-primary-700 font-bold">
                  {req.studentId?.name?.charAt(0).toUpperCase() || '?'}
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-bold text-slate-800 dark:text-white truncate">{req.studentId?.name || 'Deleted Student'}</h3>
                  <p className="text-xs text-slate-400 font-medium">#{req.studentId?.rollNumber} · {req.batchId?.name}</p>
                </div>
              </div>

              {/* Type and Duration */}
              <div className="grid grid-cols-2 gap-4 mb-5 border-y border-slate-100 dark:border-slate-800/60 py-3.5">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Type</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{req.type}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Duration</p>
                  <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    {fmtDate(req.startDate)}
                    {req.startDate !== req.endDate && <span className="block text-[10px] text-slate-400 opacity-80">to {fmtDate(req.endDate)}</span>}
                  </p>
                </div>
              </div>

              {/* Reason */}
              <div className="mb-6">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Reason
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">
                  "{req.reason}"
                </p>
              </div>

              {/* Footer Actions */}
              <div className="mt-auto flex items-center gap-2">
                {req.status === 'pending' ? (
                  <>
                    <button 
                      onClick={() => { setSelectedRequest(req); setActionType('approved'); setIsActionModalOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-500/20 active:scale-95"
                    >
                      <Check className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button 
                      onClick={() => { setSelectedRequest(req); setActionType('rejected'); setIsActionModalOpen(true); }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-xs font-bold transition-all border border-rose-100 dark:border-rose-500/20 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95"
                    >
                      <X className="w-3.5 h-3.5" /> Reject
                    </button>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 mb-1">
                      <CheckCircle className="w-3 h-3" /> Processed by {req.processedBy?.name}
                    </div>
                    {isAdmin && (
                      <button 
                        onClick={() => setDeleteTarget(req)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all text-[10px] font-bold border border-transparent hover:border-rose-100"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove History
                      </button>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Apply Leave Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isApplyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className="p-6 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center gap-3">
                  <Calendar className="text-primary-500" /> Apply Student Leave
                </h2>
                <button onClick={() => setIsApplyModalOpen(false)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleApplyLeave} className="p-6 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Batch Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Batch</label>
                    <select
                      required
                      value={formData.batchId}
                      onChange={(e) => setFormData({...formData, batchId: e.target.value, studentId: ''})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:border-primary-500 focus:outline-none transition-all"
                    >
                      <option value="">Select Batch</option>
                      {batches.filter(b => isAdmin || b.teacherId === user._id).map(b => (
                        <option key={b._id} value={b._id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                  {/* Student Select */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Student</label>
                    <select
                      required
                      disabled={!formData.batchId}
                      value={formData.studentId}
                      onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:border-primary-500 focus:outline-none transition-all disabled:opacity-50"
                    >
                      <option value="">{formData.batchId ? 'Select Student' : 'Select Batch First'}</option>
                      {students.filter(s => s.batches.some(b => (b._id || b) === formData.batchId)).map(s => (
                        <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Start Date</label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:border-primary-500 focus:outline-none transition-all"
                    />
                  </div>
                  {/* End Date */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">End Date</label>
                    <input
                      type="date"
                      required
                      min={formData.startDate}
                      value={formData.endDate}
                      onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:border-primary-500 focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Leave Type */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Leave Type</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {LEAVE_TYPES.map(type => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setFormData({...formData, type})}
                        className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                          formData.type === type 
                            ? 'bg-primary-500 text-white border-primary-500' 
                            : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-100 dark:border-slate-800 hover:border-primary-200'
                        }`}
                      >
                        {type.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Reason */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Reason</label>
                  <textarea
                    required
                    placeholder="Short description of why leave is needed..."
                    rows={3}
                    value={formData.reason}
                    onChange={(e) => setFormData({...formData, reason: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:border-primary-500 focus:outline-none transition-all resize-none"
                  />
                </div>

                <div className="pt-2">
                  <button
                    disabled={submitting}
                    className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-2xl shadow-xl shadow-primary-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {submitting ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle className="w-5 h-5" />}
                    {submitting ? 'Submitting...' : 'Submit Application'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Action Modal (Approve/Reject) ────────────────────────────────────────── */}
      <AnimatePresence>
        {isActionModalOpen && selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
            >
              <div className={`p-6 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 ${
                actionType === 'approved' ? 'bg-emerald-50 dark:bg-emerald-500/5' : 'bg-rose-50 dark:bg-rose-500/5'
              }`}>
                {actionType === 'approved' ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600">
                    <CheckCircle className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-500/20 flex items-center justify-center text-rose-600">
                    <AlertTriangle className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-display font-bold text-slate-800 dark:text-white capitalize">{actionType} Leave Request</h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedRequest.studentId?.name}</p>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Dates</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{fmtDate(selectedRequest.startDate)} — {fmtDate(selectedRequest.endDate)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400 font-bold uppercase">Type</span>
                    <span className="text-slate-700 dark:text-slate-300 font-bold">{selectedRequest.type}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Notes / Remarks {actionType === 'rejected' && <span className="text-rose-500">*</span>}</label>
                  <textarea
                    placeholder="Add optional notes for the student..."
                    rows={3}
                    value={actionNotes}
                    onChange={(e) => setActionNotes(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-800 rounded-2xl text-sm focus:border-primary-500 focus:outline-none transition-all resize-none"
                  />
                </div>
                
                {actionType === 'approved' && (
                  <p className="text-[10px] text-slate-400 italic">
                    * Approving this will automatically mark attendance as "Leave" for the specified dates.
                  </p>
                )}

                <div className="flex gap-3 pt-2">
                  <button 
                    onClick={() => setIsActionModalOpen(false)}
                    className="flex-1 py-3.5 rounded-2xl text-sm font-bold text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 border border-transparent hover:border-slate-200 transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    disabled={submitting || (actionType === 'rejected' && !actionNotes)}
                    onClick={handleUpdateStatus}
                    className={`flex-1 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                      actionType === 'approved' 
                        ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20' 
                        : 'bg-rose-600 hover:bg-rose-700 shadow-rose-500/20'
                    }`}
                  >
                    {submitting ? 'Processing...' : `Confirm ${actionType.charAt(0).toUpperCase() + actionType.slice(1)}`}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!deleteTarget}
        title="Remove Leave History"
        message="Are you sure you want to delete this leave record? Associated attendance marks will also be removed."
        onConfirm={handleDeleteRequest}
        onCancel={() => setDeleteTarget(null)}
        confirmVariant="danger"
      />
    </div>
  );
};

export default LeaveManagement;
