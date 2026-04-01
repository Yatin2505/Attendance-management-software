import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell
} from 'recharts';
import {
  Users, Layers, GraduationCap, CheckCircle, XCircle, Clock,
  TrendingUp, CheckSquare, UserPlus, Plus, BarChart2, ArrowRight,
  Activity, Calendar, DollarSign, CreditCard, Bell
} from 'lucide-react';
import { getDashboardStats } from '../services/dashboardService';
import notificationService from '../services/notificationService';
import { useAuth } from '../context/AuthContext';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const fmt = (date) =>
  new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });

const fmtShort = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const statusColor = (status) => {
  if (status === 'present') return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10';
  if (status === 'absent')  return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-500/10';
  if (status === 'leave')   return 'text-violet-600 bg-violet-50 dark:text-violet-400 dark:bg-violet-500/10';
  return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10';
};

const statusIcon = (status) => {
  if (status === 'present') return <CheckCircle className="w-3.5 h-3.5" />;
  if (status === 'absent')  return <XCircle className="w-3.5 h-3.5" />;
  if (status === 'leave')   return <Calendar className="w-3.5 h-3.5" />;
  return <Clock className="w-3.5 h-3.5" />;
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="premium-card p-5 flex items-center gap-4"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

// ─── Quick Action Button ──────────────────────────────────────────────────────
const QuickAction = ({ to, icon: Icon, label, desc, color }) => (
  <Link
    to={to}
    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 group
      hover:border-${color}-300 dark:hover:border-${color}-500/40
      hover:bg-${color}-50/50 dark:hover:bg-${color}-500/5
      border-slate-200/70 dark:border-slate-800/70 bg-white dark:bg-slate-900`}
  >
    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
      bg-${color}-50 dark:bg-${color}-500/10
      text-${color}-600 dark:text-${color}-400
      group-hover:bg-${color}-100 dark:group-hover:bg-${color}-500/20 transition-colors`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-slate-800 dark:text-white">{label}</p>
      <p className="text-xs text-slate-400 dark:text-slate-500">{desc}</p>
    </div>
    <ArrowRight className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-slate-500 dark:group-hover:text-slate-400 transition-colors" />
  </Link>
);

// ─── Custom Tooltip for Area Chart ───────────────────────────────────────────
const AreaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2 text-xs font-semibold">
      <p className="text-slate-500 dark:text-slate-400 mb-1">{label}</p>
      <p className="text-primary-600 dark:text-primary-400">{payload[0]?.value}% attendance</p>
    </div>
  );
};

// ─── Custom Tooltip for Bar Chart ────────────────────────────────────────────
const BarTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2 text-xs font-semibold">
      <p className="text-slate-500 dark:text-slate-400 mb-1 truncate max-w-[140px]">{label}</p>
      <p className="text-emerald-600 dark:text-emerald-400">{payload[0]?.value}% attendance</p>
    </div>
  );
};

// ─── Empty Chart Placeholder ──────────────────────────────────────────────────
const EmptyChart = ({ message = 'No data yet' }) => (
  <div className="flex-1 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-600 min-h-[160px]">
    <BarChart2 className="w-8 h-8 opacity-40" />
    <p className="text-sm font-medium">{message}</p>
  </div>
);

// ─── Main Dashboard Component ─────────────────────────────────────────────────
const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [statsResult, notificationsResult] = await Promise.all([
          getDashboardStats(),
          notificationService.getNotifications()
        ]);
        setData(statsResult);
        setNotifications(notificationsResult.notifications.slice(0, 5));
      } catch (err) {
        setError('Failed to load dashboard. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });

  // ── Loading skeleton ────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex flex-col gap-5 animate-pulse">
        <div className="h-16 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-xl" />
        </div>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-slate-400">
        <XCircle className="w-10 h-10 text-rose-400" />
        <p className="font-medium text-slate-600 dark:text-slate-300">{error}</p>
        <button onClick={() => window.location.reload()}
          className="text-sm text-primary-500 hover:underline font-semibold">Retry</button>
      </div>
    );
  }

  const { counts, today: tod, overall, monthlyTrend, batchWise, recentActivity, fees } = data;

  // Bar chart: shorten batch name if too long
  const barData = batchWise.map(b => ({
    name: b.batchName.length > 12 ? b.batchName.slice(0, 12) + '…' : b.batchName,
    fullName: b.batchName,
    percentage: b.percentage
  }));

  // Bar colors based on percentage
  const barColor = (pct) => {
    if (pct >= 80) return '#10b981'; // emerald
    if (pct >= 60) return '#f59e0b'; // amber
    return '#f43f5e';                 // rose
  };

  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1.5 mt-0.5">
            <Calendar className="w-3.5 h-3.5" />{today}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {overall.percentage > 0 && (
            <span className={`inline-flex items-center gap-1.5 text-sm font-bold px-3 py-1.5 rounded-xl
              ${overall.percentage >= 75
                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400'
                : 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400'
              }`}>
              <TrendingUp className="w-3.5 h-3.5" />
              {overall.percentage}% Overall
            </span>
          )}
        </div>
      </motion.div>

      {/* ── Stat Cards Row ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Students"   value={counts.totalStudents}
          icon={Users}       iconBg="bg-blue-50 dark:bg-blue-500/10"
          iconColor="text-blue-600 dark:text-blue-400"
          delay={0}
        />
        <StatCard
          label="Batches"    value={counts.totalBatches}
          icon={Layers}      iconBg="bg-violet-50 dark:bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
          delay={0.04}
        />
        {isAdmin && (
          <StatCard
            label="Teachers"    value={counts.totalTeachers}
            icon={GraduationCap} iconBg="bg-indigo-50 dark:bg-indigo-500/10"
            iconColor="text-indigo-600 dark:text-indigo-400"
            delay={0.08}
          />
        )}
        <StatCard
          label="Today's %" value={`${tod.percentage}%`}
          sub={tod.total === 0 ? 'No records yet' : `${tod.total} records`}
          icon={Activity}    iconBg={tod.percentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}
          iconColor={tod.percentage >= 75 ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}
          delay={0.12}
        />
        <StatCard
          label="Present"   value={tod.present}
          sub="today"
          icon={CheckCircle} iconBg="bg-emerald-50 dark:bg-emerald-500/10"
          iconColor="text-emerald-600 dark:text-emerald-400"
          delay={0.16}
        />
        <StatCard
          label="Absent"    value={tod.absent}
          sub="today"
          icon={XCircle}    iconBg="bg-rose-50 dark:bg-rose-500/10"
          iconColor="text-rose-600 dark:text-rose-400"
          delay={0.2}
        />
        <StatCard
          label="Leave"     value={tod.leave}
          sub="today"
          icon={Calendar}   iconBg="bg-violet-50 dark:bg-violet-500/10"
          iconColor="text-violet-600 dark:text-violet-400"
          delay={0.24}
        />
        {isAdmin && fees && (
          <>
            <StatCard
              label="Fees Collected" value={`₹${(fees.totalCollected || 0).toLocaleString()}`}
              icon={DollarSign} iconBg="bg-emerald-50 dark:bg-emerald-500/10"
              iconColor="text-emerald-600 dark:text-emerald-400"
              delay={0.28}
            />
            <StatCard
              label="Pending Fees" value={`₹${(fees.totalPending || 0).toLocaleString()}`}
              icon={CreditCard} iconBg="bg-rose-50 dark:bg-rose-500/10"
              iconColor="text-rose-600 dark:text-rose-400"
              delay={0.32}
            />
          </>
        )}
      </div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Monthly Trend — spans 3 cols */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          className="lg:col-span-3 premium-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-slate-800 dark:text-white">Monthly Attendance %</h2>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">Last 30 days</span>
          </div>

          {monthlyTrend.length > 0 ? (
            <div className="h-52 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyTrend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#6366f1" stopOpacity={0.25} />
                      <stop offset="95%"  stopColor="#6366f1" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={fmtShort}
                    axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    interval="preserveStartEnd"
                    dy={6}
                  />
                  <YAxis
                    domain={[0, 100]} axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip content={<AreaTooltip />} />
                  <Area
                    type="monotone" dataKey="percentage"
                    stroke="#6366f1" strokeWidth={2.5}
                    fill="url(#trendGrad)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No attendance records in the last 30 days" />
          )}
        </motion.div>

        {/* Batch-wise Attendance — spans 2 cols */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28 }}
          className="lg:col-span-2 premium-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-slate-800 dark:text-white">Batch-wise Attendance</h2>
          </div>

          {barData.length > 0 ? (
            <div className="h-52 -ml-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }} barSize={20}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                  <XAxis
                    dataKey="name" axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} dy={6}
                  />
                  <YAxis
                    domain={[0, 100]} axisLine={false} tickLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    tickFormatter={v => `${v}%`}
                  />
                  <Tooltip content={<BarTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                  <Bar dataKey="percentage" radius={[4, 4, 0, 0]}>
                    {barData.map((entry, idx) => (
                      <Cell key={idx} fill={barColor(entry.percentage)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <EmptyChart message="No batch data yet" />
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400"><span className="w-2.5 h-2.5 rounded-sm bg-emerald-500 inline-block" />≥ 80%</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400"><span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block" />60–79%</span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400"><span className="w-2.5 h-2.5 rounded-sm bg-rose-500 inline-block" />{' < 60%'}</span>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row: Recent Activity + Quick Actions ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Recent Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32 }}
          className="lg:col-span-1 premium-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-display font-bold text-slate-800 dark:text-white">Latest Notifications</h2>
            <div className="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center">
              <Bell className="w-4 h-4 text-primary-600 dark:text-primary-400" />
            </div>
          </div>

          <div className="flex-1 space-y-3">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <p className="text-xs font-medium">No recent notifications</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div key={n._id} className="flex gap-3 group">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${!n.isRead ? 'bg-primary-500 shadow-sm shadow-primary-500/50' : 'bg-slate-200 dark:bg-slate-700'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-bold leading-none mb-1 truncate ${!n.isRead ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{n.title}</p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-2 leading-relaxed">{n.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <button className="mt-4 w-full py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 bg-slate-50 dark:bg-white/5 transition-all">
            Open notification panel
          </button>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.34 }}
          className="lg:col-span-1 premium-card p-5 flex flex-col"
        >
          <div className="flex items-center justify-between mb-4 text-slate-800 dark:text-white">
            <h2 className="text-base font-display font-bold">Recent Attendance</h2>
            <Link to="/attendance" className="p-1.5 bg-slate-100 dark:bg-white/5 rounded-lg text-slate-400 hover:text-primary-500 transition-colors">
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="flex-1 space-y-3">
            {recentActivity.slice(0, 5).map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${statusColor(item.status)}`}>
                  {item.studentName.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-800 dark:text-white truncate leading-none">{item.studentName}</p>
                  <p className="text-[10px] text-slate-400 mt-1">{item.status} · {fmtShort(item.date)}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.36 }}
          className="lg:col-span-1 premium-card p-5 flex flex-col"
        >
          <h2 className="text-base font-display font-bold text-slate-800 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 gap-2">
            <QuickAction to="/attendance" icon={CheckSquare} label="Attendance" desc="Session record" color="primary" />
            <QuickAction to="/students" icon={UserPlus} label="Student" desc="Enroll new" color="blue" />
            <QuickAction to="/batches" icon={Plus} label="Batch" desc="Add cohort" color="violet" />
            <QuickAction to="/reports" icon={BarChart2} label="Reports" desc="Analytics" color="emerald" />
          </div>
        </motion.div>

      </div>
    </div>
  );
};

export default Dashboard;
