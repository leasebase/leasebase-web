"use client";

import { useState, type ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T, index: number) => string;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  pageSize?: number;
  className?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  getRowId,
  loading = false,
  error,
  emptyMessage = "No data available",
  pageSize = 10,
  className = "",
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const totalPages = Math.max(1, Math.ceil(rows.length / pageSize));
  const paginatedRows = rows.slice(page * pageSize, (page + 1) * pageSize);
  const showPagination = rows.length > pageSize;

  if (loading) {
    return (
      <div className={`rounded-lg border border-slate-800 overflow-hidden ${className}`}>
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 3 }).map((_, i) => (
              <tr key={i} className="border-b border-slate-800/50">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 w-24 rounded bg-slate-800 animate-pulse" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-lg border border-red-800/40 bg-red-950/20 p-6 text-center text-sm text-red-300 ${className}`} role="alert">
        {error}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-800 p-8 text-center text-sm text-slate-400 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border border-slate-800 overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.map((row, i) => (
              <tr key={getRowId(row, page * pageSize + i)} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-slate-200">
                    {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
          <span>
            {page * pageSize + 1}–{Math.min((page + 1) * pageSize, rows.length)} of {rows.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Previous page"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              disabled={page >= totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="rounded px-2 py-1 hover:bg-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Next page"
            >
              Next ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
