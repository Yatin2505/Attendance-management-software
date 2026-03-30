import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
    { name: 'Students', path: '/students', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
    { name: 'Batches', path: '/batches', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
    { name: 'Attendance', path: '/attendance', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    { name: 'Reports', path: '/reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  ];

  const handleLogout = () => {
     localStorage.removeItem('token');
     window.location.href = '/login';
  };

  return (
    <div className="flex h-screen bg-mesh-light dark:bg-mesh-dark font-sans overflow-hidden transition-colors duration-500">
      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 z-40 md:hidden backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Floating Glass Sidebar */}
      <aside className={`fixed inset-y-4 left-4 w-72 glass-panel rounded-3xl flex flex-col z-50 transform transition-transform duration-300 ease-out md:static md:translate-x-0 md:my-4 md:ml-4 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}`}>
        <div className="p-8 flex items-center mb-2">
          <div className="w-12 h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg shadow-primary-500/30 neon-glow">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Tecno Skill</h1>
            <p className="text-primary-600 dark:text-primary-400 text-[0.65rem] font-bold uppercase tracking-widest mt-0.5">Attendance Pro</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {navLinks.map((link) => {
             const isActive = location.pathname === link.path;
             return (
               <Link 
                 key={link.name} 
                 to={link.path} 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className={`relative flex items-center px-4 py-3.5 rounded-2xl transition-all duration-300 group overflow-hidden ${
                   isActive 
                     ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 font-semibold shadow-inner' 
                     : 'hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                 }`}
               >
                 {isActive && (
                   <motion.div 
                     layoutId="activeNavTab"
                     className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent dark:from-primary-500/20"
                     initial={false}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                   />
                 )}
                 <svg className={`w-5 h-5 mr-4 relative z-10 transition-colors duration-300 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-primary-500/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path>
                 </svg>
                 <span className="relative z-10 tracking-wide">{link.name}</span>
                 {isActive && (
                    <motion.div 
                      layoutId="activeNavIndicator"
                      className="absolute right-3 w-1.5 h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full neon-glow" 
                    />
                 )}
               </Link>
             )
          })}
        </nav>

        <div className="p-6 mt-auto">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center justify-center px-4 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-400 bg-slate-100/50 dark:bg-white/5 rounded-2xl hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 transition-all duration-300 group"
           >
             <svg className="w-5 h-5 mr-3 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             Secure Logout
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 md:pl-2">
        {/* Top Header */}
        <header className="h-24 px-6 lg:px-10 flex items-center justify-between z-10 sticky top-0">
          <div className="flex items-center">
             <button 
               className="md:hidden mr-4 p-2.5 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl text-slate-600 dark:text-slate-300 shadow-sm border border-white/20 dark:border-white/5"
               onClick={() => setIsMobileMenuOpen(true)}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
             </button>
             <div className="hidden sm:block">
               <motion.h2 
                 key={location.pathname}
                 initial={{ opacity: 0, y: -10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight"
               >
                 {navLinks.find(l => l.path === location.pathname)?.name || 'Platform Overview'}
               </motion.h2>
               <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Manage your institution efficiently</p>
             </div>
          </div>
          
          <div className="flex items-center space-x-4">
            
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-sm font-bold text-slate-800 dark:text-slate-200">Admin User</span>
                <span className="text-[0.65rem] text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wider">Administrator</span>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold shadow-lg shadow-primary-500/20 neon-glow cursor-pointer hover:scale-105 transition-transform">
                A
              </div>
            </div>
          </div>
         </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-6 lg:px-10 pb-10">
          <div className="max-w-7xl mx-auto h-full w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="h-full"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
