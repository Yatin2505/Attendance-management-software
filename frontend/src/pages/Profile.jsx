import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { changePassword, updateProfile } from '../services/authService';
import { updateInstituteBranding } from '../services/instituteService';
import { getBatches } from '../services/batchService';
import toast from 'react-hot-toast';
import {
  User, Mail, Shield, Key, Eye, EyeOff,
  CheckCircle, Layers, Calendar, Lock,
  GraduationCap, Save, Phone, Camera, Building2, Palette, Image
} from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 py-3 border-b border-slate-100 dark:border-slate-800 last:border-0">
    <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center flex-shrink-0">
      <Icon className="w-4 h-4 text-slate-400" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-sm font-semibold text-slate-800 dark:text-white truncate">{value || '—'}</p>
    </div>
  </div>
);

const InputField = ({ icon: Icon, label, value, onChange, placeholder, type = 'text' }) => (
  <div>
    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
      />
    </div>
  </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const Profile = () => {
  const { user, setUser } = useAuth();

  const isAdmin = user?.role === 'admin';
  const isSuperAdmin = user?.role === 'superadmin';

  // Profile form
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    profilePhoto: user?.profilePhoto || '',
    contactNumber: user?.contactNumber || '',
  });
  const [profileLoading, setProfileLoading] = useState(false);

  // Institute branding form (admin only)
  const [brandingForm, setBrandingForm] = useState({
    name: user?.instituteName || user?.name || '',
    logo: user?.logo || '',
    brandingColor: user?.brandingColor || '#3b82f6',
  });
  const [brandingLoading, setBrandingLoading] = useState(false);

  // Assigned batches (for teachers)
  const [assignedBatches, setAssignedBatches] = useState([]);
  const [batchesLoading, setBatchesLoading] = useState(false);

  // Change password form
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState({ current: false, next: false, confirm: false });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    setProfileForm({
      name: user?.name || '',
      profilePhoto: user?.profilePhoto || '',
      contactNumber: user?.contactNumber || '',
    });
    if (isAdmin) {
      setBrandingForm({
        name: user?.name || '',
        logo: user?.logo || '',
        brandingColor: user?.brandingColor || '#3b82f6',
      });
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'teacher') {
      setBatchesLoading(true);
      getBatches().then(setAssignedBatches).catch(() => {}).finally(() => setBatchesLoading(false));
    }
  }, [user?.role]);

  // ── Profile update ────────────────────────────────────────────────────────
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const updated = await updateProfile(profileForm);
      if (setUser) setUser(prev => ({ ...prev, ...updated }));
      toast.success('Profile updated successfully!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  // ── Branding update ───────────────────────────────────────────────────────
  const handleBrandingSubmit = async (e) => {
    e.preventDefault();
    setBrandingLoading(true);
    try {
      await updateInstituteBranding(brandingForm);
      if (setUser) setUser(prev => ({ ...prev, name: brandingForm.name, logo: brandingForm.logo, brandingColor: brandingForm.brandingColor }));
      toast.success('Institute branding updated! Reload to see sidebar changes.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update branding');
    } finally {
      setBrandingLoading(false);
    }
  };

  // ── Change password ───────────────────────────────────────────────────────
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword !== pwdForm.confirmPassword) { setPwdError("New passwords don't match"); return; }
    if (pwdForm.newPassword.length < 6) { setPwdError('New password must be at least 6 characters'); return; }
    setPwdLoading(true);
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      toast.success('Password updated successfully');
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update password';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  const roleLabel = isSuperAdmin ? 'Super Administrator' : isAdmin ? 'Administrator' : user?.role === 'student' ? 'Student' : 'Faculty';
  const avatarBg = isSuperAdmin ? 'from-amber-500 to-orange-500' : isAdmin ? 'from-primary-500 to-accent-500' : 'from-violet-500 to-indigo-500';

  return (
    <div className="max-w-3xl mx-auto flex flex-col gap-5 pb-8">

      {/* ── Header strip ──────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          {user?.profilePhoto ? (
            <img src={user.profilePhoto} alt={user?.name} className="w-16 h-16 rounded-2xl object-cover shadow-lg border-2 border-white dark:border-slate-700" />
          ) : (
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white shadow-lg bg-gradient-to-br ${avatarBg}`}>
              {user?.name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <div>
          <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">{user?.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-xs font-bold border ${
              isSuperAdmin ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20'
              : isAdmin ? 'bg-primary-50 dark:bg-primary-500/10 text-primary-700 dark:text-primary-400 border-primary-200 dark:border-primary-500/20'
              : 'bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-500/20'
            }`}>
              <Shield className="w-3 h-3" />
              {roleLabel}
            </span>
            {user?.contactNumber && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800">
                <Phone className="w-3 h-3" /> {user.contactNumber}
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* ── Account Info ─────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="premium-card p-5">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-500" /> Account Information
          </h2>
          <InfoRow icon={User} label="Full Name" value={user?.name} />
          <InfoRow icon={Mail} label="Email Address" value={user?.email} />
          <InfoRow icon={Shield} label="Role" value={roleLabel} />
          <InfoRow icon={Phone} label="Contact Number" value={user?.contactNumber} />
          {user?.createdAt && <InfoRow icon={Calendar} label="Member Since" value={fmtDate(user.createdAt)} />}
        </motion.div>

        {/* ── Teacher: Assigned Batches OR Admin: Stats ─────────────────────── */}
        {user?.role === 'teacher' && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="premium-card p-5">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
              <Layers className="w-4 h-4 text-violet-500" /> Assigned Batches
            </h2>
            {batchesLoading ? (
              <div className="space-y-2">{[...Array(3)].map((_, i) => <div key={i} className="h-8 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />)}</div>
            ) : assignedBatches.length === 0 ? (
              <p className="text-sm text-slate-400 py-4 text-center">No batches assigned yet</p>
            ) : (
              <div className="space-y-2">
                {assignedBatches.map(b => (
                  <div key={b._id} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                    <div className="w-7 h-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <GraduationCap className="w-3.5 h-3.5 text-violet-500" />
                    </div>
                    <div><p className="text-sm font-semibold text-slate-800 dark:text-white">{b.name}</p>{b.timing && <p className="text-xs text-slate-400">{b.timing}</p>}</div>
                    <span className="ml-auto text-xs text-slate-400">{b.students?.length ?? 0} students</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {(isAdmin || isSuperAdmin) && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="premium-card p-5 flex flex-col justify-center items-center text-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-50 to-accent-50 dark:from-primary-500/10 dark:to-accent-500/10 flex items-center justify-center">
              <Shield className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{isSuperAdmin ? 'Super Administrator' : 'System Administrator'}</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">{isSuperAdmin ? 'Full platform control. Manage all institutes, admins, and subscriptions.' : 'Full access to all students, batches, teachers, reports, and settings.'}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-500/20">
              <CheckCircle className="w-3.5 h-3.5" /> Full system access
            </div>
          </motion.div>
        )}

        {/* ── Update Profile ────────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="premium-card p-5 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4 text-sky-500" /> Update Profile
          </h2>
          <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <InputField icon={User} label="Display Name" value={profileForm.name} onChange={e => setProfileForm(p => ({ ...p, name: e.target.value }))} placeholder="Your full name" />
            <InputField icon={Image} label="Profile Photo URL" value={profileForm.profilePhoto} onChange={e => setProfileForm(p => ({ ...p, profilePhoto: e.target.value }))} placeholder="https://..." />
            <InputField icon={Phone} label="Contact Number" value={profileForm.contactNumber} onChange={e => setProfileForm(p => ({ ...p, contactNumber: e.target.value }))} placeholder="+91 98765 43210" />
            {profileForm.profilePhoto && (
              <div className="sm:col-span-3 flex items-center gap-3">
                <img src={profileForm.profilePhoto} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700" onError={e => e.target.style.display = 'none'} />
                <p className="text-xs text-slate-400">Profile photo preview</p>
              </div>
            )}
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" disabled={profileLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-sky-600 hover:bg-sky-700 text-white transition active:scale-95 disabled:opacity-60">
                {profileLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Save Profile
              </button>
            </div>
          </form>
        </motion.div>

        {/* ── Admin: Institute Branding ─────────────────────────────────────── */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 }} className="premium-card p-5 md:col-span-2">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-500" /> Institute Branding
            </h2>
            <form onSubmit={handleBrandingSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InputField icon={Building2} label="Institute Name" value={brandingForm.name} onChange={e => setBrandingForm(p => ({ ...p, name: e.target.value }))} placeholder="Your Institute Name" />
              <InputField icon={Image} label="Logo URL" value={brandingForm.logo} onChange={e => setBrandingForm(p => ({ ...p, logo: e.target.value }))} placeholder="https://..." />
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">Brand Color</label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-shrink-0">
                    <Palette className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                    <input
                      type="text"
                      value={brandingForm.brandingColor}
                      onChange={e => setBrandingForm(p => ({ ...p, brandingColor: e.target.value }))}
                      placeholder="#3b82f6"
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                    />
                  </div>
                  <input type="color" value={brandingForm.brandingColor} onChange={e => setBrandingForm(p => ({ ...p, brandingColor: e.target.value }))} className="w-10 h-10 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer flex-shrink-0 bg-transparent" />
                </div>
              </div>
              {brandingForm.logo && (
                <div className="sm:col-span-3 flex items-center gap-3">
                  <img src={brandingForm.logo} alt="Logo Preview" className="w-12 h-12 rounded-xl object-contain border border-slate-200 dark:border-slate-700 bg-white p-1" onError={e => e.target.style.display = 'none'} />
                  <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ backgroundColor: brandingForm.brandingColor }} />
                  <p className="text-xs text-slate-400">Logo & color preview</p>
                </div>
              )}
              <div className="sm:col-span-3 flex justify-end">
                <button type="submit" disabled={brandingLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition active:scale-95 disabled:opacity-60">
                  {brandingLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Branding
                </button>
              </div>
            </form>
          </motion.div>
        )}

        {/* ── Change Password ──────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14 }} className="premium-card p-5 md:col-span-2">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-rose-500" /> Change Password
          </h2>
          <form onSubmit={handlePasswordSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { key: 'currentPassword', label: 'Current Password', show: 'current' },
              { key: 'newPassword', label: 'New Password', show: 'next' },
              { key: 'confirmPassword', label: 'Confirm New', show: 'confirm' },
            ].map(({ key, label, show }) => (
              <div key={key}>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">{label}</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                  <input
                    type={showPwd[show] ? 'text' : 'password'}
                    value={pwdForm[key]}
                    onChange={e => setPwdForm(p => ({ ...p, [key]: e.target.value }))}
                    required placeholder="••••••••" disabled={pwdLoading}
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition"
                  />
                  <button type="button" onClick={() => setShowPwd(p => ({ ...p, [show]: !p[show] }))} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition">
                    {showPwd[show] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
            {pwdError && (
              <div className="sm:col-span-3 flex items-center gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                <CheckCircle className="w-4 h-4 flex-shrink-0 rotate-45" />{pwdError}
              </div>
            )}
            <div className="sm:col-span-3 flex justify-end">
              <button type="submit" disabled={pwdLoading} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold bg-primary-600 hover:bg-primary-700 text-white transition active:scale-95 disabled:opacity-60">
                {pwdLoading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                Update Password
              </button>
            </div>
          </form>
        </motion.div>

      </div>
    </div>
  );
};

export default Profile;
