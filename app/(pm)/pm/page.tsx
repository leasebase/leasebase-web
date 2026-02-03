"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { usePmDashboard } from "@/lib/api/hooks";

export default function PmDashboardPage() {
  const { data, loading, error } = usePmDashboard();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Management dashboard"
        description="Overview of occupancy, delinquency, and maintenance for your portfolio."
      />

      {loading && <p className="text-sm text-slate-300">Loading dashboard…</p>}
      {error && (
        <p className="text-sm text-red-400">Failed to load dashboard: {error.message}</p>
      )}

      {data && (
        <>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <StatCard
              label="Occupancy"
              value={`${Math.round(data.occupancyRate * 100)}%`}
              hint="Occupied units"
            />
            <StatCard
              label="Delinquent leases"
              value={data.delinquentLeaseCount}
              hint="With outstanding balance"
            />
            <StatCard
              label="Open work orders"
              value={data.openWorkOrderCount}
              hint="Needing attention"
            />
          </div>

          <div className="mt-6">
            <h2 className="mb-2 text-sm font-semibold text-slate-200">Recent activity</h2>
            <DataTable
              columns={[
                { key: "type", header: "Type" },
                { key: "message", header: "Activity" },
                { key: "createdAt", header: "When" }
              ]}
              rows={data.recentActivity}
              getRowId={(row) => row.id}
              emptyMessage="No recent activity yet."
            />
          </div>
        </>
      )}
    </div>
  );
}
