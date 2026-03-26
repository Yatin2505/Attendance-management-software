import { useState } from 'react';

const SearchBar = ({ onSearch, placeholder = 'Search...', className = '', value, onChange }) => {
  const [localValue, setLocalValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch?.(localValue);
  };

  return (
    <form onSubmit={handleSubmit} className={`relative group ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none group-focus-within:text-primary-500 transition-colors">
        <svg className="h-5 w-5 text-slate-400 group-focus-within:text-primary-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <input
        className="block w-full pl-12 pr-6 py-4 border border-slate-200 rounded-2xl bg-slate-50/80 dark:bg-slate-800/80 backdrop-blur-md focus:ring-4 focus:ring-primary-500/10 focus:border-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 shadow-sm transition-all duration-200 hover:shadow-md focus:shadow-lg focus:outline-none text-base"
        placeholder={placeholder}
        value={value || localValue}
        onChange={(e) => {
          setLocalValue(e.target.value);
          onChange?.(e);
        }}
        type="search"
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 group-focus-within:text-primary-500 transition-colors pointer-events-none"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </form>
  );
};

export default SearchBar;

