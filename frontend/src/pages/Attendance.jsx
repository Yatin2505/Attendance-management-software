import React, { useState, useEffect } from 'react';
import { getBatches } from '../services/batchService';
import { getAttendance, markAttendance, updateAttendance, markAllPresent } from '../services/attendanceService';
import toast from 'react-hot-toast';

const Attendance = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [batches, setBatches] = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  
  const [students, setStudents] = useState([]);
  const [existingRecords, setExistingRecords] = useState({}); // { studentId: record }
  const [localStatuses, setLocalStatuses] = useState({}); // { studentId: 'present' | 'absent' }
  
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
      
      // We already have students inside the fetched batches, 
      // but let's find the specific batch to get its students.
      const batchObj = batches.find(b => b._id === batchId);
      if (!batchObj) return;

      const batchStudents = batchObj.students || [];
      setStudents(batchStudents);

      // Fetch existing records for this date & batch
      const records = await getAttendance(selectedDate, batchId, '');
      
      const recordMap = {};
      const statusMap = {};

      records.forEach(record => {
        const sid = record.studentId._id || record.studentId;
        recordMap[sid] = record;
        statusMap[sid] = record.status;
      });

      // For students without a record, default to 'present'
      batchStudents.forEach(student => {
        if (!statusMap[student._id]) {
          statusMap[student._id] = 'present'; 
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

  const handleToggle = (studentId) => {
    setLocalStatuses(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleMarkAllPresentQuick = async () => {
    // This explicitly triggers the backend "mark-all" mechanism
    if (!selectedBatchId || !date) return;
    setIsSaving(true);
    try {
      await markAllPresent(selectedBatchId, date);
      toast.success('All unrecorded students marked as present');
      // Refetch
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
      // Loop through all students and save their localStatus
      const promises = students.map(async (student) => {
        const sid = student._id;
        const currentStatus = localStatuses[sid];
        const existingRecord = existingRecords[sid];

        try {
          if (existingRecord) {
            // Only update if status actually changed
            if (existingRecord.status !== currentStatus) {
              await updateAttendance(existingRecord._id, currentStatus);
              successCount++;
            }
          } else {
            // Create new record
            await markAttendance({
              studentId: sid,
              batchId: selectedBatchId,
              date: date,
              status: currentStatus
            });
            successCount++;
          }
        } catch (err) {
          errorCount++;
          console.error(err);
        }
      });

      await Promise.all(promises);

      if (errorCount > 0) {
        toast.error(`Saved with ${errorCount} errors`);
      } else if (successCount > 0) {
        toast.success(`Successfully saved attendance`);
      } else {
        toast('No changes detected', { icon: 'ℹ️' });
      }

      // Refetch logic to sync DB IDs
      await loadBatchData(selectedBatchId, date);
    } catch (error) {
      toast.error('A critical error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <h1 className="text-2xl font-bold text-gray-800">Mark Attendance</h1>
        
        <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4 w-full md:w-auto">
          <input 
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            disabled={isSaving || loadingData}
            max={new Date().toISOString().split('T')[0]} // Optional: prevent future dates
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto"
          />
          <select
             value={selectedBatchId}
             onChange={(e) => setSelectedBatchId(e.target.value)}
             disabled={loadingBatches || isSaving || loadingData}
             className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none w-full sm:w-auto min-w-[200px]"
          >
             <option value="">-- Select a Batch --</option>
             {batches.map(b => (
               <option key={b._id} value={b._id}>{b.name}</option>
             ))}
          </select>
        </div>
      </div>

      {!selectedBatchId ? (
        <div className="premium-card p-8 text-center flex-1 flex flex-col items-center justify-center">
          <div className="text-indigo-200 mb-4">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <h2 className="text-xl font-medium text-gray-700 mb-2">Select a batch to begin</h2>
          <p className="text-gray-500 mb-6 max-w-md">Please choose a batch from the dropdown above to load enrolled students and mark their attendance for {date}.</p>
        </div>
      ) : loadingData ? (
        <div className="flex-1 flex justify-center items-center py-20 premium-card">
           <div className="flex flex-col items-center">
             <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-4"></div>
             <p className="text-gray-500">Loading student records...</p>
           </div>
        </div>
      ) : students.length === 0 ? (
        <div className="premium-card p-8 text-center flex-1 flex flex-col items-center justify-center">
          <p className="text-gray-500 text-lg">No students are currently enrolled in this batch.</p>
        </div>
      ) : (
        <div className="premium-card overflow-hidden flex-1 flex flex-col">
          <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center flex-wrap gap-4">
            <span className="text-gray-600 font-medium whitespace-nowrap">
               Showing {students.length} Student{students.length !== 1 ? 's' : ''}
            </span>
            <div className="flex space-x-3 w-full sm:w-auto">
              <button 
                onClick={handleMarkAllPresentQuick}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 py-2 bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition whitespace-nowrap font-medium disabled:opacity-50"
              >
                Mark All Present
              </button>
              <button 
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className="flex-1 sm:flex-none px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition whitespace-nowrap font-medium disabled:opacity-50 flex items-center justify-center"
              >
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </div>
          
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left border-collapse min-w-[500px]">
              <thead className="bg-white sticky top-0 z-10 shadow-sm">
                <tr className="border-b border-gray-200 text-gray-500 text-sm uppercase tracking-wider">
                  <th className="py-4 px-6 font-semibold w-1/2">Student Details</th>
                  <th className="py-4 px-6 font-semibold text-center w-1/4">Status</th>
                  <th className="py-4 px-6 font-semibold text-right w-1/4">Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 overflow-y-auto">
                {students.map(student => {
                   const status = localStatuses[student._id];
                   const isPresent = status === 'present';

                   return (
                    <tr key={student._id} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-800 text-lg">{student.name}</div>
                        <div className="text-gray-500 text-sm mt-0.5">{student.rollNumber}</div>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          isPresent 
                            ? 'bg-green-100 text-green-800 border border-green-200' 
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                          {isPresent ? 'Present' : 'Absent'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        {/* Toggle UI */}
                        <button
                          onClick={() => handleToggle(student._id)}
                          disabled={isSaving}
                          className={`relative inline-flex items-center h-8 rounded-full w-14 transition-colors focus:outline-none disabled:opacity-50 ${
                            isPresent ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        >
                          <span 
                            className={`inline-block w-6 h-6 transform bg-white rounded-full transition-transform ${
                              isPresent ? 'translate-x-7' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      </td>
                    </tr>
                   )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Attendance;
