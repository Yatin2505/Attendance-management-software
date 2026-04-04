import React, { useState, useEffect } from 'react';
import { getStudents } from '../services/studentService';
import { getBatches } from '../services/batchService';
import { getAttendance } from '../services/attendanceService';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Users, Layers, CheckCircle, CalendarDays, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import SkeletonLoader from '../components/SkeletonLoader';
import notificationService from '../services/notificationService';
import { Bell, Info, CheckCircle as CheckCircleIcon, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const TeacherDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    myBatches: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLeave: 0,
    todayPercentage: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsRes, batchesData, notificationsData] = await Promise.all([
        getDashboardStats(),
        getBatches(),
        notificationService.getNotifications()
      ]);
      
      setNotifications(notificationsData.notifications.slice(0, 4));

      // Fix: b.teacherId is populated, so it's an object. Comparison with user._id (string) was failing.
      const myBatchesData = batchesData.filter(b => 
        (b.teacherId?._id || b.teacherId) === user._id
      );
      setRecentBatches(myBatchesData.slice(0, 3));

      setStats({
        totalStudents: statsRes.counts.totalStudents,
        myBatches: statsRes.counts.totalBatches,
        todayPresent: statsRes.today.present,
        todayAbsent: statsRes.today.absent,
        todayLeave: statsRes.today.leave,
        todayPercentage: statsRes.today.percentage
      });

      const chartTimeseries = statsRes.monthlyTrend.map(d => ({
        name: new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        percentage: d.percentage,
        present: d.present,
        absent: d.total - d.present - d.leave,
        leave: d.leave
      }));

      setChartData(chartTimeseries);

    } catch (error) {
      console.error("Teacher Dashboard data load error:", error);
      toast.error("Failed to load dashboard statistics");
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-8 mt-4">
        <SkeletonLoader type="dashboard-widget" count={3} />
      </div>
    );
  }

  return (
    <motion.div 
      className="h-full flex flex-col space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Header Area */}
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-8 rounded-3xl border-l-[6px] border-l-accent-500">
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-800 dark:text-white tracking-tight">Welcome, {user?.name || 'Teacher'}</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{currentDate}</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4">
           <Link to="/attendance" className="px-6 py-3 bg-gradient-to-r from-accent-600 to-purple-600 text-white font-bold rounded-2xl shadow-lg shadow-accent-500/30 hover:shadow-accent-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Mark Attendance Today
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">My Students</p>
              <h3 className="text-4xl font-display font-bold text-slate-800 dark:text-white mt-2">{stats.totalStudents}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">My Batches</p>
              <h3 className="text-4xl font-display font-bold text-slate-800 dark:text-white mt-2">{stats.myBatches}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-500/20">
              <Layers className="w-6 h-6" />
            </div>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col relative overflow-hidden group">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Today's Attendance</p>
              <h3 className="text-4xl font-display font-bold text-slate-800 dark:text-white mt-2">{stats.todayPercentage}%</h3>
            </div>
            <div className={`p-3 rounded-2xl border ${stats.todayPercentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}>
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 pb-6">
        {/* Classes Today */}
        <div className="glass-panel rounded-3xl xl:col-span-1 p-8 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <CalendarDays className="text-accent-500 w-6 h-6" /> My Batches
          </h3>
          <div className="space-y-4 flex-1">
             {recentBatches.length > 0 ? (
                recentBatches.map(batch => (
                  <div key={batch._id} className="p-4 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl">
                    <p className="font-bold text-slate-800 dark:text-white">{batch.name}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">{batch.timing}</p>
                    <Link to="/attendance" className="mt-3 inline-flex items-center text-accent-600 dark:text-accent-400 text-sm font-bold hover:underline">
                       Mark now <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                ))
             ) : (
                <div className="text-slate-500 text-sm italic py-4">No batches assigned yet.</div>
             )}
          </div>
        </div>
        
        {/* Notifications */}
        <div className="glass-panel rounded-3xl xl:col-span-1 p-8 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
             <Bell className="text-accent-500 w-6 h-6" /> Recent Notifications
          </h3>
          <div className="space-y-4 flex-1">
             {notifications.length > 0 ? (
                notifications.map(n => (
                  <div key={n._id} className="p-4 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl relative overflow-hidden group">
                    {!n.isRead && <div className="absolute left-0 top-0 bottom-0 w-1 bg-accent-500" />}
                    <div className="flex justify-between items-start">
                      <p className={`text-xs font-bold ${!n.isRead ? 'text-slate-900 dark:text-white' : 'text-slate-500'}`}>{n.title}</p>
                      <span className="text-[10px] text-slate-400 font-medium">
                        {new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{n.message}</p>
                  </div>
                ))
             ) : (
                <div className="text-slate-500 text-sm italic py-4">No recent notifications.</div>
             )}
          </div>
          <button className="mt-6 w-full py-3 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all text-xs">
            Open full panel
          </button>
        </div>

        {/* Chart */}
        <div className="glass-panel rounded-3xl xl:col-span-2 p-8 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Class Attendance Trend</h3>
          </div>
          {chartData.length > 0 ? (
             <div className="flex-1 w-full h-full min-h-[250px] -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorPctTeach" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} dy={15} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} domain={[0, 100]} dx={-10} />
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                   <Tooltip 
                     cursor={{ stroke: '#a855f7', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                     contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 600, color: '#0f172a' }} 
                     itemStyle={{ color: '#a855f7', fontWeight: 700 }}
                     formatter={(value, name) => [name === 'percentage' ? `${value}%` : value, name.charAt(0).toUpperCase() + name.slice(1)]}
                   />
                   <Area type="monotone" dataKey="percentage" stroke="#a855f7" strokeWidth={4} fillOpacity={1} fill="url(#colorPctTeach)" />
                 </AreaChart>
               </ResponsiveContainer>
             </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 bg-slate-50/50 dark:bg-slate-900/50">
              <Layers className="w-12 h-12 mb-4 opacity-50" />
              <p className="font-medium">Not enough data to render chart.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TeacherDashboard;
