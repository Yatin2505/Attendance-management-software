import React, { useState, useEffect } from 'react';
import { getStudents } from '../services/studentService';
import { getBatches } from '../services/batchService';
import { getDateRangeReport } from '../services/reportService';
import { getAttendance } from '../services/attendanceService';
import { Link } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
      
      const [studentsData, batchesData, todayReportData, allAttendance] = await Promise.all([
        getStudents(),
        getBatches(),
        getDateRangeReport(todayDate, todayDate), // Gets today's aggregated stats across all batches
        getAttendance() // get all records to compute monthly timeline locally
      ]);

      let presentToday = 0;
      let totalTodayLogs = 0;

      // Report data returns array of students
      if (todayReportData && todayReportData.data) {
        todayReportData.data.forEach(student => {
           presentToday += student.presentDays;
           totalTodayLogs += student.totalDays; // totalDays per student in 1 day range is max 1
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

      // Compute Monthly Chart Data (Last 30 days of data)
      if (allAttendance && allAttendance.length > 0) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        // Group by Date string
        const dateMap = {};
        allAttendance.forEach(record => {
           const recDate = new Date(record.date);
           if (recDate >= thirtyDaysAgo) {
             const dayStr = recDate.toISOString().split('T')[0];
             if (!dateMap[dayStr]) {
               dateMap[dayStr] = { total: 0, present: 0 };
             }
             dateMap[dayStr].total += 1;
             if (record.status === 'present') {
               dateMap[dayStr].present += 1;
             }
           }
        });

        const sortedDates = Object.keys(dateMap).sort();
        const chartTimeseries = sortedDates.map(dateStr => {
           // Format to "Mar 12"
           const formatObj = new Date(dateStr);
           const displayDate = formatObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
           const dayStats = dateMap[dateStr];
           const percentage = Math.round((dayStats.present / dayStats.total) * 100);
           
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

  return (
    <div className="h-full flex flex-col space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-slate-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Overview</h1>
          <p className="text-slate-500 mt-1 font-medium">{currentDate}</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-3">
          <Link to="/attendance" className="px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl shadow-sm hover:bg-indigo-700 hover:shadow-md transition-all duration-200">
            Mark Attendance
          </Link>
          <Link to="/students" className="px-5 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-xl shadow-sm hover:bg-slate-200 transition-all duration-200">
            Add Student
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <>
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="premium-card p-6 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Total Students</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalStudents}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
                <span>Active enrollments</span>
              </div>
            </div>

            <div className="premium-card p-6 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Active Batches</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.totalBatches}</h3>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm text-slate-500 font-medium">
                <span>Total cohorts mapped</span>
              </div>
            </div>

            <div className="premium-card p-6 flex flex-col">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Today's Attendance</p>
                  <h3 className="text-3xl font-bold text-slate-800 mt-2">{stats.todayPercentage}%</h3>
                </div>
                <div className={`p-3 rounded-xl ${stats.todayPercentage >= 75 ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600'}`}>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium">
                <span className="text-green-600 mr-2">{stats.todayPresent} Present</span>
                <span className="text-slate-300 mx-2">|</span>
                <span className="text-red-500">{stats.todayAbsent} Absent</span>
              </div>
            </div>
            
            <div className="premium-card p-6 flex flex-col justify-center bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none shadow-[0_8px_20px_-4px_rgba(79,70,229,0.4)]">
               <div>
                  <h3 className="text-2xl font-bold mb-1">Generate Reports</h3>
                  <p className="text-indigo-100 text-sm mb-4">Export full student attendance data to CSV instantly.</p>
                  <Link to="/reports" className="inline-block px-4 py-2 bg-white text-indigo-700 font-semibold rounded-lg text-sm shadow-sm hover:shadow-md transition">
                    View Analytics →
                  </Link>
               </div>
            </div>

          </div>

          {/* Data Tables & Charts Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
            {/* Visual Chart */}
            <div className="premium-card lg:col-span-2 p-6 flex flex-col min-h-[350px]">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex justify-between items-center">
                Monthly Attendance Trend
                <span className="text-xs font-medium px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md">Last 30 Days</span>
              </h3>
              {chartData.length > 0 ? (
                 <div className="flex-1 w-full h-full min-h-[250px] -ml-4">
                   <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                       <defs>
                         <linearGradient id="colorPct" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                         </linearGradient>
                       </defs>
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                       <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} domain={[0, 100]} />
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                       <Tooltip 
                         cursor={{ stroke: '#4F46E5', strokeWidth: 1, strokeDasharray: '3 3' }} 
                         contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }} 
                         formatter={(value, name) => [name === 'percentage' ? `${value}%` : value, name.charAt(0).toUpperCase() + name.slice(1)]}
                       />
                       <Area type="monotone" dataKey="percentage" name="Attendance Rate" stroke="#4F46E5" strokeWidth={3} fillOpacity={1} fill="url(#colorPct)" />
                     </AreaChart>
                   </ResponsiveContainer>
                 </div>
              ) : (
                <div className="flex-1 flex items-center justify-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                  <p>Not enough attendance data recorded.</p>
                </div>
              )}
            </div>

            {/* Quick Actions / Activity Feed */}
            <div className="premium-card p-6 flex flex-col">
              <h3 className="text-lg font-bold text-slate-800 mb-6">Quick Tasks</h3>
              <div className="space-y-4">
                 <Link to="/batches" className="group flex items-center p-4 border border-slate-100 rounded-xl hover:border-indigo-200 hover:bg-indigo-50/50 transition">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition">
                       +
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-slate-800">Create New Batch</p>
                      <p className="text-xs text-slate-500">Organize students quickly</p>
                    </div>
                 </Link>
                 <Link to="/students" className="group flex items-center p-4 border border-slate-100 rounded-xl hover:border-blue-200 hover:bg-blue-50/50 transition">
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
                       +
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-semibold text-slate-800">Enroll Students</p>
                      <p className="text-xs text-slate-500">Add individuals directly</p>
                    </div>
                 </Link>
                 <div className="mt-auto pt-6 border-t border-slate-100 text-center">
                    <p className="text-xs text-slate-400 font-medium tracking-wide">ATTENDANCE SYSTEM V1.0</p>
                 </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
