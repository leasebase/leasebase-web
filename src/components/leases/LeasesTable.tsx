"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { DataTable, type Column, type FilterConfig } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { LeaseRow, LeaseTenantRow } from "@/services/leases/types";
import { TERM_TYPE_LABELS } from "@/services/leases/types";

/* ── Helpers ── */

/** Resolve the owner-facing display status (prefers backend-computed field). */
function displayStatus(row: LeaseRow): string {
  return row.display_status ?? row.status;
}

/** Badge variant keyed on lease-lifecycle display status only. */
function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "EXTENDED":  return "success";
    case "DRAFT":     return "warning";
    case "INACTIVE":  return "danger";
    case "RENEWED":   return "neutral";
    default:          return "neutral";
  }
}

/** Format a tenant name as "F.LastName". */
function shortName(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length < 2) return name;
  return `${parts[0][0]}.${parts[parts.length - 1]}`;
}

/**
 * Render the Tenants cell.
 *
 * • True draft with no tenants → "Not assigned".
 * • Has tenants → clickable name(s) linking to /app/tenants/:id.
 * • Multiple tenants → first name + “+ N more” (all clickable).
 */
function renderTenants(row: LeaseRow): ReactNode {
  const tenants = row.tenants;
  if (!tenants || tenants.length === 0) {
    return <span className="text-slate-400">Not assigned</span>;
  }

  const first = tenants[0];
  const rest = tenants.slice(1);

  return (
    <span className="inline-flex flex-wrap items-center gap-x-1">
      <Link
        href={`/app/tenants/${first.id}`}
        className="font-medium text-brand-600 hover:underline"
      >
        {shortName(first.name)}
      </Link>
      {rest.map((t) => (
        <Link
          key={t.id}
          href={`/app/tenants/${t.id}`}
          className="text-brand-600 hover:underline"
          title={t.name}
        >
          +1
        </Link>
      ))}
      {rest.length > 0 && (
        <span className="text-xs text-slate-400">
          (+{rest.length} more)
        </span>
      )}
    </span>
  );
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/* ── Columns ── */

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
      <Link
        href={`/app/units/${row.unit_id}`}
        className="font-medium text-brand-600 hover:underline"
      >
        {row.unit_number ? `Unit ${row.unit_number}` : row.unit_id.slice(0, 8)}
      </Link>
    ),
  },
  {
    key: "tenants",
    header: "Tenants",
    render: renderTenants,
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
    key: "display_status",
    header: "Status",
    render: (row) => {
      const ds = displayStatus(row);
      return <Badge variant={statusVariant(ds)}>{ds}</Badge>;
    },
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

/* ── Filter (lease-lifecycle only) ── */

const statusFilter: FilterConfig = {
  key: "display_status",
  label: "Status",
  options: [
    { label: "Draft",    value: "DRAFT" },
    { label: "Active",   value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
    { label: "Extended", value: "EXTENDED" },
    { label: "Renewed",  value: "RENEWED" },
  ],
};

/* ── Component ── */

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
