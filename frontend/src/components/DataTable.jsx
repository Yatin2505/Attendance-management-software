import { useState } from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  createColumnHelper,
} from '@tanstack/react-table';

const DataTable = ({ columns, data, enableSearch = true, enablePagination = true }) => {
  const [globalFilter, setGlobalFilter] = useState('');

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    globalFilter,
  });

  return (
    <div className="w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-8 pb-6 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h3 className="text-2xl font-bold text-slate-900">Data Table</h3>
          
          {enableSearch && (
            <div className="relative">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full sm:w-80 pl-12 pr-6 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 text-sm"
                placeholder="Search all data..."
                onChange={(e) => setGlobalFilter(e.target.value)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id} className="border-b border-slate-200 bg-slate-50">
                {headerGroup.headers.map(header => (
                  <th key={header.id} className="px-8 py-5 text-left text-sm font-bold text-slate-700 uppercase tracking-wider">
                    {header.isPlaceholder ? null : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-200">
            {table.getRowModel().rows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50/50 transition-colors duration-150">
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="px-8 py-5 text-sm text-slate-600">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {enablePagination && data.length > 10 && (
        <div className="px-8 py-6 border-t border-slate-200 bg-slate-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-slate-500">
              Showing {table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1} to {Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, data.length)} of {data.length} results
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 rounded-xl text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition">
                Previous
              </button>
              <button className="p-2 rounded-xl bg-primary-500 text-white hover:bg-primary-600 transition">
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;

