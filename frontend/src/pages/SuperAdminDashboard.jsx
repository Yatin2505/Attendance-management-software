import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2, ShieldCheck, ShieldAlert, Plus, Search, CheckCircle2,
  XCircle, Lock, Unlock, Trash2, Key, Mail, RefreshCw, Server
} from 'lucide-react';
import { getInstitutes, createInstitute, deleteInstitute, toggleInstituteStatus } from '../services/instituteService';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import SearchBar from '../components/SearchBar';
import ImageUpload from '../components/ImageUpload';
import toast from 'react-hot-toast';

const StatCard = ({ label, value, sub, icon: Icon, iconBg, iconColor }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    className="premium-card p-5 flex items-center gap-4"
  >
    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
      <Icon className={`w-6 h-6 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-2xl font-display font-extrabold text-slate-900 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-500 mt-1 font-medium">{sub}</p>}
    </div>
  </motion.div>
);

const SuperAdminDashboard = () => {
  const [institutes, setInstitutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

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
      setInstitutes(data || []);
    } catch (error) {
      toast.error('Failed to load institutes list');
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
      toast.success('Institute created successfully!');
      setShowAddModal(false);
      setNewAdmin({ name: '', email: '', password: '', logo: '', brandingColor: '#3b82f6' });
      fetchInstitutes();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to create institute');
    }
  };

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const res = await toggleInstituteStatus(id);
      toast.success(res.message || (currentStatus ? 'Access Suspended' : 'Access Restored'));
      fetchInstitutes();
    } catch (error) {
      toast.error('Failed to update institute status');
    }
  };

  const handleDeleteInstitute = async (id) => {
    try {
      await deleteInstitute(id);
      toast.success('Institute deleted successfully');
      setDeleteConfirmId(null);
      fetchInstitutes();
    } catch (error) {
      toast.error('Failed to delete institute');
    }
  };

  const filtered = institutes.filter(inst =>
    inst.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    inst.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalInstitutes = institutes.length;
  const activeCount = institutes.filter(i => i.isActive).length;
  const suspendedCount = totalInstitutes - activeCount;

  const columns = [
    {
      header: 'Institute Name',
      accessorKey: 'name',
      cell: info => (
        <div className="flex items-center gap-3">
          {info.row.original.logo ? (
            <img src={info.row.original.logo} alt="Logo" className="w-9 h-9 rounded-xl object-cover bg-slate-100 border border-slate-200" />
          ) : (
            <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center font-bold text-primary-600 text-sm">
              {info.getValue()?.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-bold text-slate-800 text-sm">{info.getValue()}</p>
            <p className="text-[11px] text-slate-400 font-mono">ID: {info.row.original._id.slice(-6)}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Admin Credentials',
      accessorKey: 'email',
      cell: info => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-semibold">
            <Mail className="w-3.5 h-3.5 text-slate-400" />
            {info.getValue()}
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
            <Key className="w-3.5 h-3.5 text-slate-400" />
            <span>Pass: </span>
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-800 font-bold">
              {info.row.original.plainPassword || '••••••••'}
            </code>
          </div>
        </div>
      )
    },
    {
      header: 'Access Control',
      accessorKey: 'isActive',
      cell: info => {
        const active = info.getValue();
        return (
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
            active
              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
              : 'bg-rose-50 text-rose-700 border border-rose-200/60'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
            {active ? 'Active' : 'Suspended'}
          </span>
        );
      }
    },
    {
      header: 'Actions',
      id: 'actions',
      cell: info => {
        const inst = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleToggleStatus(inst._id, inst.isActive)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                inst.isActive
                  ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200/60'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
              title={inst.isActive ? 'Block/Suspend Institute Access' : 'Restore Institute Access'}
            >
              {inst.isActive ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              <span>{inst.isActive ? 'Suspend' : 'Activate'}</span>
            </button>
            <button
              onClick={() => setDeleteConfirmId(inst._id)}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Delete Institute"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      {/* ── Top Header ────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Server className="w-7 h-7 text-primary-600" />
            SaaS Creator Control Center
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Manage registered coaching institutes, grant or suspend access, and monitor platform activity.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn-primary flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Register New Institute
        </button>
      </div>

      {/* ── SaaS Metric Cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Institutes"
          value={totalInstitutes}
          sub="Registered on platform"
          icon={Building2}
          iconBg="bg-primary-50 text-primary-600"
          iconColor="text-primary-600"
        />
        <StatCard
          label="Active Institutes"
          value={activeCount}
          sub="Full platform access"
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
        />
        <StatCard
          label="Suspended Access"
          value={suspendedCount}
          sub="Access blocked by creator"
          icon={ShieldAlert}
          iconBg="bg-rose-50"
          iconColor="text-rose-600"
        />
        <StatCard
          label="Platform Status"
          value="Healthy"
          sub="100% System Operational"
          icon={CheckCircle2}
          iconBg="bg-indigo-50"
          iconColor="text-indigo-600"
        />
      </div>

      {/* ── Institutes Directory Section ──────────────────────────────────── */}
      <div className="glass-panel p-6 rounded-3xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
          <div>
            <h2 className="text-lg font-display font-bold text-slate-900">Institutes Management & Access Control</h2>
            <p className="text-xs text-slate-500">Toggle access switches to block or allow institute logins instantly.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-full sm:w-72">
              <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Search by name or email..." />
            </div>
            <button
              onClick={fetchInstitutes}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-2xl transition-all"
              title="Refresh list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DataTable
          columns={columns}
          data={filtered}
          loading={loading}
          emptyMessage="No institutes found."
        />
      </div>

      {/* ── Add Institute Modal ───────────────────────────────────────────── */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Register New Coaching Institute"
      >
        <form onSubmit={handleAddInstitute} className="space-y-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Institute Name *</label>
              <input
                type="text"
                required
                className="form-input"
                placeholder="e.g. Navratna Coaching Classes"
                value={newAdmin.name}
                onChange={(e) => setNewAdmin({ ...newAdmin, name: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Admin Email *</label>
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
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Initial Login Password *</label>
            <input
              type="text"
              required
              className="form-input font-mono"
              placeholder="Enter strong admin password"
              value={newAdmin.password}
              onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            <div>
              <ImageUpload
                label="Institute Logo"
                value={newAdmin.logo}
                onChange={(logo) => setNewAdmin({ ...newAdmin, logo })}
                helperText="Upload institute logo from PC"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">Theme / Branding Color</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  className="w-12 h-11 rounded-xl bg-transparent border-none cursor-pointer"
                  value={newAdmin.brandingColor}
                  onChange={(e) => setNewAdmin({ ...newAdmin, brandingColor: e.target.value })}
                />
                <input
                  type="text"
                  className="form-input flex-1 font-mono text-xs"
                  value={newAdmin.brandingColor}
                  onChange={(e) => setNewAdmin({ ...newAdmin, brandingColor: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Create Institute
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────────────── */}
      {deleteConfirmId && (
        <Modal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          title="Delete Institute & Data"
        >
          <div className="space-y-4 pt-2">
            <p className="text-sm text-slate-600 leading-relaxed">
              <strong>CRITICAL WARNING:</strong> Deleting this institute will permanently remove all of its associated students, batches, attendance records, and faculty. This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteInstitute(deleteConfirmId)}
                className="btn-danger"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
