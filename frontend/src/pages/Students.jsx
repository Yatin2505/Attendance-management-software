import React, { useState, useEffect, useMemo } from 'react';
import { getStudents, createStudent, updateStudent, deleteStudent, importStudents } from '../services/studentService';
import { getBatches } from '../services/batchService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, Filter, Users, X, GraduationCap, CheckSquare, Square, Inbox, UploadCloud } from 'lucide-react';
import * as XLSX from 'xlsx';
import { getCurrentUser } from '../services/authService';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBatch, setFilterBatch] = useState('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentStudent, setCurrentStudent] = useState(null);
  const [formData, setFormData] = useState({ name: '', rollNumber: '', batches: [] });
  const [processing, setProcessing] = useState(false);
  const [importing, setImporting] = useState(false);
  const currentUser = getCurrentUser();

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setImporting(true);
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const wsname = workbook.SheetNames[0];
      const ws = workbook.Sheets[wsname];
      const json = XLSX.utils.sheet_to_json(ws);
      
      const formattedStudents = json.map(row => ({
        name: String(row.Name || row.name || ''),
        rollNumber: String(row['Roll Number'] || row.RollNumber || row.rollNumber || row.roll || ''),
        batchId: filterBatch || null 
      }));

      if (!formattedStudents[0]?.name || !formattedStudents[0]?.rollNumber) {
        toast.error("Invalid format. Ensure 'Name' and 'Roll Number' columns exist.");
        e.target.value = null;
        return;
      }

      const res = await importStudents(formattedStudents);
      toast.success(res.message || 'Students imported successfully');
      fetchData();
    } catch (error) {
       toast.error(error.response?.data?.message || 'Failed to parse Excel file. Ensure valid headers.');
    } finally {
      setImporting(false);
      e.target.value = null;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsData, batchesData] = await Promise.all([
        getStudents(),
        getBatches()
      ]);
      setStudents(studentsData);
      setBatches(batchesData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (student = null) => {
    if (student) {
      setIsEditing(true);
      setCurrentStudent(student);
      setFormData({
        name: student.name,
        rollNumber: student.rollNumber,
        batches: student.batches ? student.batches.map(b => b._id || b) : []
      });
    } else {
      setIsEditing(false);
      setCurrentStudent(null);
      setFormData({ name: '', rollNumber: '', batches: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', rollNumber: '', batches: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (isEditing) {
        await updateStudent(currentStudent._id, formData);
        toast.success('Student updated successfully');
      } else {
        await createStudent(formData);
        toast.success('Student added successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await deleteStudent(id);
        toast.success('Student deleted successfully');
        setStudents(students.filter(s => s._id !== id));
      } catch (error) {
        toast.error('Failed to delete student');
      }
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter(student => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
                            
      const passesBatchFilter = filterBatch 
        ? student.batches && student.batches.some(b => (b._id || b) === filterBatch)
        : true;
        
      return matchesSearch && passesBatchFilter;
    });
  }, [students, searchTerm, filterBatch]);

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
            <GraduationCap className="w-8 h-8 text-primary-500" />
            Students Directory
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm">Manage student profiles and enrollment records</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full xl:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search students..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium"
            />
          </div>
          
          <div className="relative w-full sm:w-56">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-slate-400" />
            </div>
            <select 
              className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium appearance-none"
              value={filterBatch}
              onChange={(e) => setFilterBatch(e.target.value)}
            >
              <option value="">All Batches</option>
              {batches.map(batch => (
                <option key={batch._id} value={batch._id}>{batch.name}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {currentUser?.role === 'admin' && (
            <div className="relative group/btn cursor-pointer">
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileUpload}
                title=""
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                disabled={importing}
              />
              <button 
                type="button"
                className={`flex items-center justify-center gap-2 px-6 py-3 bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-2xl shadow-sm group-hover/btn:border-primary-500/50 group-hover/btn:shadow-md transition-all w-full sm:w-auto ${importing ? 'opacity-50 cursor-wait' : ''}`}
                disabled={importing}
              >
                {importing ? <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div> : <UploadCloud className="w-5 h-5 text-primary-500" />}
                Import Excel
              </button>
            </div>
          )}

          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Student
          </button>
        </div>
      </motion.div>
      
      {/* Data Table Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="premium-card flex-1 overflow-hidden flex flex-col rounded-3xl"
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider font-bold">
                <th className="py-5 px-6">Student Information</th>
                <th className="py-5 px-6">Roll Number</th>
                <th className="py-5 px-6">Enrolled Batches</th>
                <th className="py-5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50 bg-white/40 dark:bg-slate-900/20 backdrop-blur-sm">
              {loading ? (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Loading student records...</p>
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="4" className="py-24 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-500 dark:text-slate-400">
                      <Inbox className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                      <p className="font-display font-bold text-xl text-slate-700 dark:text-slate-300">No students found</p>
                      <p className="text-sm mt-2 font-medium">Try adjusting your search criteria or add a new student.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                <AnimatePresence>
                  {filteredStudents.map((student, idx) => (
                    <motion.tr 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2, delay: idx * 0.03 }}
                      key={student._id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-primary-700 dark:text-white font-bold text-sm shadow-inner overflow-hidden relative">
                            <span className="relative z-10">{student.name.charAt(0)}</span>
                            <div className="absolute inset-0 bg-white/40 dark:bg-transparent backdrop-blur-sm" />
                          </div>
                          <div className="font-bold text-slate-800 dark:text-slate-100 text-sm">{student.name}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="font-mono text-sm text-slate-500 dark:text-slate-400 font-medium">#{student.rollNumber}</span>
                      </td>
                      <td className="py-4 px-6">
                        {student.batches && student.batches.length > 0 ? (
                           <div className="flex flex-wrap gap-2">
                             {student.batches.map((b, idx) => {
                               const batchName = b.name || batches.find(bat => bat._id === (b._id || b))?.name || 'Assigned';
                               return (
                                 <span key={idx} className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 shadow-sm">
                                   {batchName}
                                 </span>
                               );
                             })}
                           </div>
                        ) : (
                           <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shadow-sm">
                             Unassigned
                           </span>
                        )}
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-end gap-2">
                          <button 
                            onClick={() => handleOpenModal(student)}
                            className="p-2 text-slate-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-xl transition-all shadow-sm border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                            title="Edit Student"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleDelete(student._id)}
                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-800"
                            title="Delete Student"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="glass-panel w-full max-w-lg overflow-hidden rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500"></div>
              
              <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-5 h-5 text-primary-500" /> : <GraduationCap className="w-5 h-5 text-primary-500" />}
                  {isEditing ? 'Edit Student Profile' : 'New Student Registration'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 bg-white dark:bg-slate-900">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. Jane Doe"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      disabled={processing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Roll Number <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. CS-2024-001"
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                      value={formData.rollNumber}
                      onChange={(e) => setFormData({...formData, rollNumber: e.target.value})}
                      disabled={processing}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-slate-400" />
                    Assign to Batches
                  </label>
                  <div className="max-h-52 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-2xl p-3 space-y-2 bg-slate-50/50 dark:bg-slate-800/50 custom-scrollbar">
                    {batches.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400 p-4 text-center flex flex-col items-center">
                        <Inbox className="w-8 h-8 mb-2 opacity-50" />
                        No batches available. Please create one first in the Batches tab.
                      </div>
                    ) : (
                      batches.map(batch => {
                        const isChecked = formData.batches.includes(batch._id);
                        return (
                          <label 
                            key={batch._id} 
                            className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all cursor-pointer ${
                              isChecked 
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
                                : 'border-transparent bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 shadow-sm'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex items-center justify-center rounded-lg transition-colors ${isChecked ? 'text-primary-500' : 'text-slate-300 dark:text-slate-600'}`}>
                                {isChecked ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                              </div>
                              <div>
                                <span className={`text-sm font-bold block ${isChecked ? 'text-primary-700 dark:text-primary-300' : 'text-slate-700 dark:text-slate-300'}`}>
                                  {batch.name}
                                </span>
                                {batch.timing && <span className="text-xs text-slate-500 font-medium">{batch.timing}</span>}
                              </div>
                            </div>
                            
                            {/* Hidden checkbox for accessibility */}
                            <input 
                              type="checkbox" 
                              className="sr-only"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, batches: [...formData.batches, batch._id]});
                                } else {
                                  setFormData({...formData, batches: formData.batches.filter(id => id !== batch._id)});
                                }
                              }}
                              disabled={processing}
                            />
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl">
                  <button 
                    type="button" 
                    onClick={handleCloseModal}
                    disabled={processing}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={processing}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center min-w-[120px] justify-center"
                  >
                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isEditing ? 'Save Profile' : 'Register Student')}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Students;
