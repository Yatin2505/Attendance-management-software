import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = ({ type = 'card', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className="rounded-2xl p-5 border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 h-44 flex flex-col justify-between">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              <div className="space-y-2 flex-1 pt-1">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-3/4"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-1/2"></div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 mt-4">
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
              <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse"></div>
            </div>
          </div>
        );
      case 'table-row':
        return (
          <div className="flex items-center space-x-4 py-4 px-6 border-b border-slate-200/50 dark:border-slate-800/50 w-full">
             <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 animate-pulse shrink-0"></div>
             <div className="flex-1 space-y-2">
                <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-48"></div>
                <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24"></div>
             </div>
             <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-20 shrink-0"></div>
             <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-lg animate-pulse w-20 shrink-0"></div>
          </div>
        );
      case 'dashboard-widget':
        return (
           <div className="rounded-2xl p-6 border border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 h-32 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                 <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-24 mb-2"></div>
                 <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
              </div>
              <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded animate-pulse w-16"></div>
           </div>
        );
      default:
        return <div className="h-full w-full bg-slate-200 dark:bg-slate-800 animate-pulse rounded-2xl"></div>;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={`w-full ${type === 'card' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6' : type === 'dashboard-widget' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6' : 'flex flex-col'}`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>{renderSkeleton()}</React.Fragment>
      ))}
    </motion.div>
  );
};

export default SkeletonLoader;
