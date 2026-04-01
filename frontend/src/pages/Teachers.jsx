import React, { useState, useEffect } from 'react';
import { userService } from '../services/userService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Trash2, X, Shield, Mail, Key } from 'lucide-react';
import SkeletonLoader from '../components/SkeletonLoader';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const data = await userService.getTeachers();
      setTeachers(data);
    } catch (error) {
      toast.error('Failed to load teachers');
    } finally {
      setLoading(false);
    }
  };

  const filteredTeachers = teachers.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    t.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      await userService.createTeacher(formData);
      toast.success('Teacher account created successfully');
      setFormData({ name: '', email: '', password: '' });
      setIsModalOpen(false);
      fetchTeachers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this teacher account? They will lose access immediately.')) {
      try {
        await userService.deleteTeacher(id);
        toast.success('Teacher removed successfully');
        setTeachers(teachers.filter(t => t._id !== id));
      } catch (error) {
        toast.error(error.response?.data?.message || 'Failed to delete teacher');
      }
    }
  };

  return (
    <div className="h-full flex flex-col pb-6">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel p-6 sm:p-8 rounded-3xl mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6"
      >
        <div>
          <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Faculty Management</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium tracking-wide text-sm">Add and remove teacher accounts securely</p>
        </div>
        
        <div className="flex flex-col sm:flex-row w-full sm:w-auto gap-4">
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all shadow-sm font-medium"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-2xl shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Faculty
          </button>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex-1 w-full mt-4">
          <SkeletonLoader type="card" count={4} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredTeachers.map((teacher, idx) => (
              <motion.div 
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3, delay: idx * 0.05 }}
                key={teacher._id} 
                className="premium-card overflow-hidden group p-6 flex flex-col justify-between"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-accent-200 to-accent-100 dark:from-slate-700 dark:to-slate-600 flex items-center justify-center text-accent-700 dark:text-white font-bold text-lg ring-4 ring-white dark:ring-slate-800 shadow-sm">
                      {teacher.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-slate-800 dark:text-white line-clamp-1">{teacher.name}</h3>
                      <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-accent-50 dark:bg-accent-500/10 text-accent-600 dark:text-accent-400 border border-accent-100 dark:border-accent-500/20 uppercase tracking-widest mt-1 inline-block">
                        Teacher Role
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => handleDelete(teacher._id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all shadow-sm border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                    title="Remove Account"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="flex items-center gap-3 text-sm font-medium text-slate-500 dark:text-slate-400">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span className="truncate">{teacher.email}</span>
                  </div>
                </div>
              </motion.div>
            ))}

            {filteredTeachers.length === 0 && (
              <div className="col-span-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl py-24 flex flex-col items-center justify-center text-slate-500 dark:text-slate-400 bg-white/30 dark:bg-slate-900/20 backdrop-blur-sm">
                <Shield className="w-16 h-16 mb-4 text-slate-300 dark:text-slate-600" />
                <p className="font-display font-bold text-xl text-slate-700 dark:text-slate-300">No faculty found</p>
                <p className="text-sm mt-2 font-medium">{searchQuery ? 'Adjust your search query.' : 'Click "Add Faculty" to register a new teacher.'}</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Add Faculty Modal */}
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
                  <Shield className="w-5 h-5 text-primary-500" />
                  Add New Faculty
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 bg-white dark:bg-slate-900">
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Rahul Sharma"
                    autoComplete="off"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="teacher@institute.com"
                    autoComplete="off"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    disabled={processing}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">Secure Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Key className="h-4 w-4 text-slate-400" />
                    </div>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      autoComplete="new-password"
                      className="block w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 outline-none transition-all text-slate-800 dark:text-white font-medium"
                      value={formData.password}
                      onChange={(e) => setFormData({...formData, password: e.target.value})}
                      disabled={processing}
                    />
                  </div>
                </div>
                
                <div className="pt-6 mt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 rounded-b-3xl">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)}
                    disabled={processing}
                    className="px-5 py-2.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={processing}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-accent-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-primary-500/30 active:scale-95 transition-all disabled:opacity-50 flex items-center min-w-[140px] justify-center"
                  >
                    {processing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : 'Create Account'}
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

export default Teachers;
