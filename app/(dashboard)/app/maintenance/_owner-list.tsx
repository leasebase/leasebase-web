"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import { Wrench, Search } from "lucide-react";
import {
  fetchMaintenanceList,
  type MaintenanceWorkOrder,
  type MaintenanceListFilters,
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

export function OwnerMaintenancePage() {
  const [items, setItems] = useState<MaintenanceWorkOrder[]>([]);
  const [total, setTotal] = useState(0);
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
      const res = await fetchMaintenanceList(filters);
      setItems(res.data);
      setTotal(res.meta.total);
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
              {items.map((wo) => (
                <Link key={wo.id} href={`/app/maintenance/${wo.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-900 truncate">{wo.title || wo.description}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        {wo.request_number ? `${wo.request_number} · ` : ""}{wo.category}
                        {" "}· {new Date(wo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Badge variant={PRIORITY_VARIANTS[wo.priority] || "neutral"}>{wo.priority}</Badge>
                      <Badge variant={STATUS_VARIANTS[wo.status] || "neutral"}>{STATUS_LABELS[wo.status] || wo.status}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
