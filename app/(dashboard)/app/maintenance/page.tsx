"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Select } from "@/components/ui/Select";
import {
  Wrench,
  Plus,
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchTenantMaintenance } from "@/services/tenant/adapters/maintenanceAdapter";
import type { WorkOrderRow } from "@/services/tenant/types";
import {
  fetchMaintenanceList,
  type MaintenanceWorkOrder,
  type MaintenanceListFilters,
} from "@/services/maintenance/maintenanceApiService";
import { OwnerMaintenancePage } from "./_owner-list";

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

const STATUS_BADGE_CLASSES: Record<string, string> = {
  SUBMITTED: "bg-amber-100 text-amber-700",
  IN_REVIEW: "bg-blue-100 text-blue-700",
  SCHEDULED: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  COMPLETED: "bg-green-100 text-green-700",
  CLOSED: "bg-slate-100 text-slate-600",
  CANCELLED: "bg-slate-100 text-slate-600",
};

const PRIORITY_VARIANTS: Record<string, "danger" | "warning" | "neutral"> = {
  URGENT: "danger",
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

const PRIORITY_BADGE_CLASSES: Record<string, string> = {
  URGENT: "bg-red-50 text-red-700 ring-1 ring-red-200",
  HIGH: "bg-red-50 text-red-700 ring-1 ring-red-200",
  MEDIUM: "bg-amber-50 text-amber-700 ring-1 ring-amber-200",
  LOW: "bg-slate-50 text-slate-700 ring-1 ring-slate-200",
};

type FilterKey = "all" | "open" | "in-progress" | "completed";

const OPEN_STATUSES = ["SUBMITTED", "IN_REVIEW"];
const PROGRESS_STATUSES = ["SCHEDULED", "IN_PROGRESS"];
const COMPLETED_STATUSES = ["COMPLETED", "CLOSED"];

function matchesFilter(wo: WorkOrderRow, filter: FilterKey): boolean {
  if (filter === "all") return true;
  if (filter === "open") return OPEN_STATUSES.includes(wo.status);
  if (filter === "in-progress") return PROGRESS_STATUSES.includes(wo.status);
  if (filter === "completed") return COMPLETED_STATUSES.includes(wo.status);
  return true;
}

/* ═══════════════════════════════════════════════════════════════════════
   Page — persona router
   ═══════════════════════════════════════════════════════════════════════ */

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "tenant") return <TenantMaintenancePage />;
  if (user?.persona === "owner") return <OwnerMaintenancePage />;
  return (
    <>
      <PageHeader title="Maintenance" description="Track maintenance requests, work orders, and vendor assignments." />
      <EmptyState
        icon={<Wrench size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="Maintenance management is under development."
        className="mt-8"
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   Tenant — UIUX-styled maintenance page
   ═══════════════════════════════════════════════════════════════════════ */

function TenantMaintenancePage() {
  const [requests, setRequests] = useState<WorkOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchTenantMaintenance();
        if (!cancelled) {
          setRequests(result.data);
          if (result.source === "unavailable") setError(result.error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const openCount = requests.filter((r) => OPEN_STATUSES.includes(r.status)).length;
  const inProgressCount = requests.filter((r) => PROGRESS_STATUSES.includes(r.status)).length;
  const completedCount = requests.filter((r) => COMPLETED_STATUSES.includes(r.status)).length;
  const filtered = requests.filter((r) => matchesFilter(r, filter));
  const selectedRequest = selectedId ? requests.find((r) => r.id === selectedId) : null;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between"><div><Skeleton variant="text" className="h-7 w-52" /><Skeleton variant="text" className="mt-2 h-4 w-80" /></div><Skeleton variant="rectangular" className="h-11 w-40 rounded-xl" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">{[0,1,2].map(i=><div key={i} className="bg-white rounded-xl border border-slate-200 p-4"><Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" /><Skeleton variant="text" className="mt-2 h-4 w-24" /></div>)}</div>
        <div className="space-y-3">{[0,1,2].map(i=><Skeleton key={i} variant="rectangular" className="h-28 w-full rounded-xl" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Maintenance Requests</h1>
            <p className="text-[14px] text-slate-600">Submit and track maintenance requests for your unit</p>
          </div>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Maintenance Requests</h1>
          <p className="text-[14px] text-slate-600">Submit and track maintenance requests for your unit</p>
        </div>
        <Link
          href="/app/maintenance/new"
          className="flex items-center gap-2 h-11 px-5 bg-gradient-to-r from-green-600 to-green-700 text-white text-[14px] font-semibold rounded-xl hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/30 hover:shadow-xl hover:shadow-green-600/40 transition-all"
        >
          <Plus className="w-5 h-5" strokeWidth={2.5} />
          Submit Request
        </Link>
      </div>

      {/* ── Status Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-amber-50 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-600" strokeWidth={2.5} />
            </div>
            <p className="text-[24px] font-bold text-slate-900">{openCount}</p>
          </div>
          <p className="text-[13px] text-slate-600 font-medium">Open Requests</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-blue-600" strokeWidth={2.5} />
            </div>
            <p className="text-[24px] font-bold text-slate-900">{inProgressCount}</p>
          </div>
          <p className="text-[13px] text-slate-600 font-medium">In Progress</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" strokeWidth={2.5} />
            </div>
            <p className="text-[24px] font-bold text-slate-900">{completedCount}</p>
          </div>
          <p className="text-[13px] text-slate-600 font-medium">Completed</p>
        </div>
      </div>

      {/* ── Main Grid: Request List + Detail Panel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Requests List (2/3) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter Tabs */}
          <div className="bg-white rounded-xl border border-slate-200 p-1 shadow-sm flex gap-1">
            {(["all", "open", "in-progress", "completed"] as FilterKey[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`flex-1 h-9 rounded-lg text-[13px] font-semibold transition-all ${
                  filter === tab
                    ? "bg-gradient-to-r from-green-50 to-green-50/50 text-green-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {tab === "all" ? "All" : tab === "in-progress" ? "In Progress" : tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Request Cards */}
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((wo) => (
                <div
                  key={wo.id}
                  onClick={() => setSelectedId(wo.id)}
                  className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all ${
                    selectedId === wo.id
                      ? "border-green-300 shadow-lg shadow-green-100/50"
                      : "border-slate-200 hover:border-slate-300 shadow-sm hover:shadow-md"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-slate-900 mb-1">
                        {wo.title || wo.description}
                      </h3>
                      {wo.title && (
                        <p className="text-[13px] text-slate-600 mb-2 line-clamp-2">{wo.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 text-[12px]">
                        <span className={`px-2 py-0.5 rounded-md font-bold uppercase tracking-wide ${
                          STATUS_BADGE_CLASSES[wo.status] ?? "bg-slate-100 text-slate-600"
                        }`}>
                          {STATUS_LABELS[wo.status] ?? wo.status}
                        </span>
                        <span className={`px-2 py-0.5 rounded-md font-semibold ${
                          PRIORITY_BADGE_CLASSES[wo.priority] ?? "bg-slate-50 text-slate-700 ring-1 ring-slate-200"
                        }`}>
                          {wo.priority} Priority
                        </span>
                        <span className="text-slate-500">&bull;</span>
                        <span className="text-slate-600">{wo.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {OPEN_STATUSES.includes(wo.status) && (
                        <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                      )}
                      {PROGRESS_STATUSES.includes(wo.status) && (
                        <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500">
                    <span>Submitted {new Date(wo.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                    {selectedId === wo.id && (
                      <Link
                        href={`/app/maintenance/${wo.id}`}
                        className="text-green-600 font-semibold flex items-center gap-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[14px] text-slate-600 mb-4">No maintenance requests yet</p>
              <Link
                href="/app/maintenance/new"
                className="inline-flex items-center gap-2 h-10 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
              >
                <Plus className="w-4 h-4" /> Submit Request
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <Wrench className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[14px] text-slate-600">No requests found for this filter</p>
            </div>
          )}
        </div>

        {/* Detail Panel (1/3) */}
        <div className="lg:col-span-1">
          {selectedRequest ? (
            <div className="bg-white rounded-xl border border-slate-200 shadow-md overflow-hidden sticky top-20">
              <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
                <h3 className="text-[15px] font-semibold text-slate-900 mb-1">Request Details</h3>
                <p className="text-[12px] text-slate-600">{selectedRequest.request_number ?? `#${selectedRequest.id.slice(0, 8)}`}</p>
              </div>
              <div className="p-5 space-y-4">
                {/* Status */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-2">Status</p>
                  <span className={`inline-block px-3 py-1.5 rounded-lg text-[12px] font-bold uppercase ${
                    STATUS_BADGE_CLASSES[selectedRequest.status] ?? "bg-slate-100 text-slate-600"
                  }`}>
                    {STATUS_LABELS[selectedRequest.status] ?? selectedRequest.status}
                  </span>
                </div>

                {/* Priority & Category */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Priority</p>
                    <p className="text-[13px] font-semibold text-slate-900">{selectedRequest.priority}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Category</p>
                    <p className="text-[13px] font-semibold text-slate-900">{selectedRequest.category}</p>
                  </div>
                </div>

                {/* Assigned To */}
                {selectedRequest.assignee_name && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Assigned To</p>
                    <p className="text-[13px] font-semibold text-slate-900">{selectedRequest.assignee_name}</p>
                  </div>
                )}

                {/* Description */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</p>
                  <p className="text-[13px] text-slate-700">{selectedRequest.description}</p>
                </div>

                {/* Dates */}
                <div>
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Submitted</p>
                  <p className="text-[13px] text-slate-700">
                    {new Date(selectedRequest.created_at).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </p>
                </div>

                {selectedRequest.scheduled_date && (
                  <div>
                    <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Scheduled</p>
                    <p className="text-[13px] text-slate-700">
                      {new Date(selectedRequest.scheduled_date).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                )}

                {/* View Full Details link */}
                <Link
                  href={`/app/maintenance/${selectedRequest.id}`}
                  className="flex items-center justify-center gap-2 w-full h-10 bg-white text-slate-700 text-[13px] font-semibold rounded-xl border-2 border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all"
                >
                  View Full Details <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[13px] text-slate-600">Select a request to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

