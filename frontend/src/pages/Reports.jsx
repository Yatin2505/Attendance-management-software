import React, { useState, useEffect } from 'react';
import { getBatches } from '../services/batchService';
import { getStudents } from '../services/studentService';
import { getBatchReport, getDateRangeReport, getStudentReport } from '../services/reportService';
import toast from 'react-hot-toast';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';

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

  const pieColors = ['#10B981', '#EF4444']; // Green for present, Red for absent

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Analytics & Reports</h1>
      </div>

      <div className="premium-card p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Report Type Selector */}
          <div className="w-full md:w-1/4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => {
                setReportType(e.target.value);
                setReportData(null);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="batch">Batch-wise Report</option>
              <option value="range">Date Range Report</option>
              <option value="student">Individual Student Report</option>
            </select>
          </div>

          {/* Dynamic Filters */}
          <div className="flex-1 flex flex-col md:flex-row gap-4 items-end">
            {(reportType === 'batch' || reportType === 'range') && (
              <div className="w-full md:w-1/3">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {reportType === 'range' ? 'Batch (Optional)' : 'Select Batch'}
                </label>
                <select
                  value={selectedBatchId}
                  onChange={(e) => setSelectedBatchId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">{reportType === 'range' ? 'All Batches' : '-- Select Batch --'}</option>
                  {batches.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </div>
            )}

            {reportType === 'range' && (
              <>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">From Date</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">To Date</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </>
            )}

            {reportType === 'student' && (
              <div className="w-full md:flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Student</label>
                <select
                  value={selectedStudentId}
                  onChange={(e) => setSelectedStudentId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
                  ))}
                </select>
              </div>
            )}

            {/* Generate Button */}
            <div className="w-full md:w-auto mt-4 md:mt-0 pt-1">
              <button
                onClick={handleGenerateReport}
                disabled={loading}
                className="w-full px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 overflow-hidden flex flex-col space-y-6">
        {!reportData && !loading && (
          <div className="premium-card flex-1 flex items-center justify-center p-8">
            <div className="text-center">
              <span className="text-5xl mb-4 block">📊</span>
              <p className="text-gray-500 text-lg">Select criteria and generate a report to view analytics.</p>
            </div>
          </div>
        )}

        {loading && (
          <div className="premium-card flex-1 flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
          </div>
        )}

        {reportData && !loading && (
          <>
            {/* Action Bar */}
            <div className="flex justify-between items-center premium-card p-4">
               <h2 className="text-lg font-bold text-gray-800">
                  {reportType === 'batch' && `Batch Summary: ${reportData.batch?.name || 'Unknown'}`}
                  {reportType === 'range' && `Date Range: ${fromDate} to ${toDate}`}
                  {reportType === 'student' && `Student Profile: ${reportData.student?.name} (${reportData.student?.rollNumber})`}
               </h2>
               <button 
                  onClick={downloadCSV}
                  className="px-4 py-2 text-sm bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition whitespace-nowrap font-medium flex items-center"
               >
                 <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                 Export CSV
               </button>
            </div>

            {/* Charts Area */}
            {((reportType === 'batch' && reportData.studentsReport?.length > 0) || 
              (reportType === 'range' && reportData.data?.length > 0)) && (
              <div className="premium-card p-6" style={{ height: '350px' }}>
                <h3 className="text-sm font-semibold text-gray-500 mb-4 uppercase tracking-wider">Attendance Percentages</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportType === 'batch' ? reportData.studentsReport : reportData.data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{ fill: '#EEF2FF' }}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    />
                    <Legend />
                    <Bar dataKey="percentage" name="Attendance %" fill="#4F46E5" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {reportType === 'student' && reportData && (
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {/* Student KPI Cards */}
                 <div className="space-y-4">
                   <div className="premium-card p-6 flex items-center justify-between">
                     <div>
                       <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Overall Percentage</p>
                       <p className={`text-4xl font-bold mt-2 ${reportData.stats.percentage >= 75 ? 'text-green-500' : 'text-red-500'}`}>
                         {reportData.stats.percentage}%
                       </p>
                     </div>
                     <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500 block">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                     </div>
                   </div>
                   
                   <div className="grid grid-cols-2 gap-4">
                      <div className="premium-card p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase">Present Days</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.stats.presentDays}</p>
                      </div>
                      <div className="premium-card p-5">
                        <p className="text-xs font-medium text-gray-500 uppercase">Absent Days</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.stats.absentDays}</p>
                      </div>
                      <div className="premium-card p-5 col-span-2">
                        <p className="text-xs font-medium text-gray-500 uppercase">Total Logged Days</p>
                        <p className="text-2xl font-bold text-gray-800 mt-1">{reportData.stats.totalDays}</p>
                      </div>
                   </div>
                 </div>

                 {/* Pie Chart */}
                 <div className="premium-card p-6 flex flex-col items-center justify-center min-h-[300px]">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4 self-start">Attendance Ratio</h3>
                    {reportData.stats.totalDays === 0 ? (
                      <p className="text-gray-500">No data available for chart</p>
                    ) : (
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Present', value: reportData.stats.presentDays },
                              { name: 'Absent', value: reportData.stats.absentDays }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            <Cell fill="#10B981" />
                            <Cell fill="#EF4444" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    )}
                 </div>
               </div>
            )}

            {/* Detailed Table for Batch / Range */}
            {(reportType === 'batch' || reportType === 'range') && (
              <div className="premium-card overflow-hidden flex-1 flex flex-col min-h-[300px]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[600px]">
                    <thead className="bg-gray-50 border-b border-gray-100 text-gray-500 text-sm uppercase tracking-wider sticky top-0">
                      <tr>
                        <th className="py-4 px-6 font-semibold">Name</th>
                        <th className="py-4 px-6 font-semibold">Roll Number</th>
                        <th className="py-4 px-6 font-semibold text-center">Total Classes</th>
                        <th className="py-4 px-6 font-semibold text-center">Present</th>
                        <th className="py-4 px-6 font-semibold text-right">Percentage</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {(() => {
                        const iterable = reportType === 'batch' ? reportData.studentsReport : reportData.data;
                        if (!iterable || iterable.length === 0) {
                          return (
                            <tr>
                              <td colSpan="5" className="py-8 text-center text-gray-500">No data available for the selected parameters.</td>
                            </tr>
                          );
                        }
                        return iterable.map((row, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition">
                            <td className="py-4 px-6 font-medium text-gray-800">{row.name}</td>
                            <td className="py-4 px-6 text-gray-500">{row.rollNumber}</td>
                            <td className="py-4 px-6 text-center text-gray-700">{row.totalDays}</td>
                            <td className="py-4 px-6 text-center text-green-600 font-medium">{row.presentDays}</td>
                            <td className="py-4 px-6 text-right">
                               <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                  row.percentage >= 75 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
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
      </div>
    </div>
  );
};

export default Reports;
