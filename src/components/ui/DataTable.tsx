"use client";

import { useMemo, useState, type ReactNode } from "react";
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";

/* ── Types ── */

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  /** Enable client-side sorting for this column. Default false. */
  sortable?: boolean;
  /** Custom sort comparator. Receives two cell values. */
  sortFn?: (a: any, b: any) => number;
}

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  /** Column key to filter on. */
  key: string;
  label: string;
  options: FilterOption[];
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
  /** Show a search toolbar above the table. */
  searchable?: boolean;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Column keys to search within. Defaults to all columns. */
  searchKeys?: string[];
  /** Filter dropdowns shown in the toolbar. */
  filters?: FilterConfig[];
  /** Enable sticky header. Default false. */
  stickyHeader?: boolean;
}

type SortDir = "asc" | "desc";
interface SortState { key: string; dir: SortDir }

function defaultCompare(a: any, b: any): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), undefined, { sensitivity: "base" });
}

/* ── Component ── */

export function DataTable<T extends Record<string, any>>({
  columns,
  rows,
  getRowId,
  loading = false,
  error,
  emptyMessage = "No data available",
  pageSize = 10,
  className = "",
  searchable = false,
  searchPlaceholder = "Search…",
  searchKeys,
  filters = [],
  stickyHeader = false,
}: DataTableProps<T>) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortState | null>(null);
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>({});

  // --- Filtering ---
  const filteredRows = useMemo(() => {
    let result = rows;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      const keys = searchKeys ?? columns.map((c) => c.key);
      result = result.filter((row) =>
        keys.some((k) => String(row[k] ?? "").toLowerCase().includes(q)),
      );
    }

    // Dropdown filters
    for (const [key, value] of Object.entries(activeFilters)) {
      if (value) {
        result = result.filter((row) => String(row[key]) === value);
      }
    }

    return result;
  }, [rows, search, searchKeys, columns, activeFilters]);

  // --- Sorting ---
  const sortedRows = useMemo(() => {
    if (!sort) return filteredRows;
    const col = columns.find((c) => c.key === sort.key);
    if (!col) return filteredRows;
    const cmp = col.sortFn ?? defaultCompare;
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...filteredRows].sort((a, b) => dir * cmp(a[sort.key], b[sort.key]));
  }, [filteredRows, sort, columns]);

  // --- Pagination ---
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize));
  // Reset page when filters change and page is out of bounds
  const safePage = page >= totalPages ? 0 : page;
  const paginatedRows = sortedRows.slice(safePage * pageSize, (safePage + 1) * pageSize);
  const showPagination = sortedRows.length > pageSize;

  const toggleSort = (key: string) => {
    setSort((prev) => {
      if (prev?.key === key) {
        return prev.dir === "asc" ? { key, dir: "desc" } : null;
      }
      return { key, dir: "asc" };
    });
    setPage(0);
  };

  const showToolbar = searchable || filters.length > 0;

  /* ── Loading skeleton ── */
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

  /* ── Error ── */
  if (error) {
    return (
      <div className={`rounded-lg border border-red-800/40 bg-red-950/20 p-6 text-center text-sm text-red-300 ${className}`} role="alert">
        {error}
      </div>
    );
  }

  /* ── Empty ── */
  if (rows.length === 0) {
    return (
      <div className={`rounded-lg border border-slate-800 p-8 text-center text-sm text-slate-400 ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  /* ── Sort indicator ── */
  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sort?.key !== colKey) return <ArrowUpDown size={12} className="text-slate-600" />;
    return sort.dir === "asc"
      ? <ArrowUp size={12} className="text-brand-400" />
      : <ArrowDown size={12} className="text-brand-400" />;
  };

  return (
    <div className={`rounded-lg border border-slate-800 overflow-hidden ${className}`}>
      {/* Toolbar */}
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-800 bg-slate-900/30 px-4 py-2.5">
          {searchable && (
            <div className="relative min-w-[180px] flex-1 max-w-xs">
              <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                className="w-full rounded-md border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder={searchPlaceholder}
                aria-label="Table search"
              />
            </div>
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              value={activeFilters[f.key] || ""}
              onChange={(e) => {
                setActiveFilters((prev) => ({ ...prev, [f.key]: e.target.value }));
                setPage(0);
              }}
              className="rounded-md border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label={f.label}
            >
              <option value="">{f.label}: All</option>
              {f.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ))}
        </div>
      )}

      <div className={`overflow-x-auto ${stickyHeader ? "max-h-[70vh] overflow-y-auto" : ""}`}>
        <table className="w-full text-sm" role="table">
          <thead className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <tr className="border-b border-slate-800 bg-slate-900/50">
              {columns.map((col) => {
                const isSortable = col.sortable === true;
                return (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400 ${
                      isSortable ? "cursor-pointer select-none hover:text-slate-200" : ""
                    } ${stickyHeader ? "bg-slate-900" : ""}`}
                    onClick={isSortable ? () => toggleSort(col.key) : undefined}
                    aria-sort={
                      sort?.key === col.key
                        ? sort.dir === "asc" ? "ascending" : "descending"
                        : isSortable ? "none" : undefined
                    }
                  >
                    <span className="inline-flex items-center gap-1.5">
                      {col.header}
                      {isSortable && <SortIcon colKey={col.key} />}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-slate-500">
                  No matching results.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row, i) => (
                <tr key={getRowId(row, safePage * pageSize + i)} className="border-b border-slate-800/50 hover:bg-slate-900/40 transition-colors">
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3 text-slate-200">
                      {col.render ? col.render(row) : (row[col.key] as ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showPagination && (
        <div className="flex items-center justify-between border-t border-slate-800 px-4 py-2 text-xs text-slate-400">
          <span>
            {safePage * pageSize + 1}–{Math.min((safePage + 1) * pageSize, sortedRows.length)} of {sortedRows.length}
          </span>
          <div className="flex gap-1">
            <button
              type="button"
              disabled={safePage === 0}
              onClick={() => setPage((p) => p - 1)}
              className="rounded px-2 py-1 hover:bg-slate-800 disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Previous page"
            >
              ‹ Prev
            </button>
            <button
              type="button"
              disabled={safePage >= totalPages - 1}
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
