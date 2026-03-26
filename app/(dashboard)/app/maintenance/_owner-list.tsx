"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { Wrench, Search, AlertTriangle, Clock, CheckCircle, Plus, Filter } from "lucide-react";
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
  const inProgressCount = stats?.in_progress || 0;
  const urgentCount = items.filter((wo) => wo.priority === "URGENT" || wo.priority === "HIGH").length;
  const completedCount = stats?.completed || 0;
  const attentionCount = items.filter(needsAttention).length;

  /** UIUX gradient for priority icon container */
  const priorityGradient: Record<string, string> = {
    URGENT: "bg-gradient-to-br from-red-500 to-red-600",
    HIGH: "bg-gradient-to-br from-red-500 to-red-600",
    MEDIUM: "bg-gradient-to-br from-amber-500 to-amber-600",
    LOW: "bg-gradient-to-br from-blue-500 to-blue-600",
  };

  function handleSearchSubmit() {
    setSearchQuery(searchInput.trim());
  }

  return (
    <>
      <PageHeader
        title="Maintenance"
        description={`${openCount} open requests \u00b7 ${urgentCount} high priority`}
        actions={
          <Link href="/app/maintenance/new">
            <Button variant="primary" icon={<Plus size={16} />}>Create Work Order</Button>
          </Link>
        }
      />

      {/* Summary Cards — UIUX style */}
      {!isLoading && stats && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-medium text-slate-600">Open Requests</h3>
              <Wrench className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{openCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-medium text-slate-600">In Progress</h3>
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{inProgressCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-medium text-slate-600">High Priority</h3>
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{urgentCount}</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-[13px] font-medium text-slate-600">Completed</h3>
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-3xl font-semibold text-slate-900 tracking-tight">{completedCount}</p>
          </div>
        </div>
      )}

      {/* High Priority Alert — UIUX style */}
      {!isLoading && urgentCount > 0 && (
        <div className="mt-6 bg-gradient-to-r from-red-50 to-red-50/50 border border-red-200/80 rounded-xl p-5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-600" strokeWidth={2.5} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-[15px] font-semibold text-red-900">High Priority Maintenance Issues</h3>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[11px] font-medium rounded-md">
                  {urgentCount} urgent
                </span>
              </div>
              <p className="text-[13px] text-red-800">
                {urgentCount} high-priority work order{urgentCount !== 1 ? "s" : ""} require{urgentCount === 1 ? "s" : ""} immediate attention.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Filters — UIUX style */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="SUBMITTED">Submitted</option>
          <option value="IN_REVIEW">In Review</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="COMPLETED">Completed</option>
          <option value="CLOSED">Closed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
        <select
          value={priorityFilter}
          onChange={(e) => setPriorityFilter(e.target.value)}
          className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
        >
          <option value="">All Priorities</option>
          <option value="URGENT">Urgent</option>
          <option value="HIGH">High</option>
          <option value="MEDIUM">Medium</option>
          <option value="LOW">Low</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            placeholder="Search work orders…"
            className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
          />
        </div>
      </div>

      {/* Work Order List — UIUX card style */}
      <div className="mt-6">
        {isLoading ? (
          <div className="space-y-3" aria-label="Loading work orders">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="flex-1"><div className="h-3 w-48 rounded bg-slate-200" /><div className="mt-2 h-2 w-32 rounded bg-slate-200" /></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : items.length === 0 ? (
          <EmptyState
            icon={<Wrench size={48} strokeWidth={1.5} />}
            title="No work orders"
            description={statusFilter || priorityFilter || searchQuery
              ? "No work orders match the current filters."
              : "No maintenance requests have been submitted yet."}
          />
        ) : (
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
            <div className="divide-y divide-slate-100">
              {sortedItems.map((wo) => {
                const isUrgent = wo.priority === "URGENT" || wo.priority === "HIGH";
                const attn = needsAttention(wo);
                return (
                  <Link key={wo.id} href={`/app/maintenance/${wo.id}`}
                    className="block p-6 hover:bg-slate-50 transition-colors group">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm ${priorityGradient[wo.priority] || "bg-gradient-to-br from-slate-400 to-slate-500"}`}>
                        <Wrench className="w-5 h-5 text-white" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="text-[14px] font-semibold text-slate-900 mb-1">{wo.title || wo.description}</h3>
                              {attn && <span title="Needs attention" className="flex-shrink-0"><Clock size={14} className="text-amber-500" /></span>}
                            </div>
                            {wo.title && <p className="text-[13px] text-slate-600 mb-2 truncate">{wo.description}</p>}
                            <p className="text-[13px] text-slate-500">
                              {wo.request_number ? `${wo.request_number} \u00b7 ` : ""}{wo.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Badge variant={PRIORITY_VARIANTS[wo.priority] || "neutral"}>{wo.priority}</Badge>
                            <Badge variant={STATUS_VARIANTS[wo.status] || "neutral"}>{STATUS_LABELS[wo.status] || wo.status}</Badge>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-[12px] text-slate-500">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{new Date(wo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                          </div>
                          {wo.assignee_name && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-slate-400">\u00b7</span>
                              <span className="font-medium text-slate-700">{wo.assignee_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
