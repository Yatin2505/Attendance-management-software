import { motion } from 'framer-motion';

const Skeleton = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{ opacity: [0.4, 0.6, 0.4] }}
      transition={{ repeat: Infinity, duration: 1.5 }}
      className={`animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700 rounded-2xl ${className}`}
    />
  );
};

const CardSkeleton = () => (
  <div className="space-y-4">
    <Skeleton className="h-8 w-48 rounded-xl" />
    <Skeleton className="h-32 rounded-3xl" />
    <div className="flex gap-3 mt-6">
      <Skeleton className="h-12 w-24 rounded-xl" />
      <Skeleton className="h-12 w-24 rounded-xl" />
    </div>
  </div>
);

const TableRowSkeleton = ({ columns = 4 }) => (
  <div className="flex gap-4 p-6 border-b border-slate-200">
    {Array.from({ length: columns }).map((_, i) => (
      <Skeleton key={i} className="h-12 flex-1 rounded-xl" />
    ))}
  </div>
);

const PageSkeleton = () => (
  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
    <div className="lg:col-span-2 space-y-8">
      <div className="space-y-4">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
    <div className="space-y-8">
      <CardSkeleton />
      <CardSkeleton />
    </div>
  </div>
);

export { Skeleton, CardSkeleton, TableRowSkeleton, PageSkeleton };

