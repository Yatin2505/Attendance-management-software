import React, { useState, useEffect, useMemo } from 'react';
import { getBatches } from '../services/batchService';
import { getStudents } from '../services/studentService';
import {
  getBatchReport, getDateRangeReport,
  getStudentReport, getMonthlyReport
} from '../services/reportService';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
  AreaChart, Area, Legend
} from 'recharts';
import {
  BarChart3, PieChart as PieIcon, Calendar, Users, FileText,
  Download, TrendingUp, TrendingDown, UserCheck, UserX, Clock,
  Filter, Activity, ChevronDown, ChevronUp, ChevronsUpDown,
  Search, Layers, GraduationCap, AlertCircle, RefreshCw
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { getFees } from '../services/feeService';

// ─── Theme colors ────────────────────────────────────────────────────────────
const GREEN = '#10b981';
const RED   = '#f43f5e';
const AMBER = '#f59e0b';
const INDIGO= '#6366f1';
const VIOLET= '#8b5cf6';

// ─── Percentage badge ─────────────────────────────────────────────────────────
const PctBadge = ({ pct }) => {
  const color = pct >= 75
    ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30'
    : pct >= 60
    ? 'bg-amber-100 dark:bg-amber-500/15 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30'
    : 'bg-rose-100 dark:bg-rose-500/15 text-rose-800 dark:text-rose-400 border-rose-200 dark:border-rose-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold border ${color}`}>
      {pct}%
    </span>
  );
};

// ─── Custom chart tooltip ─────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg px-3 py-2 text-xs font-semibold">
      <p className="text-slate-500 dark:text-slate-400 mb-1 max-w-[160px] truncate">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-bold">
          {p.name}: {p.value}{p.name.includes('%') ? '' : ''}
        </p>
      ))}
    </div>
  );
};

// ─── Sortable table header ────────────────────────────────────────────────────
const SortTh = ({ label, sortKey, sortState, onSort, className = '' }) => {
  const [key, dir] = sortState;
  const active = key === sortKey;
  return (
    <th
      className={`py-3 px-4 text-left text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 cursor-pointer select-none hover:text-slate-800 dark:hover:text-white transition-colors whitespace-nowrap ${className}`}
      onClick={() => onSort(sortKey)}
    >
      <span className="flex items-center gap-1">
        {label}
        {active
          ? (dir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
};

// ─── Empty state ──────────────────────────────────────────────────────────────
const EmptyState = ({ icon: Icon, title, sub }) => (
  <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400 dark:text-slate-600">
    <Icon className="w-12 h-12 opacity-30" />
    <p className="text-base font-semibold text-slate-600 dark:text-slate-400">{title}</p>
    {sub && <p className="text-sm">{sub}</p>}
  </div>
);

// ─── Stat summary strip ───────────────────────────────────────────────────────
const StatStrip = ({ items }) => (
  <div className="flex flex-wrap gap-3">
    {items.map(({ label, value, color }) => (
      <div key={label} className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl px-4 py-2.5">
        <span className={`text-xl font-display font-bold ${color}`}>{value}</span>
        <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide">{label}</span>
      </div>
    ))}
  </div>
);

// ─── Excel export helper ──────────────────────────────────────────────────────
const exportToExcel = (rows, headers, filename) => {
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `${filename}.xlsx`);
};

// ─── Report types config ──────────────────────────────────────────────────────
const REPORT_TYPES = [
  { value: 'batch',   label: 'Batch-wise',    icon: Layers },
  { value: 'monthly', label: 'Monthly',        icon: Calendar },
  { value: 'range',   label: 'Date Range',     icon: Clock },
  { value: 'student', label: 'Student-wise',   icon: GraduationCap },
  { value: 'fees',    label: 'Financial Hub',  icon: DollarSign },
];

// ─── Main Component ───────────────────────────────────────────────────────────
const Reports = () => {
  const today        = new Date().toISOString().split('T')[0];
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const [reportType, setReportType] = useState('batch');
  const [batches,     setBatches]   = useState([]);
  const [students,    setStudents]  = useState([]);
  const [selBatchId,  setSelBatchId]  = useState('');
  const [selStudentId,setSelStudentId]= useState('');
  const [fromDate,    setFromDate]  = useState(firstOfMonth);
  const [toDate,      setToDate]    = useState(today);
  const [month,       setMonth]     = useState(String(new Date().getMonth() + 1).padStart(2, '0'));
  const [year,        setYear]      = useState(String(new Date().getFullYear()));

  const [loading,     setLoading]   = useState(false);
  const [reportData,  setReportData]= useState(null);
  const [search,      setSearch]    = useState('');
  const [sort,        setSort]      = useState(['name', 'asc']); // [key, dir]
  const [statusFilter, setStatusFilter] = useState('all');
  const [monthNameFilter, setMonthNameFilter] = useState('all');

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getBatches(), getStudents()])
      .then(([b, s]) => { setBatches(b); setStudents(s); })
      .catch(() => toast.error('Failed to load filter data'));
  }, []);

  // ── Reset data when type changes ─────────────────────────────────────────────
  useEffect(() => {
    setReportData(null);
    setSearch('');
    setSort(['name', 'asc']);
  }, [reportType]);

  // ── Generate ────────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    setLoading(true);
    setReportData(null);
    try {
      let data;
      if (reportType === 'batch') {
        if (!selBatchId) { toast.error('Please select a batch'); return; }
        data = await getBatchReport(selBatchId);
      } else if (reportType === 'monthly') {
        data = await getMonthlyReport(parseInt(month, 10), year, selBatchId || undefined);
      } else if (reportType === 'range') {
        if (!fromDate || !toDate) { toast.error('Please select date range'); return; }
        data = await getDateRangeReport(fromDate, toDate, selBatchId || undefined);
      } else if (reportType === 'student') {
        if (!selStudentId) { toast.error('Please select a student'); return; }
        data = await getStudentReport(selStudentId);
      } else if (reportType === 'fees') {
        data = await getFees({
          batchId: selBatchId || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          month: monthNameFilter !== 'all' ? monthNameFilter : undefined,
          year: year || undefined
        });
      }
      setReportData(data);
      toast.success('Report ready');
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  // ── Sorting helper ──────────────────────────────────────────────────────────
  const handleSort = (key) => {
    setSort(prev => prev[0] === key
      ? [key, prev[1] === 'asc' ? 'desc' : 'asc']
      : [key, 'asc']
    );
  };

  // ── Derive table rows (with search + sort) ──────────────────────────────────
  const tableRows = useMemo(() => {
    let raw = [];
    if (!reportData) return raw;

    if (reportType === 'batch')   raw = reportData.studentsReport ?? [];
    if (reportType === 'monthly') raw = reportData.data ?? [];
    if (reportType === 'range')   raw = reportData.data ?? [];
    if (reportType === 'student') raw = reportData.batchReports ?? [];
    if (reportType === 'fees')    raw = reportData ?? [];

    // Search filter
    const q = search.toLowerCase().trim();
    if (q) {
      raw = raw.filter(r =>
        (r.name        ?? r.batchName ?? '').toLowerCase().includes(q) ||
        (r.rollNumber  ?? '').toLowerCase().includes(q) ||
        (r.batchName   ?? '').toLowerCase().includes(q)
      );
    }

    // Sort
    const [key, dir] = sort;
    raw = [...raw].sort((a, b) => {
      const av = a[key] ?? a['batchName'] ?? '';
      const bv = b[key] ?? b['batchName'] ?? '';
      if (typeof av === 'number') return dir === 'asc' ? av - bv : bv - av;
      return dir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av));
    });

    return raw;
  }, [reportData, reportType, search, sort]);

  // ── Aggregate stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!reportData) return null;
    if (reportType === 'student') {
      const s = reportData.stats;
      return {
        total:   s.totalDays,
        present: s.presentDays,
        absent:  s.absentDays,
        leave:   s.leaveDays,
        pct:     s.percentage,
      };
    }
    if (reportType === 'fees') {
      const total   = rows.reduce((a, r) => a + (r.amount ?? 0), 0);
      const paid    = rows.reduce((a, r) => a + (r.paidAmount ?? 0), 0);
      const pending = total - paid;
      return { total, paid, pending, pct: total > 0 ? Math.round((paid / total) * 100) : 100 };
    }
    const total   = rows.reduce((a, r) => a + (r.totalDays   ?? 0), 0);
    const present = rows.reduce((a, r) => a + (r.presentDays ?? 0), 0);
    const leave   = rows.reduce((a, r) => a + (r.leaveDays   ?? 0), 0);
    const absent  = total - present - leave;
    const denom   = total - leave;
    return {
      total,
      present,
      absent,
      leave,
      pct:    denom > 0 ? Math.round((present / denom) * 100) : 0,
    };
  }, [reportData, reportType, tableRows]);

  // ── Excel export ────────────────────────────────────────────────────────────
  const handleExport = () => {
    if (!reportData) return;
    let headers, rows, filename;

    if (reportType === 'student') {
      const s = reportData.stats;
      const st = reportData.student;
      headers = ['Name', 'Roll Number', 'Total Days', 'Present Days', 'Absent Days', 'Leave Days', 'Attendance %'];
      rows = reportData.batchReports.map(r => [
        st?.name, st?.rollNumber, r.totalDays, r.presentDays, r.absentDays, r.leaveDays, r.percentage
      ]);
      if (!rows.length) rows = [[st?.name, st?.rollNumber, s.totalDays, s.presentDays, s.absentDays, s.leaveDays, s.percentage]];
      filename = `student_report_${st?.rollNumber ?? 'export'}`;
    } else if (reportType === 'fees') {
      headers = ['Student', 'Roll Number', 'Total Amount', 'Paid Amount', 'Pending Amount', 'Status', 'Month', 'Year'];
      rows = tableRows.map(r => [
        r.studentId?.name ?? 'Unknown',
        r.studentId?.rollNumber ?? '',
        r.amount,
        r.paidAmount,
        r.amount - r.paidAmount,
        r.status,
        r.month,
        r.year
      ]);
      filename = `fees_report_${year}_${monthNameFilter}`;
    } else {
      headers = ['Name', 'Roll Number', 'Total Days', 'Present Days', 'Absent Days', 'Leave Days', 'Attendance %'];
      rows = tableRows.map(r => [
        r.name ?? r.batchName ?? '',
        r.rollNumber ?? '',
        r.totalDays ?? 0,
        r.presentDays ?? 0,
        (r.totalDays ?? 0) - (r.presentDays ?? 0) - (r.leaveDays ?? 0),
        r.leaveDays ?? 0,
        r.percentage ?? 0,
      ]);
      filename = reportType === 'batch'
        ? `batch_report_${reportData.batch?.name ?? 'export'}`
        : reportType === 'monthly'
        ? `monthly_report_${year}_${month}`
        : `range_report_${fromDate}_to_${toDate}`;
    }

    exportToExcel(rows, headers, filename);
    toast.success('Excel file downloaded!');
  };

  // ── Chart data ──────────────────────────────────────────────────────────────
  const barChartData = useMemo(() => {
    if (reportType === 'student') {
      return (reportData?.batchReports ?? []).map(r => ({
        name: r.batchName,
        'Attendance %': r.percentage,
      }));
    }
    if (reportType === 'fees') {
      return tableRows.slice(0, 20).map(r => ({
        name: (r.studentId?.name ?? 'Unknown').split(' ')[0],
        fullName: r.studentId?.name,
        'Paid %': r.amount > 0 ? Math.round((r.paidAmount / r.amount) * 100) : 0,
      }));
    }
    return tableRows.slice(0, 20).map(r => ({
      name: (r.name ?? r.batchName ?? '').split(' ')[0],       // first word for narrow bars
      fullName: r.name ?? r.batchName ?? '',
      'Attendance %': r.percentage,
    }));
  }, [tableRows, reportType, reportData]);

  const pieData = useMemo(() => {
    if (!stats) return [];
    if (reportType === 'fees') {
      return [
        { name: 'Paid',    value: stats.paid },
        { name: 'Pending', value: stats.pending },
      ];
    }
    return [
      { name: 'Present', value: stats.present },
      { name: 'Absent',  value: stats.absent  },
      { name: 'Leave',   value: stats.leave   },
    ];
  }, [stats, reportType]);

  // ── Years list for monthly ──────────────────────────────────────────────────
  const yearOptions = useMemo(() => {
    const y = new Date().getFullYear();
    return [y - 2, y - 1, y, y + 1].map(String);
  }, []);

  // ─── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-5 pb-6">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-display font-bold text-slate-900 dark:text-white">Reports</h1>
        <p className="text-sm text-slate-400 dark:text-slate-500 font-medium mt-0.5">
          Attendance analytics across batches, students, and time periods
        </p>
      </motion.div>

      {/* ── Filter panel ────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="premium-card p-5"
      >
        {/* Report type tabs */}
        <div className="flex flex-wrap gap-2 mb-5">
          {REPORT_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              id={`report-tab-${value}`}
              onClick={() => setReportType(value)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all
                ${reportType === value
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        {/* Filters row */}
        <div className="flex flex-wrap items-end gap-3">

          {/* Batch select — for batch, monthly, range */}
          {['batch', 'monthly', 'range'].includes(reportType) && (
            <div className="flex flex-col gap-1.5 min-w-[180px] flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" />
                {reportType === 'batch' ? 'Batch *' : 'Batch (optional)'}
              </label>
              <div className="relative">
                <select
                  id="filter-batch"
                  value={selBatchId}
                  onChange={e => setSelBatchId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none"
                >
                  <option value="">{reportType === 'batch' ? '— Select Batch —' : 'All Batches'}</option>
                  {batches.map(b => <option key={b._id} value={b._id}>{b.name}</option>)}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Student select */}
          {reportType === 'student' && (
            <div className="flex flex-col gap-1.5 min-w-[200px] flex-1">
              <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5" /> Student *
              </label>
              <div className="relative">
                <select
                  id="filter-student"
                  value={selStudentId}
                  onChange={e => setSelStudentId(e.target.value)}
                  className="w-full pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none"
                >
                  <option value="">— Select Student —</option>
                  {students.map(s => (
                    <option key={s._id} value={s._id}>{s.name} ({s.rollNumber})</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
            </div>
          )}

          {/* Month + Year for monthly */}
          {(reportType === 'monthly' || reportType === 'fees') && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                   {reportType === 'fees' ? 'Billing Month' : 'Month'}
                </label>
                <select
                  id="filter-month"
                  value={reportType === 'fees' ? monthNameFilter : month}
                  onChange={e => reportType === 'fees' ? setMonthNameFilter(e.target.value) : setMonth(e.target.value)}
                  className="pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none"
                >
                  {reportType === 'fees' && <option value="all">Any Month</option>}
                  {['January','February','March','April','May','June','July','August','September','October','November','December']
                    .map((m, i) => <option key={i} value={reportType === 'fees' ? m : String(i+1).padStart(2,'0')}>{m}</option>)}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Year</label>
                <select
                  id="filter-year"
                  value={year}
                  onChange={e => setYear(e.target.value)}
                  className="pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none"
                >
                  {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </>
          )}

          {/* Status for Fees */}
          {reportType === 'fees' && (
            <div className="flex flex-col gap-1.5 min-w-[120px]">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Status</label>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="pl-3 pr-8 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40 appearance-none"
              >
                <option value="all">All Status</option>
                <option value="Paid">Paid</option>
                <option value="Partial">Partial</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
          )}

          {/* Date range */}
          {reportType === 'range' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> From
                </label>
                <input
                  id="filter-from"
                  type="date"
                  value={fromDate}
                  max={toDate}
                  onChange={e => setFromDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> To
                </label>
                <input
                  id="filter-to"
                  type="date"
                  value={toDate}
                  min={fromDate}
                  max={today}
                  onChange={e => setToDate(e.target.value)}
                  className="px-3 py-2.5 rounded-xl text-sm font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                />
              </div>
            </>
          )}

          {/* Generate button */}
          <button
            id="btn-generate"
            onClick={handleGenerate}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl text-sm transition-all active:scale-95 disabled:opacity-60 shadow-sm shadow-primary-500/20 whitespace-nowrap"
          >
            {loading
              ? <RefreshCw className="w-4 h-4 animate-spin" />
              : <BarChart3 className="w-4 h-4" />
            }
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>
      </motion.div>

      {/* ── Results ─────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {!reportData && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="premium-card flex flex-col items-center justify-center py-20 gap-4"
          >
            <PieIcon className="w-14 h-14 text-slate-300 dark:text-slate-700" />
            <p className="text-base font-semibold text-slate-600 dark:text-slate-400">
              Configure filters above and click <strong>Generate</strong> to see your report
            </p>
          </motion.div>
        )}

        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="premium-card flex flex-col items-center justify-center py-20 gap-4"
          >
            <div className="w-10 h-10 border-4 border-primary-200 dark:border-slate-700 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-slate-400 dark:text-slate-500 tracking-widest uppercase">Compiling report…</p>
          </motion.div>
        )}

        {reportData && !loading && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-5"
          >
            {/* ── Result header ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 premium-card px-5 py-4">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  {reportType === 'batch'   && `Batch Report: ${reportData.batch?.name ?? ''}`}
                  {reportType === 'monthly' && `Monthly Report — ${['','Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(month,10)]} ${year}`}
                  {reportType === 'range'   && `Date Range: ${fromDate} → ${toDate}`}
                  {reportType === 'student' && `Student: ${reportData.student?.name} (${reportData.student?.rollNumber})`}
                </h2>
                {stats && (
                  <p className="text-xs text-slate-400 mt-0.5 font-medium">
                    {tableRows.length} record{tableRows.length !== 1 ? 's' : ''} ·{' '}
                    <span className={stats.pct >= 75 ? 'text-emerald-500' : stats.pct >= 60 ? 'text-amber-500' : 'text-rose-500'}>
                      {reportType === 'fees' ? `${stats.pct}% collection rate` : `${stats.pct}% overall attendance`}
                    </span>
                  </p>
                )}
              </div>
              <button
                id="btn-export"
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20 active:scale-95 transition-all whitespace-nowrap"
              >
                <Download className="w-4 h-4" /> Export Excel
              </button>
            </div>

            {/* ── Stat strip ─────────────────────────────────────────────── */}
            {stats && reportType === 'fees' && (
              <StatStrip items={[
                { label: 'Total Amount',    value: `₹${stats.total.toLocaleString()}`, color: 'text-slate-800 dark:text-white' },
                { label: 'Paid Amount',     value: `₹${stats.paid.toLocaleString()}`,  color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Pending Dues',    value: `₹${stats.pending.toLocaleString()}`, color: 'text-rose-600 dark:text-rose-400' },
                { label: 'Collection Rate', value: `${stats.pct}%`,
                  color: stats.pct >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                       : stats.pct >= 50 ? 'text-amber-600 dark:text-amber-400'
                       : 'text-rose-600 dark:text-rose-400'
                },
              ]} />
            )}
            {stats && reportType !== 'fees' && (
              <StatStrip items={[
                { label: 'Total Sessions', value: stats.total,   color: 'text-slate-800 dark:text-white'   },
                { label: 'Present',        value: stats.present, color: 'text-emerald-600 dark:text-emerald-400' },
                { label: 'Absent',         value: stats.absent,  color: 'text-rose-600 dark:text-rose-400'  },
                { label: 'Leave',          value: stats.leave,   color: 'text-violet-600 dark:text-violet-400' },
                { label: 'Attendance %',   value: `${stats.pct}%`,
                  color: stats.pct >= 75 ? 'text-emerald-600 dark:text-emerald-400'
                       : stats.pct >= 60 ? 'text-amber-600 dark:text-amber-400'
                       : 'text-rose-600 dark:text-rose-400'
                },
              ]} />
            )}

            {/* ── Charts ─────────────────────────────────────────────────── */}
            <div className={`grid gap-5 ${reportType === 'student' ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1 lg:grid-cols-3'}`}>

              {/* Bar chart */}
              {barChartData.length > 0 && (
                <div className={`premium-card p-5 ${reportType === 'student' ? '' : 'lg:col-span-2'}`}>
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">
                    Attendance % by {reportType === 'student' ? 'Batch' : 'Student'}
                  </h3>
                  <div className="h-56 -ml-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barChartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }} barSize={24}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.6} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }} dy={6} />
                        <YAxis domain={[0, 100]} axisLine={false} tickLine={false}
                          tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={v => `${v}%`} />
                        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
                        <Bar dataKey={reportType === 'fees' ? 'Paid %' : 'Attendance %'} radius={[4, 4, 0, 0]}>
                          {barChartData.map((entry, i) => (
                            <Cell key={i} fill={
                              (entry[reportType === 'fees' ? 'Paid %' : 'Attendance %'] ?? 0) >= 75 ? GREEN
                            : (entry[reportType === 'fees' ? 'Paid %' : 'Attendance %'] ?? 0) >= 50 ? AMBER : RED
                            } />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {/* Color legend */}
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {reportType === 'fees' ? (
                      [['≥ 75%', GREEN], ['50–74%', AMBER], ['< 50%', RED]].map(([l, c]) => (
                        <span key={l} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
                        </span>
                      ))
                    ) : (
                      [['≥ 75%', GREEN], ['60–74%', AMBER], ['< 60%', RED]].map(([l, c]) => (
                        <span key={l} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ background: c }} />{l}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Pie chart — present vs absent */}
              {stats && stats.total > 0 && (
                <div className="premium-card p-5 flex flex-col">
                  <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Distribution</h3>
                  <div className="flex-1 flex items-center justify-center">
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%" cy="50%"
                            innerRadius={60} outerRadius={80}
                            paddingAngle={5} dataKey="value"
                            stroke="none" cornerRadius={4}
                          >
                            {pieData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={
                                reportType === 'fees'
                                  ? (entry.name === 'Paid' ? GREEN : RED)
                                  : (entry.name === 'Present' ? GREEN : entry.name === 'Leave' ? VIOLET : RED)
                              } />
                            ))}
                          </Pie>
                          <Tooltip content={<ChartTooltip />} />
                          <Legend
                            formatter={(v) => <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{v}</span>}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  {/* center label */}
                  <p className="text-center text-sm font-bold mt-1">
                    <span className={stats.pct >= 75 ? 'text-emerald-500' : stats.pct >= 60 ? 'text-amber-500' : 'text-rose-500'}>
                      {stats.pct}%
                    </span>
                    <span className="text-slate-400 dark:text-slate-500 font-normal"> attendance rate</span>
                  </p>
                </div>
              )}
            </div>

            {/* ── Student batch breakdown (student report only) ───────────── */}
            {reportType === 'student' && (reportData.batchReports?.length ?? 0) > 1 && (
              <div className="premium-card p-5">
                <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Batch-wise Breakdown</h3>
                <div className="flex flex-wrap gap-3">
                  {reportData.batchReports.map((r, i) => (
                    <div key={i} className="flex-1 min-w-[160px] bg-slate-50 dark:bg-slate-800/60 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-500 dark:text-slate-400 truncate mb-1">{r.batchName}</p>
                      <p className="text-2xl font-display font-bold text-slate-900 dark:text-white">{r.percentage}%</p>
                      <p className="text-[10px] text-slate-400 mt-1">P:{r.presentDays} L:{r.leaveDays} T:{r.totalDays}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Data table ──────────────────────────────────────────────── */}
            <div className="premium-card overflow-hidden flex flex-col">
              {/* Table toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white">
                  Detailed Data
                  <span className="ml-2 text-xs font-normal text-slate-400">({tableRows.length} records)</span>
                </h3>
                <div className="relative w-full sm:w-56">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                  <input
                    id="report-search"
                    type="text"
                    placeholder="Search name or roll…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl text-xs font-medium bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/40"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                {tableRows.length === 0 ? (
                  <EmptyState
                    icon={AlertCircle}
                    title="No records found"
                    sub={search ? 'Try a different search term' : 'No attendance data for the selected parameters'}
                  />
                ) : (
                  <table className="w-full text-left min-w-[540px]">
                    <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10">
                      <tr className="border-b border-slate-100 dark:border-slate-800">
                        <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-400 w-8">#</th>
                        {reportType === 'student' ? (
                          <SortTh label="Batch"        sortKey="batchName"   sortState={sort} onSort={handleSort} />
                        ) : reportType === 'fees' ? (
                          <>
                            <SortTh label="Student"    sortKey="studentId.name" sortState={sort} onSort={handleSort} />
                            <SortTh label="Roll No."   sortKey="studentId.rollNumber" sortState={sort} onSort={handleSort} className="hidden sm:table-cell" />
                          </>
                        ) : (
                          <>
                            <SortTh label="Name"       sortKey="name"        sortState={sort} onSort={handleSort} />
                            <SortTh label="Roll No."   sortKey="rollNumber"  sortState={sort} onSort={handleSort} className="hidden sm:table-cell" />
                          </>
                        )}
                        {reportType === 'fees' ? (
                          <>
                            <SortTh label="Total"      sortKey="amount"      sortState={sort} onSort={handleSort} className="text-center" />
                            <SortTh label="Paid"       sortKey="paidAmount"  sortState={sort} onSort={handleSort} className="text-center" />
                            <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-400 text-center">Pending</th>
                            <SortTh label="Month"      sortKey="month"       sortState={sort} onSort={handleSort} className="text-center" />
                            <SortTh label="Status"     sortKey="status"      sortState={sort} onSort={handleSort} className="text-center" />
                          </>
                        ) : (
                          <>
                            <SortTh label="Total"      sortKey="totalDays"   sortState={sort} onSort={handleSort} className="text-center" />
                            <SortTh label="Present"    sortKey="presentDays" sortState={sort} onSort={handleSort} className="text-center" />
                            <SortTh label="Leave"      sortKey="leaveDays"   sortState={sort} onSort={handleSort} className="text-center" />
                            <th className="py-3 px-4 text-xs font-bold uppercase tracking-wide text-slate-400 text-center">Absent</th>
                            <SortTh label="Attendance %" sortKey="percentage" sortState={sort} onSort={handleSort} className="text-center" />
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {tableRows.map((row, idx) => {
                        if (reportType === 'fees') {
                           return (
                             <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                               <td className="py-3 px-4 text-xs text-slate-400 font-medium">{idx + 1}</td>
                               <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center text-xs font-bold text-emerald-600 dark:text-emerald-400 flex-shrink-0">
                                      {(row.studentId?.name ?? '?').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{row.studentId?.name}</span>
                                  </div>
                               </td>
                               <td className="py-3 px-4 text-xs font-mono text-slate-400 hidden sm:table-cell">{row.studentId?.rollNumber ?? '—'}</td>
                               <td className="py-3 px-4 text-sm text-center text-slate-600 dark:text-slate-300 font-medium">₹{row.amount}</td>
                               <td className="py-3 px-4 text-sm text-center font-bold text-emerald-600">₹{row.paidAmount}</td>
                               <td className="py-3 px-4 text-sm text-center font-bold text-rose-600">₹{row.amount - row.paidAmount}</td>
                               <td className="py-3 px-4 text-xs text-center text-slate-500 font-medium">{row.month} {row.year}</td>
                               <td className="py-3 px-4 text-center">
                                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                                   row.status === 'Paid' ? 'bg-emerald-100 text-emerald-600' : 
                                   row.status === 'Partial' ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
                                 }`}>{row.status}</span>
                               </td>
                             </tr>
                           );
                        }
                        const absent = (row.totalDays ?? 0) - (row.presentDays ?? 0);
                        return (
                          <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-4 text-xs text-slate-400 font-medium">{idx + 1}</td>
                            {reportType === 'student' ? (
                              <td className="py-3 px-4 text-sm font-semibold text-slate-800 dark:text-white">{row.batchName}</td>
                            ) : (
                              <>
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-2.5">
                                    <div className="w-7 h-7 rounded-lg bg-primary-50 dark:bg-primary-500/10 flex items-center justify-center text-xs font-bold text-primary-600 dark:text-primary-400 flex-shrink-0">
                                      {(row.name ?? '?').charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-semibold text-slate-800 dark:text-white">{row.name}</span>
                                  </div>
                                </td>
                                <td className="py-3 px-4 text-xs font-mono text-slate-400 hidden sm:table-cell">{row.rollNumber ?? '—'}</td>
                              </>
                            )}
                            <td className="py-3 px-4 text-sm text-center text-slate-600 dark:text-slate-300 font-medium">{row.totalDays ?? 0}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-emerald-600 dark:text-emerald-400">{row.presentDays ?? 0}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-violet-600 dark:text-violet-400">{row.leaveDays ?? 0}</td>
                            <td className="py-3 px-4 text-sm text-center font-bold text-rose-600 dark:text-rose-400">{absent}</td>
                            <td className="py-3 px-4 text-center">
                              <PctBadge pct={row.percentage ?? 0} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>

                    {/* Table footer summary */}
                    {tableRows.length > 1 && stats && (
                      <tfoot>
                        <tr className="bg-slate-50 dark:bg-slate-800/40 border-t-2 border-slate-200 dark:border-slate-700 font-bold text-sm">
                          <td colSpan={reportType === 'student' ? 2 : 3} className="py-3 px-4 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wide">
                            Total / Average
                          </td>
                          {reportType === 'fees' ? (
                            <>
                              <td className="py-3 px-4 text-center text-slate-800 dark:text-white">₹{stats.total.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center text-emerald-600">₹{stats.paid.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center text-rose-600">₹{stats.pending.toLocaleString()}</td>
                              <td className="py-3 px-4 text-center text-slate-400">—</td>
                              <td className="py-3 px-4 text-center font-bold text-slate-800 dark:text-white">{stats.pct}%</td>
                            </>
                          ) : (
                            <>
                              <td className="py-3 px-4 text-center text-slate-800 dark:text-white">{stats.total}</td>
                              <td className="py-3 px-4 text-center text-emerald-600 dark:text-emerald-400">{stats.present}</td>
                              <td className="py-3 px-4 text-center text-violet-600 dark:text-violet-400">{stats.leave}</td>
                              <td className="py-3 px-4 text-center text-rose-600 dark:text-rose-400">{stats.absent}</td>
                              <td className="py-3 px-4 text-center"><PctBadge pct={stats.pct} /></td>
                            </>
                          )}
                        </tr>
                      </tfoot>
                    )}
                  </table>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Reports;
