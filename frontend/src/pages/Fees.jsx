import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Plus, Users, Search, Filter,
  CheckCircle, Clock, AlertCircle, X,
  TrendingUp, ArrowRight, Download, CreditCard,
  Calendar, Layers, RefreshCw, MoreVertical, DollarSign, Edit2, Trash2
} from 'lucide-react';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';

import { 
  getFees, createFee, assignBatchFees, 
  recordPayment, getFeeStats, updateFee, deleteFee 
} from '../services/feeService';
import { getStudents } from '../services/studentService';
import { getBatches } from '../services/batchService';
import ConfirmModal from '../components/ConfirmModal';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

const StatusBadge = ({ status }) => {
  const map = {
    Paid:    'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    Partial: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    Pending: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
  };
  const icon = {
    Paid:    <CheckCircle className="w-3 h-3" />,
    Partial: <Clock className="w-3 h-3" />,
    Pending: <AlertCircle className="w-3 h-3" />,
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {icon[status]} {status}
    </span>
  );
};

const Fees = () => {
  const [fees, setFees] = useState([]);
  const [stats, setStats] = useState({ totalCollected: 0, totalPending: 0 });
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [batchFilter, setBatchFilter] = useState('all');

  // Modals
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [assignType, setAssignType] = useState('individual'); // 'individual' or 'batch'
  
  const [newFee, setNewFee] = useState({
    studentId: '', batchId: '', amount: '', month: new Date().toLocaleString('en-US', { month: 'long' }),
    year: new Date().getFullYear(), dueDate: '', description: 'Monthly Tuition Fee'
  });

  const [paymentData, setPaymentData] = useState({ feeId: '', studentName: '', amount: '', method: 'Cash', remarks: '' });
  
  // Edit Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFee, setEditFee] = useState(null);
  
  // Delete Confirmation
  const [deleteId, setDeleteId] = useState(null);
  
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, [statusFilter, batchFilter]);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [feeList, feeStats, studentList, batchList] = await Promise.all([
        getFees({ 
          status: statusFilter === 'all' ? undefined : statusFilter,
          batchId: batchFilter === 'all' ? undefined : batchFilter
        }),
        getFeeStats(),
        getStudents({ limit: 1000 }), // Basic list for dropdowns
        getBatches()
      ]);
      setFees(feeList);
      setStats(feeStats);
      // Backend getStudents might return directly as array in some cases
      setStudents(Array.isArray(studentList.students) ? studentList.students : (Array.isArray(studentList) ? studentList : []));
      setBatches(Array.isArray(batchList) ? batchList : (Array.isArray(batchList.batches) ? batchList.batches : []));
    } catch (err) {
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  const filteredFees = fees.filter(f => 
    f.studentId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.studentId?.rollNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssignFee = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (assignType === 'individual') {
        await createFee({ ...newFee, amount: Number(newFee.amount) });
        toast.success('Fee assigned to student');
      } else {
        await assignBatchFees({ ...newFee, amount: Number(newFee.amount) });
        toast.success(`Fees assigned to batch students`);
      }
      setIsAssignModalOpen(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to assign fee');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await recordPayment(paymentData.feeId, {
        amount: Number(paymentData.amount),
        paymentMethod: paymentData.method,
        remarks: paymentData.remarks
      });
      toast.success('Payment recorded successfully');
      setIsPaymentModalOpen(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record payment');
    } finally {
      setProcessing(false);
    }
  };

  const handleEditFee = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await updateFee(editFee._id, editFee);
      toast.success('Fee record updated');
      setIsEditModalOpen(false);
      fetchInitialData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update fee');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteFee = async () => {
    try {
      await deleteFee(deleteId);
      toast.success('Fee record deleted');
      setDeleteId(null);
      fetchInitialData();
    } catch (err) {
      toast.error('Failed to delete fee record');
    }
  };

  const exportToExcel = () => {
    const data = filteredFees.map(f => ({
      Student: f.studentId?.name,
      'Roll Number': f.studentId?.rollNumber,
      Amount: f.amount,
      Paid: f.paidAmount,
      Balance: f.amount - f.paidAmount,
      Status: f.status,
      Month: `${f.month} ${f.year}`,
      'Due Date': new Date(f.dueDate).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "FeesReport");
    XLSX.writeFile(wb, "Fees_Report.xlsx");
  };

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Financial Hub</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium italic">Track collections, manage dues, and view reports.</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={exportToExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 shadow-sm transition-all"
          >
            <Download className="w-4 h-4 text-primary-500" /> Export
          </button>
          <button 
            onClick={() => setIsAssignModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-primary-500/25 hover:bg-primary-700 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /> Assign Fee
          </button>
        </div>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="premium-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
            <DollarSign className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Collected</p>
            <p className="text-xl font-display font-bold text-slate-900 dark:text-white">₹{stats.totalCollected.toLocaleString()}</p>
          </div>
        </div>
        <div className="premium-card p-5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-rose-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pending Dues</p>
            <p className="text-xl font-display font-bold text-slate-900 dark:text-white">₹{stats.totalPending.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Filters Strip */}
      <div className="premium-card p-4 flex flex-wrap items-center gap-4">
        <div className="flex-1 min-w-[240px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input 
            type="text" placeholder="Search student or roll number..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl text-sm bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select 
            value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="Paid">Paid Only</option>
            <option value="Partial">Partial</option>
            <option value="Pending">Pending</option>
          </select>
          <select 
            value={batchFilter} onChange={e => setBatchFilter(e.target.value)}
            className="text-xs font-bold bg-slate-50 dark:bg-white/5 border-none rounded-lg px-3 py-2 cursor-pointer max-w-[150px]"
          >
            <option value="all">All Batches</option>
            {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="premium-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/5 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-white/5">
                <th className="py-4 px-6">Student</th>
                <th className="py-4 px-6">Fee Month</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Balance</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {filteredFees.map((fee) => (
                <tr key={fee._id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-600">
                        {fee.studentId?.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{fee.studentId?.name}</p>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">Roll: {fee.studentId?.rollNumber}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {fee.month} {fee.year}
                  </td>
                  <td className="py-4 px-6">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">₹{fee.amount}</p>
                    <p className="text-[10px] text-emerald-500 font-bold">Paid: ₹{fee.paidAmount}</p>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`text-sm font-bold ${fee.amount - fee.paidAmount > 0 ? 'text-rose-500' : 'text-slate-400 opacity-40'}`}>
                      ₹{fee.amount - fee.paidAmount}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={fee.status} />
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {fee.status !== 'Paid' && (
                        <button 
                          onClick={() => {
                            setPaymentData({ feeId: fee._id, studentName: fee.studentId?.name, amount: fee.amount - fee.paidAmount, method: 'Cash', remarks: '' });
                            setIsPaymentModalOpen(true);
                          }}
                          className="p-2 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white rounded-lg transition-all"
                          title="Record Payment"
                        >
                          <Wallet className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          setEditFee({ ...fee });
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 bg-amber-500/10 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all"
                        title="Edit Record"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setDeleteId(fee._id)}
                        className="p-2 bg-rose-500/10 text-rose-600 hover:bg-rose-500 hover:text-white rounded-lg transition-all"
                        title="Delete Record"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredFees.length === 0 && !loading && (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-400 italic text-sm">No fee records found for current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign Fee Modal */}
      <AnimatePresence>
        {isAssignModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
              <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800 dark:text-white">Assign Fees</h3>
                <button onClick={() => setIsAssignModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handleAssignFee} className="p-6 space-y-5">
                <div className="flex p-1 bg-slate-100 dark:bg-white/5 rounded-xl">
                  <button 
                    type="button" 
                    onClick={() => setAssignType('individual')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${assignType === 'individual' ? 'bg-white dark:bg-white/10 shadow-sm text-primary-600' : 'text-slate-500'}`}
                  >
                    Single Student
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAssignType('batch')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${assignType === 'batch' ? 'bg-white dark:bg-white/10 shadow-sm text-primary-600' : 'text-slate-500'}`}
                  >
                    Whole Batch
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {assignType === 'individual' ? (
                    <div className="col-span-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Student</label>
                       <select 
                        required value={newFee.studentId} onChange={e => setNewFee({...newFee, studentId: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm"
                       >
                         <option value="">-- Choose Student --</option>
                         {students.map(s => <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>)}
                       </select>
                    </div>
                  ) : (
                    <div className="col-span-2">
                       <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Select Batch</label>
                       <select 
                        required value={newFee.batchId} onChange={e => setNewFee({...newFee, batchId: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm"
                       >
                         <option value="">-- Choose Batch --</option>
                         {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                       </select>
                    </div>
                  )}

                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fee Amount (₹)</label>
                     <input type="number" required value={newFee.amount} onChange={e => setNewFee({...newFee, amount: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" placeholder="2500" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                     <input type="date" required value={newFee.dueDate} onChange={e => setNewFee({...newFee, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Month</label>
                     <select value={newFee.month} onChange={e => setNewFee({...newFee, month: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm">
                       {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year</label>
                     <input type="number" value={newFee.year} onChange={e => setNewFee({...newFee, year: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                     <input type="text" value={newFee.description} onChange={e => setNewFee({...newFee, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsAssignModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button 
                    disabled={processing}
                    className="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Confirm Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Record Payment Modal */}
      <AnimatePresence>
        {isPaymentModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
              <div className="px-6 py-4 bg-emerald-500/10 border-b border-emerald-500/10 flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                <h3 className="text-sm font-bold uppercase tracking-widest flex items-center gap-2"><CreditCard className="w-4 h-4" /> Record Payment</h3>
                <button onClick={() => setIsPaymentModalOpen(false)}><X className="w-5 h-5" /></button>
              </div>
              <form onSubmit={handlePayment} className="p-6 space-y-4">
                <div className="text-center mb-2">
                   <p className="text-xs text-slate-400 font-medium italic">Paying for</p>
                   <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{paymentData.studentName}</p>
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Amount (₹)</label>
                   <input type="number" required value={paymentData.amount} onChange={e => setPaymentData({...paymentData, amount: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-lg font-display font-bold text-primary-600" />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Payment Method</label>
                   <div className="grid grid-cols-3 gap-2">
                     {['Cash', 'UPI', 'Bank'].map(m => (
                       <button 
                        key={m} type="button" 
                        onClick={() => setPaymentData({...paymentData, method: m})}
                        className={`py-2 text-[10px] font-bold rounded-lg border transition-all ${paymentData.method === m ? 'bg-primary-500 border-primary-500 text-white shadow-md' : 'border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                       >
                         {m}
                       </button>
                     ))}
                   </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Remarks (Optional)</label>
                  <textarea value={paymentData.remarks} onChange={e => setPaymentData({...paymentData, remarks: e.target.value})} className="w-full px-4 py-2 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-xs h-16 resize-none" placeholder="e.g. Paid in full" />
                </div>
                <button 
                  disabled={processing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/25 transition-all active:scale-95 disabled:opacity-50"
                >
                  {processing ? 'Processing...' : 'Confirm Payment'}
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Fee Modal */}
      <AnimatePresence>
        {isEditModalOpen && editFee && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
              <div className="px-6 py-4 bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/10 flex justify-between items-center">
                <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Edit2 className="w-4 h-4 text-amber-500" /> Edit Fee Record 
                </h3>
                <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:text-rose-500 transition-colors"><X className="w-5 h-5" /></button>
              </div>
              <div className="px-6 pt-4 text-center">
                 <p className="text-xs text-slate-400 font-medium italic">Modifying record for</p>
                 <p className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{editFee.studentId?.name}</p>
              </div>
              <form onSubmit={handleEditFee} className="p-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fee Amount (₹)</label>
                     <input type="number" required value={editFee.amount} onChange={e => setEditFee({...editFee, amount: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Month</label>
                     <select value={editFee.month} onChange={e => setEditFee({...editFee, month: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm">
                       {['January','February','March','April','May','June','July','August','September','October','November','December'].map(m => <option key={m}>{m}</option>)}
                     </select>
                  </div>
                  <div>
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Year</label>
                     <input type="number" value={editFee.year} onChange={e => setEditFee({...editFee, year: Number(e.target.value)})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Due Date</label>
                     <input type="date" required value={editFee.dueDate?.split('T')[0]} onChange={e => setEditFee({...editFee, dueDate: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                  <div className="col-span-2">
                     <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Description</label>
                     <input type="text" value={editFee.description} onChange={e => setEditFee({...editFee, description: e.target.value})} className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm" />
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-sm font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                  <button 
                    disabled={processing}
                    className="flex-[2] py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-bold shadow-lg shadow-primary-500/25 transition-all disabled:opacity-50"
                  >
                    {processing ? 'Saving...' : 'Update Record'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmModal 
        isOpen={!!deleteId}
        title="Delete Fee Record"
        message="Are you sure you want to delete this fee record? This will also remove the payment history. This action cannot be undone."
        onConfirm={handleDeleteFee}
        onCancel={() => setDeleteId(null)}
        confirmVariant="danger"
      />
    </div>
  );
};

export default Fees;
