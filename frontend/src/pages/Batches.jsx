import React, { useState, useEffect, useMemo } from 'react';
import { getBatches, createBatch, updateBatch, deleteBatch, assignStudentToBatch, removeStudentFromBatch } from '../services/batchService';
import { getStudents } from '../services/studentService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Edit2, Trash2, ChevronDown, Clock, Users, X, UserMinus, UserPlus, FolderOpen } from 'lucide-react';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [expandedBatch, setExpandedBatch] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [formData, setFormData] = useState({ name: '', timing: '' });
  const [processing, setProcessing] = useState(false);

  const [selectedStudentToAdd, setSelectedStudentToAdd] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [batchesData, studentsData] = await Promise.all([
        getBatches(),
        getStudents()
      ]);
      setBatches(batchesData);
      setAllStudents(studentsData);
    } catch (error) {
      toast.error('Failed to load batches');
    } finally {
      setLoading(false);
    }
  };

  const filteredBatches = useMemo(() => {
    if (!searchQuery) return batches;
    const lowerQuery = searchQuery.toLowerCase();
    return batches.filter(b => 
      b.name.toLowerCase().includes(lowerQuery) || 
      (b.timing && b.timing.toLowerCase().includes(lowerQuery))
    );
  }, [batches, searchQuery]);

  const handleOpenModal = (batch = null) => {
    if (batch) {
      setIsEditing(true);
      setCurrentBatch(batch);
      setFormData({ name: batch.name, timing: batch.timing });
    } else {
      setIsEditing(false);
      setCurrentBatch(null);
      setFormData({ name: '', timing: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({ name: '', timing: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      if (isEditing) {
        await updateBatch(currentBatch._id, formData);
        toast.success('Batch updated successfully');
      } else {
        await createBatch(formData);
        toast.success('Batch created successfully');
      }
      handleCloseModal();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save batch');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this batch? Associated students will be unassigned.')) {
      try {
        await deleteBatch(id);
        toast.success('Batch deleted successfully');
        setBatches(batches.filter(b => b._id !== id));
        if (expandedBatch === id) setExpandedBatch(null);
      } catch (error) {
        toast.error('Failed to delete batch');
      }
    }
  };

  const toggleExpand = (id) => {
    setExpandedBatch(expandedBatch === id ? null : id);
    setSelectedStudentToAdd(''); 
  };

  const handleAssignStudent = async (batchId) => {
    if (!selectedStudentToAdd) return;
    setProcessing(true);
    try {
      await assignStudentToBatch(batchId, selectedStudentToAdd);
      toast.success('Student assigned to batch');
      setSelectedStudentToAdd('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign student');
    } finally {
      setProcessing(false);
    }
  };

  const handleRemoveStudent = async (batchId, studentId) => {
    if (window.confirm('Remove this student from the batch?')) {
      setProcessing(true);
      try {
        await removeStudentFromBatch(batchId, studentId);
        toast.success('Student removed from batch');
        fetchData();
      } catch (error) {
        toast.error('Failed to remove student');
      } finally {
        setProcessing(false);
      }
    }
  };

  const getAvailableStudents = (batchStudents) => {
    if (!batchStudents) return allStudents;
    const batchStudentIds = batchStudents.map(s => s._id);
    return allStudents.filter(s => !batchStudentIds.includes(s._id));
  };

  return (
    <div className="h-full flex flex-col pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Batches Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm">Organize and manage student cohorts</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search batches..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium"
            />
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Create Batch
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          <AnimatePresence>
            {filteredBatches.map((batch, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={batch._id} 
                className="premium-card overflow-hidden group"
              >
                <div 
                  className="p-6 sm:p-8 cursor-pointer flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  onClick={() => toggleExpand(batch._id)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                       <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 dark:text-white">
                         {batch.name}
                       </h2>
                       <span className="px-3 py-1 rounded-lg text-xs font-bold bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-500/20 flex items-center gap-1.5 shadow-sm">
                         <Users className="w-3.5 h-3.5" />
                         {batch.students?.length || 0}
                       </span>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 font-medium flex items-center text-sm">
                      <Clock className="w-4 h-4 mr-2 text-accent-500" />
                      {batch.timing || 'Schedule pending'}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2 md:gap-4 w-full md:w-auto justify-end">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleOpenModal(batch); }}
                      className="p-2.5 text-slate-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/40 rounded-xl transition-all shadow-sm border border-transparent hover:border-primary-200 dark:hover:border-primary-800"
                      title="Edit Batch"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={(e) => handleDelete(batch._id, e)}
                      className="p-2.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/40 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-800"
                      title="Delete Batch"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <div className={`p-2 rounded-xl text-slate-400 transition-transform duration-300 ${expandedBatch === batch._id ? 'rotate-180 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white' : 'group-hover:text-primary-500'}`}>
                      <ChevronDown className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <AnimatePresence>
                  {expandedBatch === batch._id && (
                    <motion.div 
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-6 sm:p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
                          <h3 className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <Users className="w-5 h-5 text-primary-500" />
                            Enrolled Students Roster
                          </h3>
                          
                          <div className="flex w-full md:w-auto items-center gap-3">
                            <select 
                              className="px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 outline-none flex-1 md:w-72 text-sm text-slate-700 dark:text-slate-300 font-medium transition-all"
                              value={selectedStudentToAdd}
                              onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                              disabled={processing}
                            >
                              <option value="">Select student to enroll...</option>
                              {getAvailableStudents(batch.students).map(student => (
                                <option key={student._id} value={student._id}>
                                  {student.name} ({student.rollNumber})
                                </option>
                              ))}
                            </select>
                            <button 
                              onClick={() => handleAssignStudent(batch._id)}
                              disabled={!selectedStudentToAdd || processing}
                              className={`px-5 py-2.5 bg-primary-600 text-white font-bold rounded-xl transition flex items-center gap-2 shadow-sm ${(!selectedStudentToAdd || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700 hover:shadow-md'}`}
                            >
                              <UserPlus className="w-4 h-4" />
                              <span className="hidden sm:inline">{processing ? 'Adding...' : 'Enroll'}</span>
                            </button>
                          </div>
                        </div>

                        {(!batch.students || batch.students.length === 0) ? (
                          <div className="text-center py-12 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-white/50 dark:bg-slate-800/50">
                            <Users className="w-12 h-12 mx-auto text-slate-300 dark:text-slate-600 mb-3" />
                            <p className="font-medium">No students enrolled yet.</p>
                            <p className="text-sm mt-1">Select a student from the dropdown to assign them.</p>
                          </div>
                        ) : (
                          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-sm whitespace-nowrap">
                                <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400">
                                  <tr>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs">Student Name</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs">Roll Number</th>
                                    <th className="py-4 px-6 font-bold uppercase tracking-wider text-xs text-right">Action</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                                  {batch.students.map((student, sIdx) => (
                                    <motion.tr 
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      transition={{ delay: sIdx * 0.05 }}
                                      key={student._id} 
                                      className="hover:bg-slate-50/80 dark:hover:bg-slate-700/30 transition-colors group/row"
                                    >
                                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary-200 to-primary-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-primary-700 dark:text-white font-bold text-xs ring-2 ring-white dark:ring-slate-800">
                                          {student.name.charAt(0)}
                                        </div>
                                        {student.name}
                                      </td>
                                      <td className="py-4 px-6 text-slate-500 dark:text-slate-400 font-medium">#{student.rollNumber}</td>
                                      <td className="py-4 px-6 text-right">
                                        <button 
                                          onClick={() => handleRemoveStudent(batch._id, student._id)}
                                          disabled={processing}
                                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all ${processing ? 'opacity-50 cursor-not-allowed' : 'opacity-0 group-hover/row:opacity-100'}`}
                                        >
                                          <UserMinus className="w-3.5 h-3.5" />
                                          Remove
                                        </button>
                                      </td>
                                    </motion.tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredBatches.length === 0 && !loading && (
             <motion.div 
               initial={{ opacity: 0 }} animate={{ opacity: 1 }}
               className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-slate-900/20 backdrop-blur-sm"
             >
               <FolderOpen className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
               <p className="font-display font-bold text-xl text-slate-700 dark:text-slate-300">No batches found</p>
               <p className="text-sm mt-2 font-medium">{searchQuery ? 'Try adjusting your search criteria.' : 'Create your first cohort to get started.'}</p>
             </motion.div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
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
              className="glass-panel w-full max-w-md overflow-hidden rounded-3xl shadow-2xl border border-white/20 dark:border-white/10 relative"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-primary-500 to-accent-500"></div>
              
              <div className="px-6 sm:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 backdrop-blur-md">
                <h3 className="text-xl font-display font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  {isEditing ? <Edit2 className="w-5 h-5 text-primary-500" /> : <Plus className="w-5 h-5 text-primary-500" />}
                  {isEditing ? 'Edit Batch' : 'Create New Batch'}
                </h3>
                <button onClick={handleCloseModal} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Batch Name <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Full Stack Cohort 1"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Timing (Optional)</label>
                  <input 
                    type="text" 
                    placeholder="e.g. 10:00 AM - 1:00 PM"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                    value={formData.timing}
                    onChange={(e) => setFormData({...formData, timing: e.target.value})}
                    disabled={processing}
                  />
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
                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : (isEditing ? 'Save Changes' : 'Create Batch')}
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

export default Batches;
