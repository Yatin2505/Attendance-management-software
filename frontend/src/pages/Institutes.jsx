import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getInstitutes, createInstitute, deleteInstitute, toggleInstituteStatus } from '../services/instituteService';
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
    password: '',
    logo: '',
    brandingColor: '#3b82f6'
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
      setNewAdmin({ name: '', email: '', password: '', logo: '', brandingColor: '#3b82f6' });
      fetchInstitutes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create institute');
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      const res = await toggleInstituteStatus(id);
      toast.success(res.message);
      fetchInstitutes();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('CRITICAL: This will delete the institute and ALL its data (Students, Batches, Attendance). This action cannot be undone. Proceed?')) {
      return;
    }
    try {
      await deleteInstitute(id);
      toast.success('Institute deleted successfully');
      fetchInstitutes();
    } catch (error) {
      toast.error('Failed to delete institute');
    }
  };

  const filteredInstitutes = institutes.filter(inst => 
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const columns = [
    { 
      header: 'Institute Name', 
      accessorKey: 'name',
      cell: info => (
        <div className="flex items-center gap-3">
          {info.row.original.logo ? (
            <img src={info.row.original.logo} alt="Logo" className="w-8 h-8 rounded-lg object-cover bg-slate-100" />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <span className="text-xs font-bold text-primary-600 uppercase">{info.getValue().charAt(0)}</span>
            </div>
          )}
          <span className="font-bold text-slate-800 dark:text-white">{info.getValue()}</span>
        </div>
      )
    },
    { header: 'Admin Email', accessorKey: 'email' },
    { 
      header: 'Status', 
      accessorKey: 'isActive',
      cell: info => (
        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
          info.getValue() 
            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30' 
            : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30'
        }`}>
          {info.getValue() ? 'Active' : 'Suspended'}
        </span>
      )
    },
    { 
      header: 'Password', 
      accessorKey: 'plainPassword',
      cell: info => <code className="px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded font-mono text-xs">{info.getValue() || '••••••••'}</code>
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => (
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleToggleStatus(info.row.original._id)}
            className={`p-1.5 rounded-xl transition-all ${
              info.row.original.isActive 
                ? 'text-amber-500 hover:bg-amber-50' 
                : 'text-emerald-500 hover:bg-emerald-50'
            }`}
            title={info.row.original.isActive ? 'Suspend Access' : 'Restore Access'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={info.row.original.isActive ? "M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636" : "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"} />
            </svg>
          </button>
          <button 
            onClick={() => handleDelete(info.row.original._id)}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="Delete Institute"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">Institutes Management</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm">Manage coaching institutes, branding, and access status.</p>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Branding Logo URL</label>
              <input
                type="url"
                className="form-input"
                placeholder="https://example.com/logo.png"
                value={newAdmin.logo}
                onChange={(e) => setNewAdmin({ ...newAdmin, logo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-bold text-slate-700 dark:text-slate-300 ml-1">Branding Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-12 h-10 rounded-xl bg-transparent border-none cursor-pointer"
                  value={newAdmin.brandingColor}
                  onChange={(e) => setNewAdmin({ ...newAdmin, brandingColor: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input flex-1"
                  value={newAdmin.brandingColor}
                  onChange={(e) => setNewAdmin({ ...newAdmin, brandingColor: e.target.value })}
                />
              </div>
            </div>
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
