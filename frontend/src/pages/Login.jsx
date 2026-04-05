import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, LogIn, ServerCrash, CheckCircle2 } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || '';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('idle');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || "/";

  useEffect(() => {
    let timer;
    let done = false;
    timer = setTimeout(() => {
      if (!done) setServerStatus('waking');
    }, 1800);

    fetch(`${API_URL}/api/health`)
      .then(() => {
        done = true;
        clearTimeout(timer);
        setServerStatus('ready');
        setTimeout(() => setServerStatus('idle'), 3000);
      })
      .catch(() => {
        done = true;
        clearTimeout(timer);
        setServerStatus('waking');
      });

    return () => clearTimeout(timer);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (error) {
      // Error handled in context
    } finally {
      setIsLoading(false);
    }
  };

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
              <h1 className="text-3xl font-extrabold text-white tracking-tight">Tecno Skill</h1>
              <p className="text-primary-400 text-sm font-bold uppercase tracking-widest mt-1">Attendance Pro</p>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}>
            <h2 className="text-6xl font-display font-bold text-white leading-tight mb-6">
              Welcome back to <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-accent-400">the future.</span>
            </h2>
            <p className="text-xl text-slate-400 max-w-lg font-light leading-relaxed">
              Manage your institution's attendance, students, and batches with unparalleled speed, security, and elegance.
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

      {/* Right Panel: Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 lg:p-24 bg-slate-50 dark:bg-[#020617] relative bg-mesh-light dark:bg-none">
        
        {/* Server Status Banners */}
        <AnimatePresence>
          {serverStatus === 'waking' && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -50 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-50 glass-panel border-amber-500/30 bg-amber-500/10 px-6 py-3 rounded-full flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400 font-medium whitespace-nowrap"
            >
              <ServerCrash className="w-5 h-5 animate-pulse" />
              <span>Server waking from sleep mode (~30s)...</span>
            </motion.div>
          )}
          {serverStatus === 'ready' && (
            <motion.div 
              initial={{ opacity: 0, y: -50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="absolute top-6 left-1/2 -translate-x-1/2 z-50 glass-panel border-emerald-500/30 bg-emerald-500/10 px-6 py-3 rounded-full flex items-center gap-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium whitespace-nowrap"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Server is ready!</span>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md premium-card p-10 lg:p-12"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-3">Sign In</h2>
            <p className="text-slate-500 dark:text-slate-400">Enter your credentials to access the dashboard.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Email address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="email"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Password</label>
                  <a href="#" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500">Forgot password?</a>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input
                    type="password"
                    required
                    className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 transition-all font-medium"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full flex items-center justify-center gap-2 py-4 px-4 border border-transparent rounded-xl text-white font-bold bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-500 hover:to-accent-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 focus:ring-offset-slate-900 shadow-lg shadow-primary-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign In <LogIn className="w-5 h-5 ml-1" /></>
              )}
            </button>
          </form>

          <div className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
             Don't have an account?{' '}
             <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:text-primary-500 hover:underline transition-all">
               Create one now
             </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
