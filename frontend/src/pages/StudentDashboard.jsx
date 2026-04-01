import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, CheckCircle, XCircle, Clock,
  TrendingUp, Layers, Calendar, Activity,
  AlertCircle, RefreshCw, Download, FileText
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { getStudentSelfProfile } from '../services/studentService';
import { useAuth } from '../context/AuthContext';
import * as XLSX from 'xlsx';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const GREEN  = '#10b981';
const RED    = '#f43f5e';
const AMBER  = '#f59e0b';
const INDIGO = '#6366f1';
const VIOLET = '#8b5cf6';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric'
});

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

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2 text-xs font-semibold">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="font-bold">
          {p.name}: {p.value}{p.name.includes('%') ? '%' : ''}
        </p>
      ))}
    </div>
  );
};

const StudentDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const profile = await getStudentSelfProfile();
      setData(profile);
    } catch (err) {
      setError('Failed to load your attendance data.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!data?.history) return;
    const reportData = data.history.map(row => ({
      Date: new Date(row.date).toLocaleDateString(),
      Batch: row.batchName,
      Status: row.status.toUpperCase()
    }));
    const ws = XLSX.utils.json_to_sheet(reportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "AttendanceHistory");
    XLSX.writeFile(wb, `${data.student.name}_Attendance_Report.xlsx`);
  };

  if (loading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3">
        <RefreshCw className="w-10 h-10 text-primary-500 animate-spin" />
        <p className="text-slate-500 font-medium">Loading your portal…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 opacity-20" />
        <p className="text-lg font-bold text-slate-800 dark:text-white">{error}</p>
        <button onClick={fetchProfile} className="px-6 py-2 bg-primary-600 text-white rounded-xl font-bold">Retry</button>
      </div>
    );
  }

  const { student, stats, batchBreakdown, monthly, history } = data;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">
            Hi, {student.name.split(' ')[0]} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Here's your attendance overview as of {new Date().toLocaleDateString()}
          </p>
        </div>
        <button
          onClick={handleDownloadReport}
          className="flex items-center gap-2 px-5 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 transition-all shadow-sm"
        >
          <Download className="w-4 h-4 text-primary-500" />
          Download Report
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* KPI Cards */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          <div className="premium-card p-6 flex flex-col items-center text-center">
            <div className={`w-24 h-24 rounded-full border-8 flex items-center justify-center mb-4 ${
              stats.overallPct >= 75 ? 'border-emerald-500/20' : stats.overallPct >= 60 ? 'border-amber-500/20' : 'border-rose-500/20'
            }`}>
              <span className={`text-2xl font-display font-bold ${
                stats.overallPct >= 75 ? 'text-emerald-600' : stats.overallPct >= 60 ? 'text-amber-600' : 'text-rose-600'
              }`}>{stats.overallPct}%</span>
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-white">Overall Attendance</h3>
            <p className="text-xs text-slate-400 mt-1">Based on {stats.totalSessions - (stats.totalLeave || 0)} active sessions</p>
          </div>

          <div className="premium-card p-5 grid grid-cols-2 gap-4">
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.totalPresent}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Present</p>
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-rose-600 dark:text-rose-400">{stats.totalAbsent}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Absent</p>
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.totalLate || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Late</p>
            </div>
            <div className="flex flex-col">
              <p className="text-2xl font-bold text-violet-600 dark:text-violet-400">{stats.totalLeave || 0}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Leave</p>
            </div>
          </div>

          <div className="premium-card p-5">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">My Batches</h4>
            <div className="flex flex-wrap gap-2">
              {student.batches.map(b => (
                <div key={b._id} className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 w-full">
                  <div className="w-6 h-6 rounded-lg bg-primary-500/10 flex items-center justify-center">
                    <Layers className="w-3.5 h-3.5 text-primary-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{b.name}</p>
                    <p className="text-[10px] text-slate-400">{b.timing}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Charts & Table Area */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="premium-card p-6 min-h-[300px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Monthly Trend</h3>
              <div className="h-56 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthly} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={VIOLET} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={VIOLET} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={[0, 100]} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <Tooltip content={<ChartTooltip />} />
                    <Area type="monotone" dataKey="percentage" name="Attendance" stroke={VIOLET} strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="premium-card p-6 min-h-[300px]">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-6">Batch Comparison</h3>
              <div className="h-56 -ml-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={batchBreakdown} margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barSize={32}>
                    <XAxis dataKey="batchName" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} domain={[0, 100]} />
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <Tooltip content={<ChartTooltip />} cursor={{fill: 'rgba(99,102,241,0.05)'}} />
                    <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                      {batchBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.percentage >= 75 ? GREEN : entry.percentage >= 60 ? AMBER : RED} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="premium-card overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-white/5">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary-500" /> Recent Attendance History
              </h3>
              <span className="text-xs text-slate-400 font-medium">Last 15 records</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/30">
                  <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    <th className="py-4 px-6">Date</th>
                    <th className="py-4 px-6">Batch</th>
                    <th className="py-4 px-6 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((record, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                      <td className="py-4 px-6 text-sm font-medium text-slate-600 dark:text-slate-300">
                        {fmtDate(record.date)}
                      </td>
                      <td className="py-4 px-6 text-sm font-bold text-slate-800 dark:text-white">
                        {record.batchName}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <StatusBadge status={record.status} />
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan="3" className="py-12 text-center text-slate-400 text-sm italic">
                        No attendance records found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
