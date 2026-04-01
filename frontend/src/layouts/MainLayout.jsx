import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const allNavLinks = [
    {
      name: 'Dashboard',
      path: '/',
      icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z'
    },
    {
      name: 'Students',
      path: '/students',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    },
    {
      name: 'Batches',
      path: '/batches',
      icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
    },
    {
      name: 'Attendance',
      path: '/attendance',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
    },
    {
      name: 'Leaves',
      path: '/leave',
      icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      roles: ['admin']
    },
    {
      name: 'Faculty',
      path: '/teachers',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      roles: ['admin']
    },
  ];

  const navLinks = allNavLinks.filter(l => !l.roles || l.roles.includes(user?.role));

  const handleLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login', { replace: true });
  };

  const closeMobile = () => setIsMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-mesh-light dark:bg-mesh-dark font-sans overflow-hidden transition-colors duration-500">

      {/* ── Mobile overlay ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/50 z-40 md:hidden backdrop-blur-sm"
            onClick={closeMobile}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-4 left-4 w-64 glass-panel rounded-3xl flex flex-col z-50
        transform transition-transform duration-300 ease-out
        md:static md:translate-x-0 md:my-4 md:ml-4 md:w-64 md:flex-shrink-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-[120%]'}
      `}>
        {/* Logo */}
        <div className="p-6 flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/30 neon-glow flex-shrink-0">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0112 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight bg-gradient-to-br from-slate-900 to-slate-600 dark:from-white dark:to-slate-400 bg-clip-text text-transparent">Tecno Skill</h1>
            <p className="text-primary-600 dark:text-primary-400 text-[0.6rem] font-bold uppercase tracking-widest">Attendance Pro</p>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto">
          {navLinks.map(link => {
            const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path));
            return (
              <Link
                key={link.name}
                to={link.path}
                onClick={closeMobile}
                className={`relative flex items-center px-4 py-3 rounded-2xl transition-all duration-200 group overflow-hidden ${
                  isActive
                    ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300 font-semibold'
                    : 'hover:bg-slate-100/60 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-medium'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNavTab"
                    className="absolute inset-0 bg-gradient-to-r from-primary-500/10 to-transparent dark:from-primary-500/20"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  />
                )}
                <svg className={`w-5 h-5 mr-3 relative z-10 transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-slate-400 group-hover:text-primary-500/70'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon} />
                </svg>
                <span className="relative z-10 text-sm tracking-wide">{link.name}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeNavDot"
                    className="absolute right-3 w-1.5 h-1.5 bg-primary-500 dark:bg-primary-400 rounded-full neon-glow"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom: Profile + Logout */}
        <div className="p-4 flex-shrink-0 space-y-2">
          {/* Profile link */}
          <Link
            to="/profile"
            onClick={closeMobile}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-sm font-semibold ${
              location.pathname === '/profile'
                ? 'bg-primary-500/10 dark:bg-primary-500/20 text-primary-600 dark:text-primary-300'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100/60 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary-400 to-accent-400 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-sm font-semibold truncate leading-none">{user?.name ?? 'User'}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">{user?.role === 'teacher' ? 'Faculty' : 'Admin'}</p>
            </div>
          </Link>

          {/* Logout */}
          <button
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-bold text-slate-400 bg-slate-100/50 dark:bg-white/5 rounded-xl hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10 dark:hover:text-rose-400 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Main content ─────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Top header */}
        <header className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between flex-shrink-0 border-b border-slate-100 dark:border-slate-800/50 bg-white/60 dark:bg-slate-950/60 backdrop-blur-md sticky top-0 z-30">
          {/* Left: hamburger + page title */}
          <div className="flex items-center gap-3">
            <button
              className="md:hidden p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <AnimatePresence mode="wait">
              <motion.h2
                key={location.pathname}
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.2 }}
                className="text-base font-display font-bold text-slate-800 dark:text-white hidden sm:block"
              >
                {location.pathname === '/profile'
                  ? 'My Profile'
                  : navLinks.find(l => l.path !== '/' ? location.pathname.startsWith(l.path) : location.pathname === '/')?.name
                    ?? 'Dashboard'}
              </motion.h2>
            </AnimatePresence>
          </div>

          {/* Right: user avatar → profile */}
          <Link to="/profile" className="flex items-center gap-2.5 group">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-bold text-slate-800 dark:text-white leading-none">{user?.name ?? 'User'}</p>
              <p className="text-xs text-primary-600 dark:text-primary-400 font-bold uppercase tracking-wide mt-0.5">
                {user?.role === 'teacher' ? 'Faculty' : 'Admin'}
              </p>
            </div>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary-500 to-accent-500 flex items-center justify-center text-white font-bold text-sm shadow-md group-hover:scale-105 transition-transform">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
          </Link>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="max-w-7xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={location.pathname}
                initial={{ opacity: 0, y: 16, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -16, scale: 0.99 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* ── Logout confirm ────────────────────────────────────────────────────── */}
      <ConfirmModal
        isOpen={showLogoutConfirm}
        title="Sign Out"
        message="Are you sure you want to sign out of Tecno Skill Attendance Pro?"
        confirmLabel="Sign Out"
        confirmVariant="primary"
        onConfirm={handleLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </div>
  );
};

export default MainLayout;
