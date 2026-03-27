import React, { useState, useEffect } from 'react';
import { getBatches, getBatchById } from '../services/batchService';
import { getAttendance, markAttendance, markAllPresent } from '../services/attendanceService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, CheckCircle, XCircle, Clock, Save, CheckSquare, Inbox, GraduationCap } from 'lucide-react';

const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  const [students, setStudents] = useState([]);
  const [existingRecords, setExistingRecords] = useState({}); // { studentId: record }
  const [localStatuses, setLocalStatuses] = useState({}); // { studentId: 'present' | 'absent' | 'late' }
  
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Initial load of batches
  useEffect(() => {
    fetchBatches();
  }, []);

  // Fetch contextual data when batch or date changes
  useEffect(() => {
    if (selectedBatchId && date) {
      loadBatchData(selectedBatchId, date);
    } else {
      setStudents([]);
      setExistingRecords({});
      setLocalStatuses({});
    }
  }, [selectedBatchId, date]);

  const fetchBatches = async () => {
    try {
      setLoadingBatches(true);
      const data = await getBatches();
      setBatches(data);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoadingBatches(false);
    }
  };

  const loadBatchData = async (batchId, selectedDate) => {
    try {
      setLoadingData(true);

      // Fetch batch with fully populated student objects
      const batchObj = await getBatchById(batchId);
      const batchStudents = batchObj.students || [];
      setStudents(batchStudents);

      // Fetch existing attendance records for this date & batch
      const records = await getAttendance(selectedDate, batchId, '');

      const recordMap = {};
      const statusMap = {};

      records.forEach(record => {
        const sid = typeof record.studentId === 'object' ? record.studentId._id : record.studentId;
        recordMap[sid] = record;
        statusMap[sid] = record.status;
      });

      // For students without a record yet, default to 'present'
      batchStudents.forEach(student => {
        const sid = student._id || student;
        if (!statusMap[sid]) {
          statusMap[sid] = 'present';
        }
      });

      setExistingRecords(recordMap);
      setLocalStatuses(statusMap);
    } catch (error) {
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingData(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setLocalStatuses(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAllPresentQuick = async () => {
    if (!selectedBatchId || !date) return;
    setIsSaving(true);
    try {
      await markAllPresent(selectedBatchId, date);
      toast.success('All unrecorded students marked as present');
      await loadBatchData(selectedBatchId, date);
    } catch (error) {
       toast.error(error.response?.data?.message || 'Failed to mark all');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAttendance = async () => {
    setIsSaving(true);
    let successCount = 0;
    let errorCount = 0;

    try {
      // Always use markAttendance (upsert) — backend handles create OR update
      const promises = students.map(async (student) => {
        const sid = student._id || student;
        const currentStatus = localStatuses[sid];
        if (!currentStatus) return;

        try {
          await markAttendance({
            studentId: sid,
            batchId: selectedBatchId,
            date: date,
            status: currentStatus
          });
          successCount++;
        } catch (err) {
          errorCount++;
          console.error('Failed to save for student', sid, err?.response?.data);
        }
      });

      await Promise.all(promises);

      if (errorCount > 0) {
        toast.error(`Saved with ${errorCount} error(s). Check console for details.`);
      } else {
        toast.success(`✅ Attendance saved for ${successCount} students!`);
      }

      // Reload to confirm server state
      await loadBatchData(selectedBatchId, date);
    } catch (error) {
      toast.error('A critical error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  // Stats for the header
  const presentCount = Object.values(localStatuses).filter(s => s === 'present').length;
  const absentCount = Object.values(localStatuses).filter(s => s === 'absent').length;
  const lateCount = Object.values(localStatuses).filter(s => s === 'late').length;

  return (
    <div className="h-full flex flex-col pb-6">
      {/* Header Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl mb-8 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-3">
            <CheckSquare className="w-8 h-8 text-primary-500" />
            Daily Attendance
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm">Monitor and record student participation</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center w-full xl:w-auto gap-4">
          <div className="relative w-full sm:w-48">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-slate-400" />
            </div>
            <input 
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={isSaving || loadingData}
              max={new Date().toISOString().split('T')[0]}
              className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium"
            />
          </div>
          
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Users className="h-5 w-5 text-slate-400" />
            </div>
            <select
               value={selectedBatchId}
               onChange={(e) => setSelectedBatchId(e.target.value)}
               disabled={loadingBatches || isSaving || loadingData}
               className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium appearance-none"
            >
               <option value="">Select a Cohort...</option>
               {batches.map(b => (
                 <option key={b._id} value={b._id}>{b.name}</option>
               ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </motion.div>

      {!selectedBatchId ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="premium-card p-12 text-center flex-1 flex flex-col items-center justify-center rounded-3xl"
        >
          <div className="w-24 h-24 bg-primary-50 dark:bg-primary-500/10 rounded-full flex items-center justify-center mb-6 shadow-inner">
            <CheckSquare className="w-12 h-12 text-primary-500" />
          </div>
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-3">Select a cohort to begin</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium max-w-md mx-auto">
            Please choose a batch from the dropdown above to load enrolled students and mark their attendance for the selected date.
          </p>
        </motion.div>
      ) : loadingData ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex justify-center items-center py-24 premium-card rounded-3xl"
        >
           <div className="flex flex-col items-center">
             <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mb-6 shadow-lg shadow-primary-500/20"></div>
             <p className="text-slate-500 dark:text-slate-400 font-bold tracking-wide animate-pulse">Synchronizing Records...</p>
           </div>
        </motion.div>
      ) : students.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="premium-card p-12 text-center flex-1 flex flex-col items-center justify-center rounded-3xl"
        >
          <Inbox className="w-20 h-20 text-slate-300 dark:text-slate-600 mb-6" />
          <h2 className="text-2xl font-display font-bold text-slate-800 dark:text-white mb-2">Empty Roster</h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg font-medium">No students are currently enrolled in this cohort.</p>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col gap-6"
        >
          {/* Action Dashboard */}
          <div className="glass-panel p-5 sm:p-6 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
            <div className="flex gap-4 sm:gap-8 w-full md:w-auto overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">Total</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-white">{students.length}</span>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-green-500 mb-1">Present</span>
                <span className="text-2xl font-bold text-green-600 dark:text-green-400">{presentCount}</span>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-red-500 mb-1">Absent</span>
                <span className="text-2xl font-bold text-red-600 dark:text-red-400">{absentCount}</span>
              </div>
              <div className="w-px h-10 bg-slate-200 dark:bg-slate-700 hidden sm:block"></div>
              <div className="flex flex-col">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-500 mb-1">Late</span>
                <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">{lateCount}</span>
              </div>
            </div>
            
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleMarkAllPresentQuick}
                disabled={isSaving}
                className="flex-1 md:flex-none px-5 py-2.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-xl hover:bg-green-100 dark:hover:bg-green-500/20 active:scale-95 transition-all font-bold disabled:opacity-50 text-sm whitespace-nowrap shadow-sm"
              >
                Mark All Present
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="flex-1 md:flex-none px-5 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white rounded-xl hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 transition-all font-bold disabled:opacity-50 text-sm whitespace-nowrap flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <Save className="w-4 h-4" />
                )}
                Save Changes
              </button>
            </div>
          </div>
          
          {/* Card Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mt-2">
            <AnimatePresence>
              {students.map((student, idx) => {
                 const status = localStatuses[student._id];
                 
                 // Dynamic styling based on status
                 let ringColor = 'ring-slate-200 dark:ring-slate-700';
                 let bgColor = 'bg-white dark:bg-slate-800';
                 let iconBg = 'bg-slate-100 dark:bg-slate-700';
                 let iconText = 'text-slate-400';
                 
                 if (status === 'present') {
                   ringColor = 'ring-green-400 dark:ring-green-500/50 shadow-green-500/10';
                   bgColor = 'bg-white dark:bg-slate-800';
                   iconBg = 'bg-green-100 dark:bg-green-500/20';
                   iconText = 'text-green-600 dark:text-green-400';
                 } else if (status === 'absent') {
                   ringColor = 'ring-red-400 dark:ring-red-500/50 shadow-red-500/10';
                   bgColor = 'bg-red-50/50 dark:bg-red-900/10';
                   iconBg = 'bg-red-100 dark:bg-red-500/20';
                   iconText = 'text-red-600 dark:text-red-400';
                 } else if (status === 'late') {
                   ringColor = 'ring-amber-400 dark:ring-amber-500/50 shadow-amber-500/10';
                   bgColor = 'bg-amber-50/30 dark:bg-amber-900/10';
                   iconBg = 'bg-amber-100 dark:bg-amber-500/20';
                   iconText = 'text-amber-600 dark:text-amber-400';
                 }

                 return (
                  <motion.div 
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2, delay: idx * 0.02 }}
                    key={student._id} 
                    className={`rounded-2xl p-5 ring-1 shadow-md transition-all duration-300 relative overflow-hidden group flex flex-col justify-between h-44 ${ringColor} ${bgColor}`}
                  >
                    {/* Status Background Glow */}
                    <div className={`absolute -top-10 -right-10 w-32 h-32 rounded-full blur-3xl opacity-20 transition-colors duration-500 ${status === 'present' ? 'bg-green-500' : status === 'absent' ? 'bg-red-500' : status === 'late' ? 'bg-amber-500' : 'bg-transparent'}`}></div>

                    <div className="flex items-start justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-sm transition-colors duration-300 ${iconBg} ${iconText}`}>
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-800 dark:text-white truncate max-w-[150px]">{student.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">#{student.rollNumber}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="grid grid-cols-3 gap-2 mt-4 relative z-10 bg-white/50 dark:bg-slate-900/50 p-1.5 rounded-xl backdrop-blur-sm border border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleStatusChange(student._id, 'present')}
                        disabled={isSaving}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                          status === 'present' 
                            ? 'bg-green-500 text-white shadow-md shadow-green-500/20 scale-105' 
                            : 'text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10'
                        }`}
                      >
                        <CheckCircle className="w-5 h-5 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Present</span>
                      </button>
                      
                      <button
                        onClick={() => handleStatusChange(student._id, 'late')}
                        disabled={isSaving}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                          status === 'late' 
                            ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 scale-105' 
                            : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10'
                        }`}
                      >
                        <Clock className="w-5 h-5 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Late</span>
                      </button>

                      <button
                        onClick={() => handleStatusChange(student._id, 'absent')}
                        disabled={isSaving}
                        className={`flex flex-col items-center justify-center py-2 rounded-lg transition-all duration-200 ${
                          status === 'absent' 
                            ? 'bg-red-500 text-white shadow-md shadow-red-500/20 scale-105' 
                            : 'text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                        }`}
                      >
                        <XCircle className="w-5 h-5 mb-1" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Absent</span>
                      </button>
                    </div>
                  </motion.div>
                 )
              })}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default Attendance;
