import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInstitutes, createInstitute } from '../services/instituteService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import toast from 'react-hot-toast';

const Institutes = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [newAdmin, setNewAdmin] = useState({
    name: '',
    email: '',
    password: ''
  });

  const fetchInstitutes = async () => {
    try {
      setLoading(true);
      const data = await getInstitutes();
      setInstitutes(data);
    } catch (error) {
      toast.error('Failed to fetch institutes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstitutes();
  }, []);

  const handleAddInstitute = async (e) => {
    e.preventDefault();
    try {
      await createInstitute(newAdmin);
      toast.success('Institute Admin created successfully');
      setShowAddModal(false);
      setNewAdmin({ name: '', email: '', password: '' });
      fetchInstitutes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create institute');
    }
  };

  const filteredInstitutes = institutes.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { 
      header: 'Institute Name', 
      accessor: 'name',
      render: (val) => <span className="font-bold text-slate-800 dark:text-white">{val}</span>
    },
    { header: 'Admin Email', accessor: 'email' },
    { 
      header: 'Admin Password', 
      accessor: 'plainPassword',
      render: (val) => <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs">{val || '••••••••'}</code>
    },
    { 
      header: 'Created At', 
      accessor: 'createdAt',
      render: (val) => new Date(val).toLocaleDateString()
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Institutes Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage coaching institutes and their admin credentials.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          Add New Institute
        </button>
      </div>

      <div className="glass-panel p-4 rounded-3xl">
        <div className="flex items-center justify-between mb-6">
          <div className="w-full max-w-md">
            <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search institutes..." />
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filteredInstitutes}
          loading={loading}
          emptyMessage="No institutes found."
        />
      </div>

      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Institute Admin"
      >
        <form onSubmit={handleAddInstitute} className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Institute Name</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="e.g. Navratna Academy"
              value={newAdmin.name}
              onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Admin Email</label>
            <input
              type="email"
              required
              className="form-input"
              placeholder="admin@institute.com"
              value={newAdmin.email}
              onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Initial Password</label>
            <input
              type="text"
              required
              className="form-input"
              placeholder="Strong password"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">Create Institute</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Institutes;
