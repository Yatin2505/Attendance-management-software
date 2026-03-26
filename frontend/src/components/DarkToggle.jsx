import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkToggle = () => {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const isDarkMode = localStorage.theme === 'dark' || (!localStorage.theme && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (isDarkMode) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (isDark) {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
    } else {
      setIsDark(true);
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
    }
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2.5 rounded-xl text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-primary-500 dark:hover:text-primary-400 transition-all duration-300 flex items-center justify-center relative group overflow-hidden"
      title="Toggle Dark Mode"
      aria-label="Toggle dark mode"
    >
      <div className={`transition-transform duration-500 ease-in-out ${isDark ? 'rotate-[360deg] scale-0 absolute' : 'rotate-0 scale-100'}`}>
        <Moon className="w-5 h-5 fill-transparent group-hover:fill-current" />
      </div>
      <div className={`transition-transform duration-500 ease-in-out ${isDark ? 'rotate-0 scale-100' : '-rotate-[360deg] scale-0 absolute'}`}>
        <Sun className="w-5 h-5 fill-transparent group-hover:fill-current" />
      </div>
      
      <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-xl z-20">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  );
};

export default DarkToggle;

