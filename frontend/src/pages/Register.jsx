import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { registerUser } from '../services/authService';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Key, UserPlus } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    adminKey: '',
    rollNumber: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleChange = (e) => {
     setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerUser(formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const roles = [
    { id: 'student', label: 'Student', icon: User },
    { id: 'parent', label: 'Parent', icon: User },
    { id: 'teacher', label: 'Teacher', icon: Key },
    { id: 'admin', label: 'Admin', icon: Lock },
  ];

  return (
    <div className="min-h-screen flex bg-slate-950 font-sans overflow-hidden">
      
      {/* Left Panel: Branding & Abstract Art */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-16 bg-mesh-dark">
        {/* Animated Background Elements */}
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-600/30 rounded-full mix-blend-screen filter blur-3xl animate-blob" />
        <div className="absolute top-40 right-20 w-72 h-72 bg-accent-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-8 left-40 w-72 h-72 bg-blue-500/30 rounded-full mix-blend-screen filter blur-3xl animate-blob animation-delay-4000" />

        <div className="relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}
            className="flex items-center gap-4 mb-12"
          >
            <div className="w-14 h-14 bg-gradient-to-br from-primary-400 to-accent-600 rounded-2xl flex items-center justify-center shadow-lg neon-glow">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" /></svg>
            </div>
            <div>
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Mantech</h1>
              <p className="text-primary-400 text-sm font-bold uppercase tracking-widest mt-1">Attendance Pro</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-6xl font-display font-bold text-white leading-tight mb-6">
              Empowering <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">Education.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-lg font-light leading-relaxed">
              Create your account to access the modern attendance and fee management portal.
            </p>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }}
          className="relative z-10 flex items-center gap-4 text-slate-500 font-medium"
        >
          <div className="w-12 h-px bg-slate-700" />
          <span>Sanket Sir &copy; {new Date().getFullYear()}</span>
        </motion.div>
      </div>

      {/* Right Panel: Register Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 dark:bg-[#020617] relative bg-mesh-light dark:bg-none">
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md premium-card p-10 lg:p-12 overflow-y-auto max-h-[90vh] custom-scrollbar"
        >
          <div className="text-center mb-8">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">Get Started</h2>
            <p className="text-slate-500 dark:text-slate-400">Join your institution portal.</p>
          </div>

          {/* Role Selector */}
          <div className="grid grid-cols-4 gap-2 mb-8 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
            {roles.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setFormData({ ...formData, role: r.id })}
                className={`flex flex-col items-center gap-1.5 py-2.5 rounded-xl transition-all duration-200 ${
                  formData.role === r.id 
                    ? 'bg-white dark:bg-white/10 text-primary-600 dark:text-primary-400 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
              >
                <r.icon className={`w-4 h-4 ${formData.role === r.id ? 'animate-pulse' : ''}`} />
                <span className="text-[10px] font-bold uppercase tracking-wider">{r.label}</span>
              </button>
            ))}
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Full Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="name" type="text" required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
                    placeholder="John Doe"
                    value={formData.name} onChange={handleChange}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="email" type="email" required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
                    placeholder="john@example.com"
                    value={formData.email} onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    name="password" type="password" required
                    className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
                    placeholder="••••••••"
                    value={formData.password} onChange={handleChange}
                  />
                </div>
              </div>

              {(formData.role === 'student' || formData.role === 'parent') && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Student Roll Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-amber-500" />
                    </div>
                    <input
                      name="rollNumber" type="text" required
                      className="block w-full pl-11 pr-4 py-3 bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500 transition-all font-medium"
                      placeholder="e.g. ROLL123"
                      value={formData.rollNumber} onChange={handleChange}
                    />
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1.5 font-medium italic">* Roll number must match the one provided by admin.</p>
                </motion.div>
              )}

              {(formData.role === 'admin' || formData.role === 'teacher') && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Registration Key <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-accent-500" />
                    </div>
                    <input
                      name="adminKey" type="password" required
                      className="block w-full pl-11 pr-4 py-3 bg-accent-50/50 dark:bg-accent-900/10 border border-accent-200 dark:border-accent-800/50 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-500/50 focus:border-accent-500 transition-all font-medium"
                      placeholder="Secure Admin Code"
                      value={formData.adminKey} onChange={handleChange}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl text-white font-bold bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-slate-900 shadow-lg shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign Up <UserPlus className="w-5 h-5 ml-1" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
             Already have an account?{' '}
             <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline transition-all">
               Sign in instead
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Register;
