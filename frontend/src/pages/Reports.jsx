import React, { useState, useEffect } from 'react';
import { getBatches } from '../services/batchService';
import { getStudents } from '../services/studentService';
import { getBatchReport, getDateRangeReport, getStudentReport } from '../services/reportService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart as RechartsBarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  BarChart3, PieChart as PieChartIcon, Calendar, Users, FileText, Download, 
  TrendingUp, Award, UserCheck, UserX, Clock, Filter, Activity
} from 'lucide-react';

// Custom Recharts Tooltip for Neon Glass Theme
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-xl border border-slate-200/50 dark:border-slate-700/50 shadow-xl backdrop-blur-xl">
        <p className="font-bold text-slate-800 dark:text-white mb-2">{label}</p>
        {payload.map((entry, index) => (
          <div key={index} className="flex items-center gap-2 text-sm font-medium">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
            <span className="text-slate-600 dark:text-slate-300">{entry.name}:</span>
            <span className="text-slate-900 dark:text-white font-bold">{entry.value}{entry.name.includes('%') ? '%' : ''}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Reports = () => {
  const [reportType, setReportType] = useState('batch'); // 'batch', 'range', 'student'
  
  // Filters state
  const [batches, setBatches] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [fromDate, setFromDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // First of month
  const [toDate, setToDate] = useState(new Date().toISOString().split('T')[0]); // Today
  
  // Data state
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null); // structure varies freely based on type

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [batchesData, studentsData] = await Promise.all([
        getBatches(),
        getStudents()
      ]);
      setBatches(batchesData);
      setStudents(studentsData);
    } catch (error) {
      toast.error('Failed to load filter data');
    }
  };

  const handleGenerateReport = async () => {
    setLoading(true);
    setReportData(null);
    try {
      if (reportType === 'batch') {
        if (!selectedBatchId) return toast.error('Please select a batch');
        const data = await getBatchReport(selectedBatchId);
        setReportData(data);
      } else if (reportType === 'range') {
        if (!fromDate || !toDate) return toast.error('Please select date range');
        const data = await getDateRangeReport(fromDate, toDate, selectedBatchId);
        setReportData(data);
      } else if (reportType === 'student') {
        if (!selectedStudentId) return toast.error('Please select a student');
        const data = await getStudentReport(selectedStudentId);
        setReportData(data);
      }
      toast.success('Report generated successfully');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const downloadCSV = () => {
    if (!reportData) return;

    let headers = [];
    let rows = [];
    let filename = 'report.csv';

    if (reportType === 'batch' || reportType === 'range') {
      const arr = reportType === 'batch' ? reportData.studentsReport : reportData.data;
      if (!arr || arr.length === 0) return toast('No data to export', { icon: 'ℹ️' });

      headers = ['Roll Number', 'Name', 'Total Days', 'Present Days', 'Attendance %'];
      rows = arr.map(item => [
        item.rollNumber,
        item.name,
        item.totalDays,
        item.presentDays,
        item.percentage
      ]);
      filename = reportType === 'batch' ? `batch_report_${reportData.batch?.name || 'export'}.csv` : `range_report_${fromDate}_to_${toDate}.csv`;
    } else if (reportType === 'student') {
      headers = ['Student Name', 'Roll Number', 'Total Days', 'Present Days', 'Absent Days', 'Attendance %'];
      rows = [[
        reportData.student.name,
        reportData.student.rollNumber,
        reportData.stats.totalDays,
        reportData.stats.presentDays,
        reportData.stats.absentDays,
        reportData.stats.percentage
      ]];
      filename = `student_report_${reportData.student.rollNumber}.csv`;
    }

    const csvContent = "data:text/csv;charset=utf-8," 
        + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Chart Colors (Neon Glass Theme)
  const COLORS = ['#10B981', '#EF4444', '#F59E0B', '#3B82F6', '#8B5CF6'];
  const gradientId = "colorPercentage";

  return (
    <div className="h-full flex flex-col pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-8"
      >
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/30">
          <Activity className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white tracking-tight">Analytics & Reports</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Generate comprehensive insights and track performance</p>
        </div>
      </motion.div>

      {/* Filter Configuration Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-panel p-6 rounded-3xl mb-8 relative overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        
        <div className="flex flex-col xl:flex-row gap-6 items-end relative z-10">
          {/* Report Type Selector */}
          <div className="w-full xl:w-1/4">
            <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
              <Filter className="w-4 h-4 text-primary-500" />
              Report Type
            </label>
            <div className="relative">
              <select
                value={reportType}
                onChange={(e) => {
                  setReportType(e.target.value);
                  setReportData(null);
                }}
                className="block w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium appearance-none"
              >
                <option value="batch">Batch-wise Report</option>
                <option value="range">Date Range Report</option>
                <option value="student">Individual Student Report</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          {/* Dynamic Filters */}
          <div className="flex-1 w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(reportType === 'batch' || reportType === 'range') && (
              <div className="w-full">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  <Users className="w-4 h-4 text-primary-500" />
                  {reportType === 'range' ? 'Cohort (Optional)' : 'Select Cohort'}
                </label>
                <div className="relative">
                  <select
                    value={selectedBatchId}
                    onChange={(e) => setSelectedBatchId(e.target.value)}
                    className="block w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium appearance-none"
                  >
                    <option value="">{reportType === 'range' ? 'All Cohorts' : '-- Select Cohort --'}</option>
                    {batches.map(b => (
                      <option key={b._id} value={b._id}>{b.name}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}

            {reportType === 'range' && (
              <>
                <div className="w-full">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    From Date
                  </label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium"
                  />
                </div>
                <div className="w-full">
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                    <Clock className="w-4 h-4 text-primary-500" />
                    To Date
                  </label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="block w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium"
                  />
                </div>
              </>
            )}

            {reportType === 'student' && (
              <div className="w-full md:col-span-2">
                <label className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                  <UserCheck className="w-4 h-4 text-primary-500" />
                  Select Student
                </label>
                <div className="relative">
                  <select
                    value={selectedStudentId}
                    onChange={(e) => setSelectedStudentId(e.target.value)}
                    className="block w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium appearance-none"
                  >
                    <option value="">-- Choose Student --</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                    <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <div className="w-full xl:w-auto">
            <button
              onClick={handleGenerateReport}
              disabled={loading}
              className="w-full xl:w-40 px-6 py-3.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-2xl hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <BarChart3 className="w-5 h-5" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results Section */}
      <AnimatePresence mode="wait">
        <motion.div 
          key={reportData ? 'results' : 'empty'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="flex-1 flex flex-col space-y-6"
        >
          {!reportData && !loading && (
            <div className="premium-card flex-1 flex flex-col items-center justify-center p-12 rounded-3xl min-h-[400px]">
              <div className="w-32 h-32 bg-slate-50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-6 shadow-inner border border-slate-100 dark:border-slate-800">
                <PieChartIcon className="w-16 h-16 text-slate-300 dark:text-slate-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-2">Ready for Analytics</h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg font-medium text-center max-w-md">Configure your parameters above and click Generate to visualize attendance data.</p>
            </div>
          )}

          {loading && (
            <div className="premium-card flex-1 flex flex-col justify-center items-center p-12 rounded-3xl min-h-[400px]">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-primary-100 dark:border-slate-700 rounded-full"></div>
                <div className="w-20 h-20 border-4 border-primary-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Activity className="w-8 h-8 text-primary-500 animate-pulse" />
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold tracking-widest uppercase mt-8 animate-pulse text-sm">Compiling Data...</p>
            </div>
          )}

          {reportData && !loading && (
            <>
              {/* Report Header Action Bar */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 glass-panel p-5 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary-50 dark:bg-primary-500/10 rounded-xl text-primary-600 dark:text-primary-400">
                     <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                        {reportType === 'batch' && `Cohort Summary: ${reportData.batch?.name || 'Unknown'}`}
                        {reportType === 'range' && `Date Range Analytics`}
                        {reportType === 'student' && `Student Profile: ${reportData.student?.name}`}
                    </h2>
                    {reportType === 'range' && <p className="text-sm font-medium text-slate-500 mt-1">{fromDate} to {toDate}</p>}
                    {reportType === 'student' && <p className="text-sm font-medium text-slate-500 mt-1">Roll Index: {reportData.student?.rollNumber}</p>}
                  </div>
                </div>
                
                <button 
                    onClick={downloadCSV}
                    className="w-full md:w-auto px-5 py-2.5 bg-slate-900 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-800 dark:hover:bg-slate-600 hover:shadow-lg hover:shadow-slate-900/20 active:scale-95 transition-all font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV Report
                </button>
              </div>

              {/* Student Specific KPI Dashboard */}
              {reportType === 'student' && reportData && (
                 <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                   {/* Left Column KPIs */}
                   <div className="lg:col-span-5 grid grid-cols-2 gap-4">
                     <div className="col-span-2 premium-card p-6 flex items-center justify-between rounded-3xl relative overflow-hidden group">
                       <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                       <div className="relative z-10">
                         <p className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">Overall Reliability</p>
                         <div className="flex items-baseline gap-2">
                           <p className={`text-5xl font-display font-black tracking-tighter ${reportData.stats.percentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                             {reportData.stats.percentage}%
                           </p>
                           {reportData.stats.percentage >= 75 ? (
                             <TrendingUp className="w-6 h-6 text-green-500" />
                           ) : (
                             <Activity className="w-6 h-6 text-red-500" />
                           )}
                         </div>
                       </div>
                       <div className="w-16 h-16 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary-500 shadow-sm relative z-10 border border-slate-100 dark:border-slate-700">
                          <Award className="w-8 h-8" />
                       </div>
                     </div>
                     
                     <div className="premium-card p-6 rounded-3xl flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Present</p>
                          <p className="text-4xl font-display font-black text-slate-800 dark:text-white">{reportData.stats.presentDays}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 text-green-600 dark:text-green-400 font-medium text-sm">
                          <UserCheck className="w-4 h-4" /> Logged Days
                        </div>
                     </div>

                     <div className="premium-card p-6 rounded-3xl flex flex-col justify-between">
                        <div>
                          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Absent</p>
                          <p className="text-4xl font-display font-black text-slate-800 dark:text-white">{reportData.stats.absentDays}</p>
                        </div>
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50 flex items-center gap-2 text-red-600 dark:text-red-400 font-medium text-sm">
                          <UserX className="w-4 h-4" /> Missed Days
                        </div>
                     </div>
                   </div>

                   {/* Right Column Pie Chart */}
                   <div className="lg:col-span-7 premium-card p-6 rounded-3xl flex flex-col items-center justify-center min-h-[300px] relative">
                      <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-6 self-start w-full">Attendance Distribution</h3>
                      {reportData.stats.totalDays === 0 ? (
                        <div className="flex flex-col items-center text-slate-400">
                          <PieChartIcon className="w-12 h-12 mb-2 opacity-20" />
                          <p className="font-medium">No recorded data</p>
                        </div>
                      ) : (
                        <div className="w-full h-[250px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={[
                                  { name: 'Present', value: reportData.stats.presentDays },
                                  { name: 'Absent', value: reportData.stats.absentDays }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={8}
                                dataKey="value"
                                stroke="none"
                                cornerRadius={6}
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {['Present', 'Absent'].map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index]} />
                                ))}
                              </Pie>
                              <RechartsTooltip content={<CustomTooltip />} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      )}
                      
                      {/* Total overlay */}
                      {reportData.stats.totalDays > 0 && (
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[calc(50%-10px)] flex flex-col items-center justify-center text-center pointer-events-none">
                          <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                          <span className="text-2xl font-black text-slate-800 dark:text-white">{reportData.stats.totalDays}</span>
                        </div>
                      )}
                   </div>
                 </div>
              )}

              {/* Batch / Range Charts Area */}
              {((reportType === 'batch' && reportData.studentsReport?.length > 0) || 
                (reportType === 'range' && reportData.data?.length > 0)) && (
                <div className="premium-card p-6 rounded-3xl h-[400px]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Attendance Averages by Student</h3>
                  </div>
                  <ResponsiveContainer width="100%" height="100%" className="-ml-4">
                    <RechartsBarChart 
                      data={reportType === 'batch' ? reportData.studentsReport : reportData.data}
                      margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.9}/>
                          <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.6}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        dy={10}
                      />
                      <YAxis 
                        domain={[0, 100]} 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        dx={-10}
                      />
                      <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: 'currentColor', className: 'text-slate-100 dark:text-slate-800' }} />
                      <Bar 
                        dataKey="percentage" 
                        name="Attendance %" 
                        fill={`url(#${gradientId})`} 
                        radius={[6, 6, 0, 0]} 
                        barSize={32} 
                      />
                    </RechartsBarChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Detailed Table for Batch / Range */}
              {(reportType === 'batch' || reportType === 'range') && (
                <div className="premium-card overflow-hidden flex-1 flex flex-col rounded-3xl border border-slate-200/50 dark:border-slate-800">
                  <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <h3 className="text-sm font-bold text-slate-800 dark:text-white uppercase tracking-wider">Detailed Ledger</h3>
                  </div>
                  <div className="overflow-x-auto flex-1 custom-scrollbar">
                    <table className="w-full text-left border-collapse min-w-[600px]">
                      <thead className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-10 shadow-sm">
                        <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-widest font-bold">
                          <th className="py-5 px-6">Participant</th>
                          <th className="py-5 px-6">ID Number</th>
                          <th className="py-5 px-6 text-center">Total Sessions</th>
                          <th className="py-5 px-6 text-center">Attended</th>
                          <th className="py-5 px-6 text-right">Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {(() => {
                          const iterable = reportType === 'batch' ? reportData.studentsReport : reportData.data;
                          if (!iterable || iterable.length === 0) {
                            return (
                              <tr>
                                <td colSpan="5" className="py-12 text-center text-slate-500 dark:text-slate-400 font-medium bg-slate-50/30 dark:bg-transparent">
                                  No ledger data available for the selected parameters.
                                </td>
                              </tr>
                            );
                          }
                          return iterable.map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                              <td className="py-4 px-6">
                                <span className="font-bold text-slate-800 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{row.name}</span>
                              </td>
                              <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium font-mono text-sm">{row.rollNumber}</td>
                              <td className="py-4 px-6 text-center text-slate-700 dark:text-slate-300 font-medium">{row.totalDays}</td>
                              <td className="py-4 px-6 text-center text-green-600 dark:text-green-400 font-bold">{row.presentDays}</td>
                              <td className="py-4 px-6 text-right">
                                 <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                    row.percentage >= 75 
                                      ? 'bg-green-100 dark:bg-green-500/20 text-green-800 dark:text-green-400 border border-green-200 dark:border-green-500/30' 
                                      : 'bg-red-100 dark:bg-red-500/20 text-red-800 dark:text-red-400 border border-red-200 dark:border-red-500/30'
                                 }`}>
                                   {row.percentage}%
                                 </span>
                              </td>
                            </tr>
                          ))
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Reports;
