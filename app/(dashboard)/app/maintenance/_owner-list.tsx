"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { Wrench, Search, AlertTriangle, Clock } from "lucide-react";
import {
  fetchMaintenanceList,
  fetchMaintenanceStats,
  type MaintenanceWorkOrder,
  type MaintenanceListFilters,
  type MaintenanceStats,
} from "@/services/maintenance/maintenanceApiService";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  SUBMITTED: "warning",
  IN_REVIEW: "info",
  SCHEDULED: "info",
  IN_PROGRESS: "info",
  COMPLETED: "success",
  CLOSED: "neutral",
  CANCELLED: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  IN_REVIEW: "In Review",
  SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress",
  COMPLETED: "Completed",
  CLOSED: "Closed",
  CANCELLED: "Cancelled",
};

const PRIORITY_VARIANTS: Record<string, "danger" | "warning" | "neutral"> = {
  URGENT: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

/** Priority sort weight — higher = more urgent. */
const PRIORITY_WEIGHT: Record<string, number> = { URGENT: 40, HIGH: 30, MEDIUM: 20, LOW: 10 };
const STATUS_WEIGHT: Record<string, number> = {
  IN_REVIEW: 50, SUBMITTED: 45, IN_PROGRESS: 40, SCHEDULED: 30, COMPLETED: 10, CLOSED: 5, CANCELLED: 1,
};

/** "Needs attention" = SUBMITTED with no assignee for 3+ days. */
function needsAttention(wo: MaintenanceWorkOrder): boolean {
  if (wo.status !== "SUBMITTED" || wo.assignee_id) return false;
  const age = Date.now() - new Date(wo.created_at).getTime();
  return age > 3 * 24 * 60 * 60 * 1000;
}

export function OwnerMaintenancePage() {
  const [items, setItems] = useState<MaintenanceWorkOrder[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<MaintenanceStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const loadData = useCallback(async (filters: MaintenanceListFilters) => {
    setIsLoading(true);
    setError(null);
    try {
      const [res, statsRes] = await Promise.all([
        fetchMaintenanceList(filters),
        fetchMaintenanceStats(),
      ]);
      setItems(res.data);
      setTotal(res.meta.total);
      setStats(statsRes.data);
    } catch (e: any) {
      setError(e?.message || "Failed to fetch work orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const filters: MaintenanceListFilters = {};
    if (statusFilter) filters.status = statusFilter;
    if (priorityFilter) filters.priority = priorityFilter;
    if (searchQuery) filters.search = searchQuery;
    loadData(filters);
  }, [statusFilter, priorityFilter, searchQuery, loadData]);

  /** Smart-sorted: urgent/high first, then by status weight. */
  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      const pw = (PRIORITY_WEIGHT[b.priority] || 0) - (PRIORITY_WEIGHT[a.priority] || 0);
      if (pw !== 0) return pw;
      return (STATUS_WEIGHT[b.status] || 0) - (STATUS_WEIGHT[a.status] || 0);
    });
  }, [items]);

  const openCount = stats ? (stats.submitted || 0) + (stats.in_review || 0) + (stats.scheduled || 0) + (stats.in_progress || 0) : 0;
  const attentionCount = items.filter(needsAttention).length;

  function handleSearchSubmit() {
    setSearchQuery(searchInput.trim());
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        description="Track maintenance requests, work orders, and vendor assignments."
      />

      {/* Filter bar */}
      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="w-40">
          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CLOSED">Closed</option>
            <option value="CANCELLED">Cancelled</option>
          </Select>
        </div>
        <div className="w-40">
          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            aria-label="Filter by priority"
          >
            <option value="">All priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-slate-700 mb-1">Search</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
              placeholder="Search descriptions…"
              aria-label="Search work orders"
              className="flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button variant="secondary" size="sm" icon={<Search size={14} />} onClick={handleSearchSubmit}>
              Search
            </Button>
          </div>
        </div>
      </div>

      {/* Summary counters */}
      {!isLoading && stats && (
        <div className="mt-4 flex gap-3">
          <div className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
            <Wrench size={14} className="text-slate-400" />
            <span className="text-sm font-semibold text-slate-900">{openCount}</span>
            <span className="text-xs text-slate-500">Open</span>
          </div>
          {attentionCount > 0 && (
            <div className="flex items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2">
              <AlertTriangle size={14} className="text-amber-500" />
              <span className="text-sm font-semibold text-amber-700">{attentionCount}</span>
              <span className="text-xs text-amber-600">Needs attention</span>
            </div>
          )}
        </div>
      )}

      {/* Results */}
      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2" aria-label="Loading work orders">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : error ? (
          <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Wrench size={48} strokeWidth={1.5} />}
            title="No work orders"
            description={statusFilter || priorityFilter || searchQuery
              ? "No work orders match the current filters."
              : "No maintenance requests have been submitted yet."}
            className="mt-4"
          />
        ) : (
          <>
            <p className="text-xs text-slate-500 mb-3">{total} work order{total !== 1 ? "s" : ""}</p>
            <div className="space-y-3">
              {sortedItems.map((wo) => {
                const isUrgent = wo.priority === "URGENT" || wo.priority === "HIGH";
                const attn = needsAttention(wo);
                return (
                  <Link key={wo.id} href={`/app/maintenance/${wo.id}`}
                    className={`block rounded-lg border p-4 transition-colors hover:border-slate-300 ${
                      isUrgent ? "border-red-200 bg-red-50/30" : attn ? "border-amber-200 bg-amber-50/20" : "border-slate-200 bg-white"
                    }`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-slate-900 truncate">{wo.title || wo.description}</p>
                          {attn && <span title="Needs attention"><Clock size={12} className="shrink-0 text-amber-500" /></span>}
                        </div>
                        {wo.title && <p className="text-xs text-slate-600 truncate mt-0.5">{wo.description}</p>}
                        <p className="mt-1 text-xs text-slate-400">
                          {wo.request_number ? `${wo.request_number} · ` : ""}{wo.category}
                          {" "}· {new Date(wo.created_at).toLocaleDateString()}
                          {wo.assignee_name && <span className="ml-2">· Assigned: {wo.assignee_name}</span>}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Badge variant={PRIORITY_VARIANTS[wo.priority] || "neutral"}>{wo.priority}</Badge>
                        <Badge variant={STATUS_VARIANTS[wo.status] || "neutral"}>{STATUS_LABELS[wo.status] || wo.status}</Badge>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}
