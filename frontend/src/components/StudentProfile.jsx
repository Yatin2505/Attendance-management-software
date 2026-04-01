import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, GraduationCap, CheckCircle, XCircle, Clock,
  TrendingUp, TrendingDown, Layers, Calendar, Activity,
  AlertCircle, RefreshCw, Wallet, DollarSign, CreditCard
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from 'recharts';
import { getStudentProfile } from '../services/studentService';
import { getFees } from '../services/feeService';

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
  const icon = { 
    present: <CheckCircle className="w-3 h-3" />, 
    absent: <XCircle className="w-3 h-3" />, 
    late: <Clock className="w-3 h-3" />,
    leave: <Calendar className="w-3 h-3" />
  };
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold capitalize ${map[status] ?? map.absent}`}>
      {icon[status]} {status}
    </span>
  );
};

const PctRing = ({ pct }) => {
  const color = pct >= 75 ? GREEN : pct >= 60 ? AMBER : RED;
  const r = 38;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="112" height="112">
        <circle cx="56" cy="56" r={r} fill="none" stroke="#e2e8f0" strokeWidth="8" className="dark:stroke-slate-700" />
        <circle
          cx="56" cy="56" r={r} fill="none"
          stroke={color} strokeWidth="8"
          strokeDasharray={`${filled} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
      </svg>
      <div className="text-center">
        <p className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-none">{pct}%</p>
        <p className="text-xs text-slate-400 font-medium mt-0.5">Overall</p>
      </div>
    </div>
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

// ─── Main Component ───────────────────────────────────────────────────────────
const StudentProfile = ({ studentId, onClose }) => {
  const [data, setData] = useState(null);
  const [fees, setFees] = useState([]);
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance' or 'fees'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    fetchProfile();
  }, [studentId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const [profileData, feeData] = await Promise.all([
        getStudentProfile(studentId),
        getFees({ studentId })
      ]);
      setData(profileData);
      setFees(feeData);
    } catch (err) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {studentId && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.aside
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed right-0 top-0 h-full w-full max-w-xl z-50 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden"
          >
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-base font-display font-bold text-slate-900 dark:text-white leading-none">
                    {data?.student?.name ?? 'Student Profile'}
                  </h2>
                  {data?.student?.rollNumber && (
                    <p className="text-xs text-slate-400 font-medium mt-0.5">#{data.student.rollNumber}</p>
                  )}
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ── Tabs ────────────────────────────────────────────────────── */}
            {data && !loading && (
              <div className="flex px-6 pt-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
                <button 
                  onClick={() => setActiveTab('attendance')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'attendance' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Attendance
                </button>
                <button 
                  onClick={() => setActiveTab('fees')}
                  className={`px-4 py-2 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'fees' 
                    ? 'border-primary-500 text-primary-600' 
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Financials
                </button>
              </div>
            )}

            {/* ── Body ───────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-5 space-y-6">

              {loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <RefreshCw className="w-8 h-8 text-primary-400 animate-spin" />
                  <p className="text-sm text-slate-400 font-medium">Loading profile…</p>
                </div>
              )}

              {error && !loading && (
                <div className="flex flex-col items-center justify-center py-20 gap-3 text-rose-500">
                  <AlertCircle className="w-10 h-10" />
                  <p className="text-sm font-semibold">{error}</p>
                </div>
              )}

              {data && !loading && (
                <>
                  {/* ── Overview strip ──────────────────────────────────── */}
                  <div className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
                    <PctRing pct={data.stats.overallPct} />
                    <div className="grid grid-cols-2 gap-3 flex-1">
                      {[
                        { label: 'Sessions', value: data.stats.totalSessions, color: 'text-slate-900 dark:text-white' },
                        { label: 'Present',  value: data.stats.totalPresent,  color: 'text-emerald-600 dark:text-emerald-400' },
                        { label: 'Absent',   value: data.stats.totalAbsent,   color: 'text-rose-600 dark:text-rose-400'   },
                        { label: 'Leave',    value: data.stats.totalLeave || 0, color: 'text-violet-600 dark:text-violet-400' },
                      ].map(({ label, value, color }) => (
                        <div key={label}>
                          <p className={`text-xl font-display font-bold ${color}`}>{value}</p>
                          <p className="text-xs text-slate-400 font-medium">{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ── Enrolled batches ─────────────────────────────────── */}
                  {data.student.batches?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5" /> Enrolled Batches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {data.student.batches.map(b => (
                          <span key={b._id} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20">
                            {b.name}
                            {b.timing && <span className="text-primary-400 font-normal">· {b.timing}</span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* ── Batch-wise breakdown ──────────────────────────────── */}
                  {data.batchBreakdown?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Batch-wise Attendance
                      </h3>
                      {data.batchBreakdown.length === 1 ? (
                        // Single batch — show bar chart
                        <div className="h-36">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{
                              name: data.batchBreakdown[0].batchName,
                              'Attendance %': data.batchBreakdown[0].percentage
                            }]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={48}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                              <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                              <Bar dataKey="Attendance %" radius={[4, 4, 0, 0]}>
                                <Cell fill={data.batchBreakdown[0].percentage >= 75 ? GREEN : data.batchBreakdown[0].percentage >= 60 ? AMBER : RED} />
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {data.batchBreakdown.map((b, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 w-28 truncate flex-shrink-0">{b.batchName}</p>
                              <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-500"
                                  style={{
                                    width: `${b.percentage}%`,
                                    background: b.percentage >= 75 ? GREEN : b.percentage >= 60 ? AMBER : RED
                                  }}
                                />
                              </div>
                              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 w-10 text-right flex-shrink-0">{b.percentage}%</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── Monthly trend ─────────────────────────────────────── */}
                  {data.monthly?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5" /> Monthly Attendance
                      </h3>
                      <div className="h-44 -ml-2">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={data.monthly} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                            <defs>
                              <linearGradient id="profileGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%"  stopColor={INDIGO} stopOpacity={0.3} />
                                <stop offset="95%" stopColor={INDIGO} stopOpacity={0}   />
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                            <XAxis dataKey="label" axisLine={false} tickLine={false}
                              tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} dy={5} />
                            <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                              tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => `${v}%`} />
                            <Tooltip content={<ChartTooltip />} />
                            <Area type="monotone" dataKey="percentage" name="Attendance %"
                              stroke={INDIGO} strokeWidth={2.5} fill="url(#profileGrad)"
                              dot={{ r: 3, fill: INDIGO }} activeDot={{ r: 5 }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  {/* ── Distribution pie ──────────────────────────────────── */}
                  {data.stats.totalSessions > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">Distribution</h3>
                      <div className="flex items-center gap-4">
                        <div className="h-32 w-40 flex-shrink-0">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Present', value: data.stats.totalPresent },
                                  { name: 'Absent',  value: data.stats.totalAbsent  },
                                  { name: 'Leave',   value: data.stats.totalLeave || 0 },
                                ].filter(d => d.value > 0)}
                                cx="50%" cy="50%"
                                innerRadius={36} outerRadius={56}
                                strokeWidth={0} paddingAngle={4}
                                dataKey="value"
                              >
                                <Cell fill={GREEN}  />
                                <Cell fill={RED}    />
                                <Cell fill={VIOLET} />
                              </Pie>
                              <Tooltip content={<ChartTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                        <div className="space-y-2">
                          {[
                            { label: 'Present', value: data.stats.totalPresent, color: 'bg-emerald-500' },
                            { label: 'Absent',  value: data.stats.totalAbsent,  color: 'bg-rose-500'    },
                            { label: 'Leave',   value: data.stats.totalLeave || 0, color: 'bg-violet-500' },
                          ].map(({ label, value, color }) => (
                            <div key={label} className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                              <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${color}`} />
                              {label}: <strong>{value}</strong>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* ── Attendance history ────────────────────────────────── */}
                  {data.history?.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5" /> Attendance History
                        <span className="text-slate-300 dark:text-slate-600 font-normal">(last {data.history.length})</span>
                      </h3>
                      <div className="space-y-1.5">
                        {data.history.map((rec, i) => (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className="font-mono text-slate-400">{fmtDate(rec.date)}</span>
                              <span className="text-slate-300 dark:text-slate-600">·</span>
                              <span className="font-semibold text-slate-600 dark:text-slate-300">{rec.batchName}</span>
                            </div>
                            <StatusBadge status={rec.status} />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {data.stats.totalSessions === 0 && (
                    <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-400">
                      <Activity className="w-10 h-10 opacity-30" />
                      <p className="text-sm font-medium">No attendance records yet</p>
                    </div>
                  )}
                </>
              )}

              {data && activeTab === 'fees' && !loading && (
                <div className="space-y-6">
                  {/* Fee Summary Cards */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                      <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-1 leading-tight text-center">Paid</p>
                      <p className="text-xl font-display font-bold text-emerald-700 dark:text-emerald-300 text-center">
                        ₹{fees.reduce((sum, f) => sum + f.paidAmount, 0).toLocaleString()}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                      <p className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1 leading-tight text-center">Balance</p>
                      <p className="text-xl font-display font-bold text-rose-700 dark:text-rose-300 text-center">
                        ₹{fees.reduce((sum, f) => sum + (f.amount - f.paidAmount), 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Fee Records */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" /> Billing Records
                    </h3>
                    {fees.length === 0 ? (
                      <div className="text-center py-12 text-slate-400 italic text-sm">No fee records assigned to this student.</div>
                    ) : (
                      fees.map(f => (
                        <div key={f._id} className="premium-card p-4 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 flex items-center justify-center">
                                <Wallet className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{f.month} {f.year}</p>
                                <p className="text-[10px] text-slate-400 font-medium">{f.description}</p>
                              </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                              f.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 
                              f.status === 'Partial' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                            }`}>{f.status}</span>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-50 dark:border-white/5">
                             <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Amount</p>
                               <p className="text-sm font-bold text-slate-800 dark:text-white">₹{f.amount}</p>
                             </div>
                             <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Paid</p>
                               <p className="text-sm font-bold text-emerald-600">₹{f.paidAmount}</p>
                             </div>
                             <div>
                               <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Remaining</p>
                               <p className="text-sm font-bold text-rose-600">₹{f.amount - f.paidAmount}</p>
                             </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <p className="text-[10px] text-slate-400 flex items-center gap-1.5"><Calendar className="w-3 h-3"/> Due: {new Date(f.dueDate).toLocaleDateString()}</p>
                            {f.paymentHistory?.length > 0 && (
                              <details className="cursor-pointer group">
                                <summary className="text-[10px] font-bold text-primary-500 hover:underline list-none">View Payment Log</summary>
                                <div className="mt-2 text-[10px] space-y-1 p-2 bg-slate-50 dark:bg-white/5 rounded-lg">
                                  {f.paymentHistory.map((p, i) => (
                                    <div key={i} className="flex justify-between border-b border-slate-100 dark:border-white/5 pb-1 mb-1 last:border-0">
                                      <span className="text-slate-500">{new Date(p.paymentDate).toLocaleDateString()}</span>
                                      <span className="font-bold text-emerald-600">₹{p.amount} <small className="text-slate-400 font-normal">({p.paymentMethod})</small></span>
                                    </div>
                                  ))}
                                </div>
                              </details>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default StudentProfile;
