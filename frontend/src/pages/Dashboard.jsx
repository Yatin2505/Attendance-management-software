import React, { useState, useEffect } from 'react';
import { getStudents } from '../services/studentService';
import { getBatches } from '../services/batchService';
import { getDateRangeReport } from '../services/reportService';
import { getAttendanceTrends } from '../services/attendanceService';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { motion } from 'framer-motion';
import { Users, Layers, CheckCircle, Download, Plus, UserPlus } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
};

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalBatches: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayPercentage: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const todayDate = new Date().toISOString().split('T')[0];
      
      const [studentsData, batchesData, todayReportData, trendsData] = await Promise.all([
        getStudents(),
        getBatches(),
        getDateRangeReport(todayDate, todayDate),
        getAttendanceTrends(30)
      ]);

      let presentToday = 0;
      let totalTodayLogs = 0;

      if (todayReportData && todayReportData.data) {
        todayReportData.data.forEach(student => {
           presentToday += student.presentDays;
           totalTodayLogs += student.totalDays;
        });
      }

      const absentToday = totalTodayLogs - presentToday;
      const pct = totalTodayLogs > 0 ? Math.round((presentToday / totalTodayLogs) * 100) : 0;

      setStats({
        totalStudents: studentsData.length,
        totalBatches: batchesData.length,
        todayPresent: presentToday,
        todayAbsent: absentToday,
        todayPercentage: pct
      });

      if (trendsData && trendsData.length > 0) {
        const chartTimeseries = trendsData.map(dayStats => {
           const formatObj = new Date(dayStats.date);
           const displayDate = formatObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
           const percentage = dayStats.total > 0 ? Math.round((dayStats.present / dayStats.total) * 100) : 0;
           
           return {
             name: displayDate,
             percentage,
             present: dayStats.present,
             absent: dayStats.total - dayStats.present
           };
        });

        setChartData(chartTimeseries);
      } else {
        setChartData([]);
      }

    } catch (error) {
      console.error("Dashboard data load error:", error);
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (loading) {
    return (
      <div className="h-full flex flex-col space-y-8 mt-4">
        <SkeletonLoader type="dashboard-widget" count={4} />
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
      <motion.div variants={itemVariants} className="flex flex-col md:flex-row justify-between items-start md:items-center glass-panel p-8 rounded-3xl">
        <div>
          <h1 className="text-4xl font-display font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 tracking-tight">Overview</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">{currentDate}</p>
        </div>
        <div className="mt-6 md:mt-0 flex gap-4">
          <Link to="/attendance" className="px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 transition-all hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Mark Attendance
          </Link>
          <Link to="/students" className="px-6 py-3 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md text-slate-700 dark:text-slate-200 border border-slate-200/50 dark:border-slate-700 font-bold rounded-2xl shadow-sm hover:bg-white dark:hover:bg-slate-800 transition-all flex items-center gap-2">
            <UserPlus className="w-5 h-5" />
            Add Student
          </Link>
        </div>
      </motion.div>

      {/* KPI Cards Bento Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl group-hover:bg-blue-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total Students</p>
              <h3 className="text-4xl font-display font-bold text-slate-800 dark:text-white mt-2">{stats.totalStudents}</h3>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-100 dark:border-blue-500/20">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-auto pt-6 flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span>Active enrollments across all batches</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-purple-500/10 rounded-full blur-2xl group-hover:bg-purple-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Active Batches</p>
              <h3 className="text-4xl font-display font-bold text-slate-800 dark:text-white mt-2">{stats.totalBatches}</h3>
            </div>
            <div className="p-3 bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-100 dark:border-purple-500/20">
              <Layers className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-auto pt-6 flex items-center text-sm text-slate-500 dark:text-slate-400 font-medium">
            <span>Total active cohorts mapped</span>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col relative overflow-hidden group">
          <div className="absolute -right-6 -top-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Today's Rate</p>
              <h3 className="text-4xl font-display font-bold text-slate-800 dark:text-white mt-2">{stats.todayPercentage}%</h3>
            </div>
            <div className={`p-3 rounded-2xl border ${stats.todayPercentage >= 75 ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20'}`}>
              <CheckCircle className="w-6 h-6" />
            </div>
          </div>
          <div className="mt-auto pt-6 flex items-center text-sm font-bold">
            <span className="text-emerald-500 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-lg">{stats.todayPresent} Present</span>
            <span className="text-rose-500 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg ml-2">{stats.todayAbsent} Absent</span>
          </div>
        </motion.div>
        
        <motion.div variants={itemVariants} className="premium-card p-6 flex flex-col justify-between bg-gradient-to-br from-primary-600 to-accent-600 text-white border-transparent shadow-lg shadow-primary-500/20 relative overflow-hidden">
           <div className="absolute inset-0 bg-white/10 mix-blend-overlay"></div>
           <div className="relative z-10 h-full flex flex-col">
              <h3 className="text-2xl font-display font-bold mb-2">Export Data</h3>
              <p className="text-primary-100 text-sm font-medium leading-relaxed mb-6">Download comprehensive attendance analytics instantly.</p>
              <Link to="/reports" className="mt-auto w-full inline-flex justify-center items-center gap-2 py-3 bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 text-white font-bold rounded-xl shadow-sm transition-all duration-300">
                <Download className="w-4 h-4" />
                View Analytics
              </Link>
           </div>
        </motion.div>
      </div>

      {/* Data Tables & Charts Bento Area */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-6 flex-1 pb-6">
        
        {/* Visual Chart - spans 2 columns */}
        <div className="glass-panel rounded-3xl xl:col-span-2 p-8 flex flex-col min-h-[400px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white">Attendance Trend</h3>
            <span className="text-xs font-bold px-3 py-1.5 bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-lg border border-primary-100 dark:border-primary-500/20">Last 30 Days</span>
          </div>
          
          {chartData.length > 0 ? (
             <div className="flex-1 w-full h-full min-h-[250px] -ml-4">
               <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                   <defs>
                     <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                       <stop offset="5%" stopColor="#818cf8" stopOpacity={0.4}/>
                       <stop offset="95%" stopColor="#818cf8" stopOpacity={0}/>
                     </linearGradient>
                   </defs>
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} dy={15} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 500}} domain={[0, 100]} dx={-10} />
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                   <Tooltip 
                     cursor={{ stroke: '#818cf8', strokeWidth: 1.5, strokeDasharray: '4 4' }} 
                     contentStyle={{ backgroundColor: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(10px)', borderRadius: '16px', border: '1px solid rgba(226,232,240,0.8)', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.1)', fontWeight: 600, color: '#0f172a' }} 
                     itemStyle={{ color: '#4f46e5', fontWeight: 700 }}
                     formatter={(value, name) => [name === 'percentage' ? `${value}%` : value, name.charAt(0).toUpperCase() + name.slice(1)]}
                   />
                   <Area type="monotone" dataKey="percentage" name="Attendance Rate" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorPct)" />
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

        {/* Quick Actions / Activity Feed */}
        <div className="glass-panel rounded-3xl p-8 flex flex-col min-h-[400px]">
          <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-6">Quick Actions</h3>
          <div className="space-y-4 flex-1">
             <Link to="/batches" className="group flex items-center p-5 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:border-primary-300 dark:hover:border-primary-500/50 hover:bg-primary-50/50 dark:hover:bg-primary-900/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 flex items-center justify-center group-hover:bg-primary-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-primary-500/30 transition-all duration-300">
                   <Plus className="w-6 h-6" />
                </div>
                <div className="ml-5">
                  <p className="text-base font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">Create Batch</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Organize new cohorts</p>
                </div>
             </Link>
             
             <Link to="/students" className="group flex items-center p-5 bg-white/50 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50 rounded-2xl hover:border-accent-300 dark:hover:border-accent-500/50 hover:bg-accent-50/50 dark:hover:bg-accent-900/20 transition-all duration-300">
                <div className="w-12 h-12 rounded-xl bg-accent-100 dark:bg-accent-900/40 text-accent-600 dark:text-accent-400 flex items-center justify-center group-hover:bg-accent-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-accent-500/30 transition-all duration-300">
                   <UserPlus className="w-6 h-6" />
                </div>
                <div className="ml-5">
                  <p className="text-base font-bold text-slate-800 dark:text-white group-hover:text-accent-600 dark:group-hover:text-accent-400 transition-colors">Enroll Students</p>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-0.5">Add to existing batches</p>
                </div>
             </Link>
          </div>
          
          <div className="mt-8 pt-6 border-t border-slate-200/50 dark:border-slate-800/50 flex justify-between items-center">
             <div className="flex -space-x-3">
               {[1,2,3].map(i => (
                 <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-slate-200 dark:bg-slate-700"></div>
               ))}
               <div className="w-8 h-8 rounded-full border-2 border-white dark:border-slate-900 bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400">+{stats.totalBatches}</div>
             </div>
             <p className="text-xs text-slate-400 dark:text-slate-500 font-bold tracking-widest uppercase">System V2.0</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Dashboard;
