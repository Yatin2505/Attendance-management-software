import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { getBatches, getBatchById } from '../services/batchService';
import { getAttendance, markAttendanceBulk } from '../services/attendanceService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Users, CheckCircle, XCircle, Clock, Save,
  CheckSquare, Inbox, Search, Filter, ChevronDown, Zap,
  UserCheck, AlertCircle
} from 'lucide-react';

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS = { PRESENT: 'present', ABSENT: 'absent', LATE: 'late' };
const FILTERS = ['all', 'present', 'absent', 'late'];

// ─── StatusToggle (memoized for perf) ────────────────────────────────────────
const StatusToggle = React.memo(({ studentId, status, onStatusChange, disabled }) => {
  const btns = [
    { val: STATUS.PRESENT, label: 'P', icon: CheckCircle,  activeClass: 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30', hoverClass: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-500/10' },
    { val: STATUS.LATE,    label: 'L', icon: Clock,         activeClass: 'bg-amber-500  text-white shadow-lg shadow-amber-500/30',  hoverClass: 'hover:bg-amber-50  hover:text-amber-600  dark:hover:bg-amber-500/10'  },
    { val: STATUS.ABSENT,  label: 'A', icon: XCircle,       activeClass: 'bg-rose-500   text-white shadow-lg shadow-rose-500/30',   hoverClass: 'hover:bg-rose-50   hover:text-rose-600   dark:hover:bg-rose-500/10'   },
  ];

  return (
    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800/80 p-1 rounded-xl">
      {btns.map(({ val, label, icon: Icon, activeClass, hoverClass }) => (
        <button
          key={val}
          id={`att-${studentId}-${val}`}
          disabled={disabled}
          onClick={() => onStatusChange(studentId, val)}
          title={val.charAt(0).toUpperCase() + val.slice(1)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all duration-150 active:scale-95 select-none
            ${status === val
              ? activeClass
              : `text-slate-400 dark:text-slate-500 ${hoverClass}`
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <Icon className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{val}</span>
          <span className="sm:hidden">{label}</span>
        </button>
      ))}
    </div>
  );
});

// ─── StudentRow ───────────────────────────────────────────────────────────────
const StudentRow = React.memo(({ student, status, onStatusChange, isSaving, idx }) => {
  const isAbsent = status === STATUS.ABSENT;
  const isLate   = status === STATUS.LATE;

  const rowBg = isAbsent
    ? 'bg-rose-50/60 dark:bg-rose-900/10 border-rose-200/60 dark:border-rose-800/30'
    : isLate
    ? 'bg-amber-50/60 dark:bg-amber-900/10 border-amber-200/60 dark:border-amber-800/30'
    : 'bg-white dark:bg-slate-900 border-slate-200/60 dark:border-slate-800/40';

  const avatarBg = isAbsent
    ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'
    : isLate
    ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400'
    : 'bg-primary-100 dark:bg-primary-500/20 text-primary-600 dark:text-primary-400';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15, delay: Math.min(idx * 0.015, 0.3) }}
      className={`flex items-center gap-3 sm:gap-4 px-4 py-3 border rounded-xl transition-colors duration-200 ${rowBg}`}
    >
      {/* Avatar */}
      <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors duration-200 ${avatarBg}`}>
        {student.name.charAt(0).toUpperCase()}
      </div>

      {/* Name + Roll */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-slate-800 dark:text-white text-sm leading-tight truncate">{student.name}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">#{student.rollNumber}</p>
      </div>

      {/* Status badge (mobile helper) */}
      {isAbsent && (
        <span className="hidden xs:inline-flex items-center gap-1 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
          <XCircle className="w-3 h-3" /> Absent
        </span>
      )}
      {isLate && (
        <span className="hidden xs:inline-flex items-center gap-1 text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-500/20 px-2 py-0.5 rounded-full flex-shrink-0">
          <Clock className="w-3 h-3" /> Late
        </span>
      )}

      {/* Toggle */}
      <StatusToggle
        studentId={student._id}
        status={status}
        onStatusChange={onStatusChange}
        disabled={isSaving}
      />
    </motion.div>
  );
});

// ─── Main Component ───────────────────────────────────────────────────────────
const Attendance = () => {
  const today = new Date().toISOString().split('T')[0];

  // Core state
  const [date, setDate]                     = useState(today);
  const [batches, setBatches]               = useState([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [students, setStudents]             = useState([]);
  const [localStatuses, setLocalStatuses]   = useState({}); // { studentId: status }

  // UI state
  const [loadingBatches, setLoadingBatches] = useState(true);
  const [loadingData, setLoadingData]       = useState(false);
  const [isSaving, setIsSaving]             = useState(false);
  const [searchQuery, setSearchQuery]       = useState('');
  const [activeFilter, setActiveFilter]     = useState('all');
  const [saveSuccess, setSaveSuccess]       = useState(false);

  const searchRef = useRef(null);

  // ── Load batches once ──────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        setLoadingBatches(true);
        const data = await getBatches();
        setBatches(data);
      } catch {
        toast.error('Failed to load batches');
      } finally {
        setLoadingBatches(false);
      }
    })();
  }, []);

  // ── Load batch data (students + existing attendance) ───────────────────────
  useEffect(() => {
    if (!selectedBatchId || !date) {
      setStudents([]);
      setLocalStatuses({});
      return;
    }
    loadBatchData(selectedBatchId, date);
  }, [selectedBatchId, date]);

  const loadBatchData = async (batchId, selectedDate) => {
    try {
      setLoadingData(true);
      setSearchQuery('');
      setActiveFilter('all');

      // Parallel fetch — batch students + existing records at the same time
      const [batchObj, records] = await Promise.all([
        getBatchById(batchId),
        getAttendance(selectedDate, batchId, ''),
      ]);

      const batchStudents = batchObj.students || [];
      setStudents(batchStudents);

      // Build status map from existing records
      const statusMap = {};
      records.forEach(record => {
        const sid = typeof record.studentId === 'object' ? record.studentId._id : record.studentId;
        statusMap[sid] = record.status;
      });

      // Default new students to 'present'
      batchStudents.forEach(student => {
        if (!statusMap[student._id]) statusMap[student._id] = STATUS.PRESENT;
      });

      setLocalStatuses(statusMap);
    } catch {
      toast.error('Failed to load attendance data');
    } finally {
      setLoadingData(false);
    }
  };

  // ── Status toggler ─────────────────────────────────────────────────────────
  const handleStatusChange = useCallback((studentId, status) => {
    setLocalStatuses(prev => ({ ...prev, [studentId]: status }));
  }, []);

  // ── Mark All Present (local only — no API call until Save) ─────────────────
  const handleMarkAllPresent = useCallback(() => {
    if (!students.length) return;
    const all = {};
    students.forEach(s => { all[s._id] = STATUS.PRESENT; });
    setLocalStatuses(all);
    toast.success('All students marked present — click Save to confirm', { icon: '⚡' });
  }, [students]);

  // ── Save (single bulk request) ─────────────────────────────────────────────
  const handleSaveAttendance = async () => {
    if (!selectedBatchId || !date || students.length === 0) return;
    setIsSaving(true);
    setSaveSuccess(false);

    const records = students.map(s => ({
      studentId: s._id,
      status: localStatuses[s._id] || STATUS.PRESENT,
    }));

    // Optimistic toast
    const toastId = toast.loading('Saving attendance…');
    try {
      const result = await markAttendanceBulk(selectedBatchId, date, records);
      toast.dismiss(toastId);
      toast.success(`✅ Attendance saved for ${result.total ?? records.length} students!`, { duration: 3000 });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      toast.dismiss(toastId);
      toast.error(err?.response?.data?.message || 'Failed to save attendance. Please retry.');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Derived stats ──────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const values = Object.values(localStatuses);
    return {
      total:   students.length,
      present: values.filter(s => s === STATUS.PRESENT).length,
      absent:  values.filter(s => s === STATUS.ABSENT).length,
      late:    values.filter(s => s === STATUS.LATE).length,
    };
  }, [localStatuses, students]);

  // ── Filtered + searched list ───────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students.filter(student => {
      const matchesSearch = !q ||
        student.name.toLowerCase().includes(q) ||
        String(student.rollNumber).includes(q);
      const matchesFilter = activeFilter === 'all' || localStatuses[student._id] === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [students, searchQuery, activeFilter, localStatuses]);

  const hasSelectedBatch = !!selectedBatchId;
  const hasStudents = students.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col gap-0 pb-6">

      {/* ── Sticky Control Bar ─────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel rounded-2xl mb-4 overflow-hidden"
      >
        {/* Top row: title + controls */}
        <div className="px-5 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-primary-500/10 flex items-center justify-center">
              <CheckSquare className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h1 className="text-lg font-display font-bold text-slate-900 dark:text-white leading-none">Daily Attendance</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Mark fast, save once</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 sm:ml-auto w-full sm:w-auto">
            {/* Date */}
            <div className="relative flex-1 sm:flex-none sm:w-44">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id="att-date"
                type="date"
                value={date}
                max={today}
                onChange={e => setDate(e.target.value)}
                disabled={isSaving || loadingData}
                className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
              />
            </div>

            {/* Batch */}
            <div className="relative flex-1 sm:flex-none sm:w-52">
              <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <select
                id="att-batch"
                value={selectedBatchId}
                onChange={e => setSelectedBatchId(e.target.value)}
                disabled={loadingBatches || isSaving || loadingData}
                className="w-full pl-9 pr-8 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all appearance-none"
              >
                <option value="">{loadingBatches ? 'Loading…' : 'Select Batch…'}</option>
                {batches.map(b => (
                  <option key={b._id} value={b._id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>

            {/* Mark All Present */}
            {hasStudents && (
              <button
                id="att-mark-all"
                onClick={handleMarkAllPresent}
                disabled={isSaving}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 active:scale-95 transition-all disabled:opacity-50 whitespace-nowrap"
              >
                <Zap className="w-4 h-4" />
                <span className="hidden sm:inline">Mark All Present</span>
                <span className="sm:hidden">All ✓</span>
              </button>
            )}

            {/* Save */}
            {hasStudents && (
              <button
                id="att-save"
                onClick={handleSaveAttendance}
                disabled={isSaving}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all active:scale-95 disabled:opacity-60 whitespace-nowrap
                  ${saveSuccess
                    ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30'
                    : 'bg-gradient-to-r from-primary-600 to-primary-500 shadow-md shadow-primary-500/20 hover:shadow-lg hover:shadow-primary-500/30'
                  }`}
              >
                {isSaving ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : saveSuccess ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isSaving ? 'Saving…' : saveSuccess ? 'Saved!' : 'Save Attendance'}
              </button>
            )}
          </div>
        </div>

        {/* Bottom row: stats + search + filter (only when students loaded) */}
        <AnimatePresence>
          {hasStudents && !loadingData && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t border-slate-200 dark:border-slate-800 px-5 py-3 flex flex-col sm:flex-row items-start sm:items-center gap-3"
            >
              {/* Live stats */}
              <div className="flex items-center gap-4 text-sm font-semibold flex-wrap">
                <span className="text-slate-500 dark:text-slate-400">{stats.total} total</span>
                <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle className="w-3.5 h-3.5" />{stats.present}
                </span>
                <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400">
                  <XCircle className="w-3.5 h-3.5" />{stats.absent}
                </span>
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Clock className="w-3.5 h-3.5" />{stats.late}
                </span>
              </div>

              <div className="flex items-center gap-2 sm:ml-auto w-full sm:w-auto flex-wrap">
                {/* Search */}
                <div className="relative flex-1 sm:flex-none sm:w-52">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    ref={searchRef}
                    id="att-search"
                    type="text"
                    placeholder="Search name or roll…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 transition-all"
                  />
                </div>

                {/* Filter tabs */}
                <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 rounded-xl p-1">
                  {FILTERS.map(f => (
                    <button
                      key={f}
                      id={`att-filter-${f}`}
                      onClick={() => setActiveFilter(f)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide transition-all
                        ${activeFilter === f
                          ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
                        }`}
                    >
                      {f === 'all' ? 'All' : f === 'present' ? `✓ ${stats.present}` : f === 'absent' ? `✗ ${stats.absent}` : `⏱ ${stats.late}`}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Body ──────────────────────────────────────────────────────────── */}
      {!hasSelectedBatch ? (
        /* Empty state: no batch selected */
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 premium-card flex flex-col items-center justify-center p-12 text-center rounded-2xl"
        >
          <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center mb-5 shadow-inner">
            <Users className="w-10 h-10 text-primary-400" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-2">Select a Batch to Begin</h2>
          <p className="text-slate-400 text-sm max-w-xs">Choose a batch from the dropdown above. Students will load instantly.</p>
        </motion.div>

      ) : loadingData ? (
        /* Loading skeleton */
        <div className="flex-1 flex flex-col gap-2.5">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-slate-800/60 animate-pulse"
              style={{ animationDelay: `${i * 60}ms` }} />
          ))}
        </div>

      ) : !hasStudents ? (
        /* Empty batch */
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 premium-card flex flex-col items-center justify-center p-12 text-center rounded-2xl"
        >
          <Inbox className="w-16 h-16 text-slate-300 dark:text-slate-600 mb-4" />
          <h2 className="text-xl font-display font-bold text-slate-800 dark:text-white mb-2">Empty Roster</h2>
          <p className="text-slate-400 text-sm">No students enrolled in this batch yet.</p>
        </motion.div>

      ) : (
        /* Student list */
        <div className="flex-1 flex flex-col gap-2 overflow-y-auto custom-scrollbar pr-1">

          {/* Absent students banner */}
          {stats.absent > 0 && activeFilter === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 px-4 py-2.5 bg-rose-50 dark:bg-rose-900/20 border border-rose-200/60 dark:border-rose-700/30 rounded-xl text-sm"
            >
              <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0" />
              <span className="text-rose-700 dark:text-rose-300 font-medium">
                <strong>{stats.absent}</strong> student{stats.absent !== 1 ? 's are' : ' is'} marked absent
              </span>
              <button
                onClick={() => setActiveFilter('absent')}
                className="ml-auto text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline"
              >
                View →
              </button>
            </motion.div>
          )}

          {/* No results from search/filter */}
          {filteredStudents.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-12 text-center"
            >
              <Search className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-3" />
              <p className="text-slate-500 dark:text-slate-400 font-medium">No students match your search or filter</p>
              <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                className="mt-3 text-xs text-primary-500 font-bold hover:underline">
                Clear filters
              </button>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredStudents.map((student, idx) => (
                <StudentRow
                  key={student._id}
                  student={student}
                  status={localStatuses[student._id]}
                  onStatusChange={handleStatusChange}
                  isSaving={isSaving}
                  idx={idx}
                />
              ))}
            </AnimatePresence>
          )}
        </div>
      )}
    </div>
  );
};

export default Attendance;
