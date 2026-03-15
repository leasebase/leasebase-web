"use client";

import Link from "next/link";
import { Wrench, Plus } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { MiniBarChart, CHART_COLORS } from "@/components/dashboards/charts";
import type { TenantMaintenanceWidgetViewModel } from "@/services/tenant/types";

const provenanceLabel: Record<string, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

interface TenantMaintenanceWidgetProps {
  vm: TenantMaintenanceWidgetViewModel;
}

export function TenantMaintenanceWidget({ vm }: TenantMaintenanceWidgetProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <Wrench size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Maintenance</h2>
        </div>
        {vm.source !== "live" && (
          <Badge variant="neutral">{provenanceLabel[vm.source]}</Badge>
        )}
      </div>

      <div className="px-4 py-4">
        {vm.source === "stub" ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">
              Maintenance request history is not yet available for tenants.
              A tenant-scoped list endpoint is required before this data can be
              shown securely.
            </p>
            <Link
              href="/app/maintenance/new"
              className="inline-flex items-center gap-2 rounded-md border border-slate-600 bg-slate-800 px-3 py-2 text-sm font-medium text-slate-100 transition-colors hover:bg-slate-700"
            >
              <Plus size={14} />
              Submit new request
            </Link>
          </div>
        ) : vm.recentRequests.length > 0 ? (
          <>
            {/* Status breakdown mini chart */}
            {vm.recentRequests.length >= 2 && (() => {
              const statusCounts: Record<string, number> = {};
              for (const r of vm.recentRequests) {
                statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
              }
              const items = Object.entries(statusCounts).map(([status, count]) => ({
                label: status,
                value: count,
                color:
                  status === "Completed" || status === "Closed" ? CHART_COLORS.success :
                  status === "In Progress" || status === "Scheduled" ? CHART_COLORS.brand :
                  status === "Submitted" || status === "In Review" ? CHART_COLORS.warning :
                  CHART_COLORS.info,
              }));
              return <MiniBarChart items={items} height={40} />;
            })()}

            {vm.openCount > 0 && (
              <p className="mb-2 text-xs text-slate-400">
                {vm.openCount} open request{vm.openCount !== 1 ? "s" : ""}
              </p>
            )}
            <ul className="divide-y divide-slate-800/50 text-sm">
              {vm.recentRequests.map((r) => (
                <li key={r.id} className="flex items-center justify-between py-2">
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-200 truncate block">
                      {r.description}
                    </span>
                    <span className="text-xs text-slate-400">
                      {r.category} · {r.date}
                    </span>
                  </div>
                  <Badge variant={r.statusVariant}>{r.status}</Badge>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-xs text-slate-400">No maintenance requests.</p>
        )}
      </div>
    </div>
  );
}
