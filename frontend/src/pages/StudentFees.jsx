import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, Receipt, CreditCard, Clock, 
  CheckCircle, AlertCircle, Download, ArrowLeft,
  Calendar, RefreshCw, Info, ChevronRight, DollarSign
} from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import * as XLSX from 'xlsx';
import { getMyFees } from '../services/feeService';

const fmt = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

const StatusBadge = ({ status }) => {
  const map = {
    Paid:    'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    Partial: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    Pending: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
  };
  return (
    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
};

const StudentFees = () => {
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedFee, setExpandedFee] = useState(null);

  useEffect(() => {
    fetchFees();
  }, []);

  const fetchFees = async () => {
    try {
      setLoading(true);
      const data = await getMyFees();
      setFees(data);
    } catch (err) {
      toast.error('Failed to load fee records');
    } finally {
      setLoading(false);
    }
  };

  const totals = fees.reduce((acc, f) => {
    acc.total += f.amount;
    acc.paid += f.paidAmount;
    acc.pending += (f.amount - f.paidAmount);
    return acc;
  }, { total: 0, paid: 0, pending: 0 });

  const exportHistory = () => {
    const data = fees.flatMap(f => 
      f.paymentHistory.map(h => ({
        Month: `${f.month} ${f.year}`,
        Amount: h.amount,
        Date: new Date(h.paymentDate).toLocaleDateString(),
        Method: h.paymentMethod,
        Remarks: h.remarks || '-'
      }))
    );
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "PaymentHistory");
    XLSX.writeFile(wb, "My_Payment_History.xlsx");
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4">
        <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-500 font-medium tracking-wide">Securing your financial data...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-16">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link to="/" className="inline-flex items-center text-xs font-bold text-primary-600 dark:text-primary-400 hover:gap-2 transition-all mb-4 group">
            <ArrowLeft className="w-3 h-3 transition-transform group-hover:-translate-x-1" /> Back to Dashboard
          </Link>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Fee Ledger</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">Detailed breakdown of your tuition and activity fees.</p>
        </div>
        <button 
          onClick={exportHistory}
          className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm active:scale-95"
        >
          <Download className="w-4 h-4 text-primary-500" /> Export History
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{delay:0.1}} className="premium-card p-6 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-primary-500/10 flex items-center justify-center text-primary-600 transition-transform group-hover:scale-110">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Dues</span>
          </div>
          <div>
            <h3 className="text-4xl font-display font-bold text-slate-900 dark:text-white">₹{totals.total.toLocaleString()}</h3>
            <p className="text-xs text-slate-400 mt-1 font-medium">Aggregated across all sessions</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{delay:0.2}} className="premium-card p-6 flex flex-col justify-between group">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 transition-transform group-hover:scale-110">
              <CheckCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Amount Paid</span>
          </div>
          <div>
            <h3 className="text-4xl font-display font-bold text-slate-900 dark:text-white">₹{totals.paid.toLocaleString()}</h3>
            <p className="text-xs text-emerald-500 mt-1 font-bold">Successfully processed</p>
          </div>
        </motion.div>

        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{delay:0.3}} className="premium-card p-6 flex flex-col justify-between group border-rose-500/10">
          <div className="flex justify-between items-start mb-6">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-600 transition-transform group-hover:scale-110">
              <AlertCircle className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Outstanding</span>
          </div>
          <div>
            <h3 className="text-4xl font-display font-bold text-slate-900 dark:text-white">₹{totals.pending.toLocaleString()}</h3>
            <p className="text-xs text-rose-500 mt-1 font-bold">Balance yet to be paid</p>
          </div>
        </motion.div>
      </div>

      {/* Fee List */}
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white px-2">Payment Records</h2>
        <div className="grid grid-cols-1 gap-3">
          {fees.map((fee, idx) => (
            <motion.div 
              key={fee._id}
              initial={{ opacity:0, x:-20 }} animate={{ opacity:1, x:0 }} transition={{ delay: 0.1 * idx }}
              className="premium-card overflow-hidden"
            >
              <div 
                className="p-5 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors"
                onClick={() => setExpandedFee(expandedFee === fee._id ? null : fee._id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-lg font-bold ${
                    fee.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-amber-500/10 text-amber-600'
                  }`}>
                    {fee.month.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 dark:text-white">{fee.month} {fee.year}</h4>
                    <p className="text-xs text-slate-400 font-medium">Due: {fmt(fee.dueDate)}</p>
                  </div>
                </div>

                <div className="flex-1 min-w-[200px] flex items-center justify-around">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Amount</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white text-center">₹{fee.amount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Paid</p>
                    <p className="text-sm font-bold text-emerald-600 text-center">₹{fee.paidAmount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1 text-center">Balance</p>
                    <p className="text-sm font-bold text-rose-500 text-center">₹{fee.amount - fee.paidAmount}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <StatusBadge status={fee.status} />
                  <ChevronRight className={`w-5 h-5 text-slate-300 transition-transform duration-300 ${expandedFee === fee._id ? 'rotate-90' : ''}`} />
                </div>
              </div>

              <AnimatePresence>
                {expandedFee === fee._id && (
                  <motion.div 
                    initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                    className="overflow-hidden bg-slate-50/50 dark:bg-white/5 border-t border-slate-100 dark:border-white/5"
                  >
                    <div className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Info className="w-5 h-5 text-primary-500 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Description</p>
                          <p className="text-xs text-slate-500 mt-1">{fee.description || 'Monthly Tuition Fee'}</p>
                        </div>
                      </div>

                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Payment History</h5>
                      {fee.paymentHistory.length > 0 ? (
                        <div className="space-y-3">
                          {fee.paymentHistory.map((h, hIdx) => (
                            <div key={hIdx} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-white/5">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                  <CreditCard className="w-4 h-4" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-slate-800 dark:text-white">₹{h.amount}</p>
                                  <p className="text-[10px] text-slate-400">{h.paymentMethod} · {fmt(h.paymentDate)}</p>
                                </div>
                              </div>
                              {h.remarks && <span className="text-[10px] text-slate-400 italic bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md max-w-[150px] truncate">{h.remarks}</span>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
                          <p className="text-xs text-slate-400 font-medium">No payments recorded for this month.</p>
                        </div>
                      )}

                      {fee.status !== 'Paid' && (
                        <div className="mt-8 p-4 bg-primary-600/5 border border-primary-600/20 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-primary-600" />
                            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Payment remaining for this month</p>
                          </div>
                          <button className="w-full sm:w-auto px-6 py-2.5 bg-primary-600 text-white text-xs font-bold rounded-xl shadow-lg shadow-primary-500/25 hover:bg-primary-700 transition-all active:scale-95">
                            Request Receipt
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
          
          {fees.length === 0 && (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-slate-400 opacity-60">
              <Receipt className="w-16 h-16" />
              <p className="font-bold tracking-tight">No fee records found for your account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentFees;
