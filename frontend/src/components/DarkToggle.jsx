import { useEffect } from 'react';

const DarkToggle = () => {
  useEffect(() => {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }, []);

  return null;
};

export default DarkToggle;


