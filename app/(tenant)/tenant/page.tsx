"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { DataTable } from "@/components/ui/DataTable";
import { useTenantDashboard, useTenantWorkOrders } from "@/lib/api/hooks";

export default function TenantDashboardPage() {
  const { data, loading, error } = useTenantDashboard();
  const workOrders = useTenantWorkOrders();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenant dashboard"
        description="View your balance, next due date, and open maintenance requests."
      />

      {loading && <p className="text-sm text-slate-300">Loading dashboard…</p>}
      {error && (
        <p className="text-sm text-red-400">Failed to load dashboard: {error.message}</p>
      )}

      {data && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <StatCard
            label="Balance due"
            value={`$${data.balanceDue.toFixed(2)}`}
            hint={data.nextDueDate ? `Next due: ${data.nextDueDate}` : "No upcoming due date"}
          />
          <StatCard
            label="Open work orders"
            value={data.openWorkOrderCount}
            hint="Requests in progress"
          />
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-slate-200">Open maintenance</h2>
        {workOrders.loading && (
          <p className="text-sm text-slate-300">Loading work orders…</p>
        )}
        {workOrders.error && (
          <p className="text-sm text-red-400">
            Failed to load work orders: {workOrders.error.message}
          </p>
        )}
        {workOrders.data && (
          <DataTable
            columns={[
              { key: "title", header: "Title" },
              { key: "status", header: "Status" },
              { key: "createdAt", header: "Created" }
            ]}
            rows={workOrders.data}
            getRowId={(row) => row.id}
            emptyMessage="No open maintenance requests."
          />
        )}
      </div>
    </div>
  );
}
