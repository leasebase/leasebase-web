"use client";

import Link from "next/link";
import { DataTable, type Column, type FilterConfig } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { LeaseRow, LeaseTenantRow } from "@/services/leases/types";
import { TERM_TYPE_LABELS } from "@/services/leases/types";

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "EXTENDED": return "success";
    case "DRAFT":
    case "ASSIGNED":
    case "INVITED":
    case "ACKNOWLEDGED": return "warning";
    case "INACTIVE": return "danger";
    case "EXPIRED":
    case "RENEWED": return "neutral";
    default: return "neutral";
  }
}

/** Format tenant name as "F.LastName". For multiple tenants, comma-separate. */
function formatTenantNames(tenants?: LeaseTenantRow[]): string {
  if (!tenants || tenants.length === 0) return "Not assigned";
  return tenants
    .map((t) => {
      const parts = t.name.trim().split(/\s+/);
      if (parts.length < 2) return t.name;
      return `${parts[0][0]}.${parts[parts.length - 1]}`;
    })
    .join(", ");
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
    key: "tenants",
    header: "Tenants",
    render: (row) => (
      <span className="text-slate-600">
        {formatTenantNames(row.tenants)}
      </span>
    ),
  },
  {
    key: "term_type",
    header: "Term",
    render: (row) => (
      <span className="text-slate-600 text-xs">
        {TERM_TYPE_LABELS[row.term_type] ?? row.term_type}
      </span>
    ),
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
    { label: "Assigned", value: "ASSIGNED" },
    { label: "Invited", value: "INVITED" },
    { label: "Acknowledged", value: "ACKNOWLEDGED" },
    { label: "Active", value: "ACTIVE" },
    { label: "Expired", value: "EXPIRED" },
    { label: "Extended", value: "EXTENDED" },
    { label: "Renewed", value: "RENEWED" },
    { label: "Inactive", value: "INACTIVE" },
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
      searchKeys={["property_name", "unit_number"]}
      filters={[statusFilter]}
      pageSize={20}
    />
  );
}
