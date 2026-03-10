"use client";

import Link from "next/link";
import { DataTable, type Column, type FilterConfig } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { LeaseRow } from "@/services/leases/types";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE": return "success";
    case "PENDING": return "warning";
    case "TERMINATED": return "danger";
    default: return "neutral";
  }
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

const columns: Column<LeaseRow>[] = [
  {
    key: "property_name",
    header: "Property",
    sortable: true,
    render: (row) => (
      <Link
        href={`/app/properties/${row.property_id}`}
        className="font-medium text-brand-600 hover:underline"
      >
        {row.property_name ?? row.property_id.slice(0, 8)}
      </Link>
    ),
  },
  {
    key: "unit_number",
    header: "Unit",
    render: (row) => (
      <span className="text-slate-600">
        {row.unit_number ? `Unit ${row.unit_number}` : row.unit_id.slice(0, 8)}
      </span>
    ),
  },
  {
    key: "tenant_id",
    header: "Tenant",
    render: (row) => (
      <span className="text-slate-600">
        {row.tenant_id || "Not assigned"}
      </span>
    ),
  },
  {
    key: "monthly_rent",
    header: "Rent",
    sortable: true,
    render: (row) => <span>{formatCurrency(row.monthly_rent)}/mo</span>,
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={statusVariant(row.status)}>{row.status}</Badge>
    ),
  },
  {
    key: "dates",
    header: "Dates",
    render: (row) => (
      <span className="text-xs text-slate-500">
        {formatDate(row.start_date)} – {formatDate(row.end_date)}
      </span>
    ),
  },
  {
    key: "actions",
    header: "",
    render: (row) => (
      <Link
        href={`/app/leases/${row.id}`}
        className="text-sm text-brand-600 hover:underline"
      >
        View
      </Link>
    ),
  },
];

const statusFilter: FilterConfig = {
  key: "status",
  label: "Status",
  options: [
    { label: "Draft", value: "DRAFT" },
    { label: "Pending", value: "PENDING" },
    { label: "Active", value: "ACTIVE" },
    { label: "Terminated", value: "TERMINATED" },
    { label: "Expired", value: "EXPIRED" },
  ],
};

interface LeasesTableProps {
  leases: LeaseRow[];
  loading?: boolean;
  error?: string;
}

export function LeasesTable({ leases, loading, error }: LeasesTableProps) {
  return (
    <DataTable<LeaseRow & Record<string, any>>
      columns={columns}
      rows={leases}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      emptyMessage="No leases found"
      searchable
      searchPlaceholder="Search leases…"
      searchKeys={["property_name", "unit_number", "tenant_id"]}
      filters={[statusFilter]}
      pageSize={20}
    />
  );
}
