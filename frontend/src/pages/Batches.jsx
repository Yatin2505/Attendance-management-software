import React, { useState, useEffect } from 'react';
import { getBatches, createBatch, updateBatch, deleteBatch, assignStudentToBatch, removeStudentFromBatch } from '../services/batchService';
import { getStudents } from '../services/studentService';
import toast from 'react-hot-toast';

const Batches = () => {
  const [batches, setBatches] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Expanded batches for accordion 
  const [expandedBatch, setExpandedBatch] = useState(null);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentBatch, setCurrentBatch] = useState(null);
  const [formData, setFormData] = useState({ name: '', timing: '' });
  const [processing, setProcessing] = useState(false);

  // Student assignment state
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

  // Helper to find students not in a specific batch
  const getAvailableStudents = (batchStudents) => {
    const batchStudentIds = batchStudents.map(s => s._id);
    return allStudents.filter(s => !batchStudentIds.includes(s._id));
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Batches management</h1>
        <button 
          onClick={() => handleOpenModal()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
        >
          + Create Batch
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 pb-6">
          {batches.map((batch) => (
            <div key={batch._id} className="premium-card overflow-hidden">
              {/* Batch Header Summary */}
              <div 
                className="p-6 cursor-pointer flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 flex-wrap gap-4"
                onClick={() => toggleExpand(batch._id)}
              >
                <div>
                  <h2 className="text-xl font-bold text-gray-800 flex items-center">
                    {batch.name}
                    <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {batch.students?.length || 0} Students
                    </span>
                  </h2>
                  <p className="text-gray-500 mt-1 flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    {batch.timing || 'No timing specified'}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleOpenModal(batch); }}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                    title="Edit Batch"
                  >
                    Edit
                  </button>
                  <button 
                    onClick={(e) => handleDelete(batch._id, e)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    title="Delete Batch"
                  >
                    Delete
                  </button>
                  <div className="text-gray-400 pl-2">
                    <svg className={`w-6 h-6 transform transition-transform ${expandedBatch === batch._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>

              {/* Expandable Students View */}
              {expandedBatch === batch._id && (
                <div className="border-t border-gray-100 bg-gray-50 p-6 animate-in slide-in-from-top-4 origin-top duration-200">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
                    <h3 className="font-semibold text-gray-700">Enrolled Students</h3>
                    
                    {/* Assign Student Dropdown */}
                    <div className="flex w-full md:w-auto items-center space-x-2">
                      <select 
                        className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none flex-1 md:w-64 text-sm"
                        value={selectedStudentToAdd}
                        onChange={(e) => setSelectedStudentToAdd(e.target.value)}
                        disabled={processing}
                      >
                        <option value="">-- Assign a student --</option>
                        {getAvailableStudents(batch.students).map(student => (
                          <option key={student._id} value={student._id}>
                            {student.name} ({student.rollNumber})
                          </option>
                        ))}
                      </select>
                      <button 
                        onClick={() => handleAssignStudent(batch._id)}
                        disabled={!selectedStudentToAdd || processing}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded-lg transition text-sm whitespace-nowrap ${(!selectedStudentToAdd || processing) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                      >
                        {processing ? '...' : 'Add'}
                      </button>
                    </div>
                  </div>

                  {batch.students?.length === 0 ? (
                    <div className="text-center py-6 text-gray-500 text-sm border-2 border-dashed border-gray-200 rounded-xl">
                      No students assigned to this batch yet.
                    </div>
                  ) : (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
                          <tr>
                            <th className="py-3 px-4 font-medium">Name</th>
                            <th className="py-3 px-4 font-medium">Roll Number</th>
                            <th className="py-3 px-4 font-medium text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {batch.students.map(student => (
                            <tr key={student._id} className="hover:bg-gray-50">
                              <td className="py-3 px-4">{student.name}</td>
                              <td className="py-3 px-4 text-gray-500">{student.rollNumber}</td>
                              <td className="py-3 px-4 text-right">
                                <button 
                                  onClick={() => handleRemoveStudent(batch._id, student._id)}
                                  disabled={processing}
                                  className={`text-red-500 hover:text-red-700 transition ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {batches.length === 0 && !loading && (
             <div className="border-2 border-dashed border-gray-200 rounded-xl py-20 flex flex-col items-center justify-center text-gray-500">
               <span className="text-4xl mb-3">📁</span>
               <p className="font-medium text-lg text-gray-600">No batches found</p>
               <p className="text-sm mt-1">Create your first batch to start adding students.</p>
             </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 px-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold text-gray-800">
                {isEditing ? 'Edit Batch' : 'Create New Batch'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Batch Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Full Stack Cohort 1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  disabled={processing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Timing (Optional)</label>
                <input 
                  type="text" 
                  placeholder="e.g. 10:00 AM - 1:00 PM"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={formData.timing}
                  onChange={(e) => setFormData({...formData, timing: e.target.value})}
                  disabled={processing}
                />
              </div>
              
              <div className="pt-4 flex justify-end space-x-3">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  disabled={processing}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={processing}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50 flex items-center"
                >
                  {processing ? 'Processing...' : (isEditing ? 'Save Changes' : 'Create Batch')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Batches;
