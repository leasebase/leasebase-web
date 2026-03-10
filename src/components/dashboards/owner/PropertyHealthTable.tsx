"use client";

import Link from "next/link";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/Badge";
import { ProgressBar } from "@/components/ui/ProgressBar";
import type { PropertyHealthRow, PropertyHealthViewModel } from "@/services/dashboard/types";

interface PropertyHealthTableProps {
  vm: PropertyHealthViewModel;
}

function fmtCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const statusVariant: Record<PropertyHealthRow["status"], "success" | "warning" | "danger"> = {
  healthy: "success",
  attention: "warning",
  critical: "danger",
};

const columns: Column<PropertyHealthRow>[] = [
  {
    key: "name",
    header: "Property",
    sortable: true,
    render: (row) => (
      <Link href={`/app/properties/${row.id}`} className="font-medium text-slate-700 hover:text-brand-600">
        {row.name}
      </Link>
    ),
  },
  {
    key: "totalUnits",
    header: "Units",
    sortable: true,
  },
  {
    key: "occupancy",
    header: "Occupancy",
    sortable: true,
    render: (row) => (
      <ProgressBar
        value={row.occupancy}
        showValue
        variant={row.occupancy >= 90 ? "success" : row.occupancy >= 70 ? "warning" : "danger"}
        className="min-w-[100px]"
      />
    ),
  },
  {
    key: "collectedCents",
    header: "Collected",
    sortable: true,
    render: (row) => fmtCurrency(row.collectedCents),
  },
  {
    key: "billedCents",
    header: "Billed",
    sortable: true,
    render: (row) => fmtCurrency(row.billedCents),
  },
  {
    key: "overdueCents",
    header: "Overdue",
    sortable: true,
    render: (row) => (
      <span className={row.overdueCents > 0 ? "font-medium text-red-600" : "text-slate-500"}>
        {fmtCurrency(row.overdueCents)}
      </span>
    ),
  },
  {
    key: "openMaintenance",
    header: "Open Maint.",
    sortable: true,
    render: (row) => (
      <span className={row.openMaintenance > 0 ? "font-medium text-amber-600" : "text-slate-500"}>
        {row.openMaintenance}
      </span>
    ),
  },
  {
    key: "expiringLeases",
    header: "Expiring (60d)",
    sortable: true,
    render: (row) => (
      <span className={row.expiringLeases > 0 ? "font-medium text-amber-600" : "text-slate-500"}>
        {row.expiringLeases}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    sortable: true,
    render: (row) => (
      <Badge variant={statusVariant[row.status]}>
        {row.status.charAt(0).toUpperCase() + row.status.slice(1)}
      </Badge>
    ),
  },
];

const statusFilter = {
  key: "status",
  label: "Status",
  options: [
    { label: "Healthy", value: "healthy" },
    { label: "Attention", value: "attention" },
    { label: "Critical", value: "critical" },
  ],
};

export function PropertyHealthTable({ vm }: PropertyHealthTableProps) {
  if (!vm.hasData) return null;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-900">Property Health</h2>
        <Link href="/app/properties" className="text-xs font-medium text-brand-600 hover:text-brand-700">
          View all properties →
        </Link>
      </div>
      <DataTable<PropertyHealthRow>
        columns={columns}
        rows={vm.rows}
        getRowId={(row) => row.id}
        searchable
        searchPlaceholder="Search properties…"
        searchKeys={["name"]}
        filters={[statusFilter]}
        pageSize={10}
        stickyHeader
      />
    </div>
  );
}
