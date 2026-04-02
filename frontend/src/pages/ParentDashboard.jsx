import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, CheckCircle, XCircle, Clock,
  TrendingUp, Layers, Calendar, Activity,
  AlertCircle, RefreshCw, Download, FileText, Wallet, Heart
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getStudentSelfProfile } from '../services/studentService';
import { getMyFees } from '../services/feeService';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';

const GREEN  = '#10b981';
const RED    = '#f43f5e';
const AMBER  = '#f59e0b';
const VIOLET = '#8b5cf6';

const StatusBadge = ({ status }) => {
  const map = {
    present: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
    absent:  'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400',
    late:    'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400',
    leave:   'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-400',
  };
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${map[status] ?? map.absent}`}>
      {status}
    </span>
  );
};

const ParentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [fees, setFees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [profile, feeData] = await Promise.all([
        getStudentSelfProfile(),
        getMyFees()
      ]);
      setData(profile);
      setFees(feeData);
    } catch (err) {
      setError('Failed to load ward data.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="h-96 flex flex-col items-center justify-center gap-3">
      <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
      <p className="text-slate-500 font-medium">Opening Parent Portal...</p>
    </div>
  );

  const { student, stats, history } = data;
  const pendingFees = fees.reduce((acc, f) => acc + (f.amount - f.paidAmount), 0);

  return (
    <div className="flex flex-col gap-6 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-500/10 text-primary-600 text-[10px] font-bold uppercase tracking-widest mb-2">
            Parental Access
          </span>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Ward Overview: {student.name}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Monitoring academic progress and financial standing.
          </p>
        </div>
        <div className="flex gap-2">
           <Link to="/fees" className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm">
            <Wallet className="w-4 h-4 text-primary-500" /> View Detailed Fees
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Stats */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="premium-card p-6 flex flex-col items-center text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-10">
                <Heart className="w-20 h-20 text-primary-500" />
             </div>
             <div className={`w-28 h-28 rounded-full border-[10px] flex items-center justify-center mb-6 shadow-inner ${
                stats.overallPct >= 75 ? 'border-emerald-500/20' : 'border-rose-500/20'
             }`}>
                <span className={`text-3xl font-display font-bold ${
                  stats.overallPct >= 75 ? 'text-emerald-600' : 'text-rose-600'
                }`}>{stats.overallPct}%</span>
             </div>
             <h3 className="text-lg font-bold text-slate-800 dark:text-white">Overall Attendance</h3>
             <p className="text-xs text-slate-400 mt-2 max-w-[200px]">Goal: Maintain above 75% for optimal learning results.</p>
          </div>

          <div className="premium-card p-5 grid grid-cols-2 gap-4">
            <div className="text-center p-3 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/5 border border-emerald-100 dark:border-emerald-500/10">
              <p className="text-2xl font-display font-bold text-emerald-600">{stats.totalPresent}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Present</p>
            </div>
            <div className="text-center p-3 rounded-2xl bg-rose-50/50 dark:bg-rose-500/5 border border-rose-100 dark:border-rose-500/10">
              <p className="text-2xl font-display font-bold text-rose-600">{stats.totalAbsent}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-1">Absent</p>
            </div>
          </div>

          <div className="premium-card p-6 border-l-4 border-l-primary-500">
             <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                   <DollarSign className="w-4 h-4 text-primary-500" /> Fee Balance
                </h4>
                <Link to="/fees" className="text-[10px] font-bold text-primary-500 hover:underline">Details</Link>
             </div>
             <h3 className={`text-3xl font-display font-bold ${pendingFees > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                ₹{pendingFees.toLocaleString()}
             </h3>
             <p className="text-xs text-slate-400 mt-2">
                {pendingFees > 0 ? 'Action required: Outstanding balance detected.' : 'Status: All dues are currently settled.'}
             </p>
          </div>
        </div>

        {/* History Table */}
        <div className="lg:col-span-2 space-y-6">
           <div className="premium-card overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-primary-500" /> Recent Attendance History
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-sans">
                  <thead className="bg-slate-50 dark:bg-slate-800/30">
                    <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      <th className="py-4 px-6 text-center">Status</th>
                      <th className="py-4 px-6">Date</th>
                      <th className="py-4 px-6">Batch / Session</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {history.slice(0, 10).map((record, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="py-4 px-6 text-center">
                          <StatusBadge status={record.status} />
                        </td>
                        <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                           {new Date(record.date).toLocaleDateString('en-IN', { day:'numeric', month:'short' })}
                        </td>
                        <td className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-white">
                          {record.batchName}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="premium-card p-5 bg-gradient-to-br from-indigo-600 to-purple-700 text-white border-none shadow-xl shadow-indigo-500/20">
                 <h4 className="text-sm font-bold mb-2">Need Assistance?</h4>
                 <p className="text-xs opacity-80 leading-relaxed">If you have any queries regarding your ward's progress or fee structure, please contact the administration office.</p>
                 <button className="mt-4 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl text-xs font-bold transition-all backdrop-blur-md border border-white/30">
                    Contact Office
                 </button>
              </div>
              <div className="premium-card p-5">
                 <h4 className="text-sm font-bold text-slate-800 dark:text-white mb-3">Next Scheduled Fee</h4>
                 {fees.filter(f => f.status !== 'Paid').length > 0 ? (
                    <div>
                        <p className="text-lg font-display font-bold text-slate-900 dark:text-white">
                           {fees.filter(f => f.status !== 'Paid')[0].month} {fees.filter(f => f.status !== 'Paid')[0].year}
                        </p>
                        <p className="text-[10px] text-rose-500 font-bold mt-1 uppercase tracking-wider">
                           Due by: {new Date(fees.filter(f => f.status !== 'Paid')[0].dueDate).toLocaleDateString()}
                        </p>
                    </div>
                 ) : (
                    <p className="text-xs text-slate-400 italic py-2">No upcoming due dates.</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ParentDashboard;
