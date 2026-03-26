import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';

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
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-800/50 z-20 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-[#0A0F2C] text-slate-300 flex flex-col z-30 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 flex items-center mb-4">
          <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center mr-3 shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"></path></svg>
          </div>
          <div>
<h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r bg-clip-text text-transparent from-primary-400 to-purple-400 bg-primary-500">Tecno Skill</h1>
            <p className="text-primary-300 text-xs font-semibold uppercase tracking-wider mt-0.5">Attendance Pro</p>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
          {navLinks.map((link) => {
             const isActive = location.pathname === link.path;
             return (
               <Link 
                 key={link.name} 
                 to={link.path} 
                 onClick={() => setIsMobileMenuOpen(false)}
                 className={`flex items-center px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                   isActive 
                     ? 'bg-indigo-500/10 text-indigo-400 font-medium' 
                     : 'hover:bg-white/5 hover:text-white'
                 }`}
               >
                 <svg className={`w-5 h-5 mr-4 transition-colors ${isActive ? 'text-indigo-400' : 'text-slate-500 group-hover:text-slate-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={link.icon}></path>
                 </svg>
                 {link.name}
                 {isActive && (
                    <div className="ml-auto w-1.5 h-6 bg-indigo-500 rounded-full" />
                 )}
               </Link>
             )
          })}
        </nav>

        <div className="p-6 mt-auto">
           <button 
             onClick={handleLogout}
             className="w-full flex items-center px-4 py-3 text-sm font-medium text-slate-400 bg-white/5 rounded-xl hover:bg-red-500/10 hover:text-red-400 transition-colors"
           >
             <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
             Secure Logout
           </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/50">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-6 lg:px-10 z-10 sticky top-0">
          <div className="flex items-center">
             <button 
               className="md:hidden mr-4 p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition"
               onClick={() => setIsMobileMenuOpen(true)}
             >
               <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
             </button>
             <h2 className="text-xl font-bold text-slate-800 hidden sm:block">
               {navLinks.find(l => l.path === location.pathname)?.name || 'Platform'}
             </h2>
          </div>
          
          <div className="flex items-center space-x-5">
             <div className="hidden sm:flex flex-col text-right mr-2">
                <span className="text-sm font-bold text-slate-800">Admin User</span>
                <span className="text-xs text-slate-500 font-medium tracking-wide">Administrator</span>
             </div>
             <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-200 ring-4 ring-white">
               A
             </div>
          </div>
        </header>

        {/* Scrollable Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10">
          <div className="max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
