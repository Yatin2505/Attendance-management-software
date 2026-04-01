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
    todayPercentage: 0
  });
  
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState([]);
  const [recentBatches, setRecentBatches] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const [studentsData, batchesData, allAttendance] = await Promise.all([
        getStudents(),
        getBatches(),
        getAttendance() // Assuming backend handles scoping based on logged-in teacher role
      ]);

      const myBatchesData = batchesData.filter(b => b.teacherId === user._id || b.teacher === user._id);
      setRecentBatches(myBatchesData.slice(0, 3)); // show max 3 batches

      // For a teacher, getStudents should ideally return only their students (backend handled)
      const totalStudents = studentsData.length;

      // Estimate today's attendance for teacher's batches
      const todayDate = new Date().toISOString().split('T')[0];
      let presentToday = 0;
      let totalTodayLogs = 0;

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateMap = {};

      if (allAttendance && allAttendance.length > 0) {
        allAttendance.forEach(record => {
           const recDate = new Date(record.date);
           const dayStr = recDate.toISOString().split('T')[0];
           
           if (dayStr === todayDate) {
              totalTodayLogs += 1;
              if (record.status === 'present') presentToday += 1;
           }

           if (recDate >= thirtyDaysAgo) {
             if (!dateMap[dayStr]) {
               dateMap[dayStr] = { total: 0, present: 0 };
             }
             dateMap[dayStr].total += 1;
             if (record.status === 'present') {
               dateMap[dayStr].present += 1;
             }
           }
        });
      }

      const absentToday = totalTodayLogs - presentToday;
      const pct = totalTodayLogs > 0 ? Math.round((presentToday / totalTodayLogs) * 100) : 0;

      setStats({
        totalStudents,
        myBatches: myBatchesData.length,
        todayPresent: presentToday,
        todayAbsent: absentToday,
        todayPercentage: pct
      });

      const sortedDates = Object.keys(dateMap).sort();
      const chartTimeseries = sortedDates.map(dateStr => {
          const formatObj = new Date(dateStr);
          const displayDate = formatObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const dayStats = dateMap[dateStr];
          const percentage = Math.round((dayStats.present / dayStats.total) * 100);
          return { name: displayDate, percentage, present: dayStats.present, absent: dayStats.total - dayStats.present };
      });

      setChartData(chartTimeseries);

    } catch (error) {
      console.error("Teacher Dashboard data load error:", error);
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
