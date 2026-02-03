"use client";

import type { ReactNode } from "react";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T, index: number) => string;
  emptyMessage?: string;
}

export function DataTable<T>({ columns, rows, getRowId, emptyMessage }: DataTableProps<T>) {
  if (!rows.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center text-sm text-slate-400">
        {emptyMessage || "No data yet."}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/40">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-slate-900/80">
          <tr>
            {columns.map(col => (
              <th
                key={col.key}
                className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={getRowId(row, idx)} className="border-t border-slate-800">
              {columns.map(col => (
                <td key={col.key} className="px-3 py-2 text-xs text-slate-100">
                  {col.render ? col.render(row) : (row as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
