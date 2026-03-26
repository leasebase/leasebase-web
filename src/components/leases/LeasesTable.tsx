"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Calendar } from "lucide-react";
import { DataTable, type Column, type FilterConfig } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { LeaseRow, LeaseTenantRow } from "@/services/leases/types";
import { TERM_TYPE_LABELS } from "@/services/leases/types";

/* ── Helpers ── */

/** Resolve the owner-facing display status (prefers backend-computed field). */
function displayStatus(row: LeaseRow): string {
  return row.display_status ?? row.status;
}

/** Badge variant keyed on lease-lifecycle display status. */
function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "EXTENDED":      return "success";
    case "ACKNOWLEDGED":  return "info";   // tenant joined, awaiting document
    case "DRAFT":         return "warning";
    case "INACTIVE":      return "danger";
    case "RENEWED":       return "neutral";
    default:              return "neutral";
  }
}

/** Get initials from a name string. */
function getInitials(name: string): string {
  return name
    .split(" ")
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() ?? "")
    .join("");
}

/** Format a date as "Mar 1, 2026". */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Format cents to dollar string. */
function formatRent(cents: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(cents / 100);
}

/**
 * Render the Tenant cell — UIUX style with avatar initials.
 *
 * • No tenants → "Not assigned".
 * • Has tenants → initials avatar + clickable full name.
 * • Multiple tenants → first name + "+N" count.
 */
function renderTenants(row: LeaseRow): ReactNode {
  const tenants = row.tenants;
  if (!tenants || tenants.length === 0) {
    return <span className="text-[13px] text-slate-400">Not assigned</span>;
  }

  const first = tenants[0];
  const rest = tenants.slice(1);

  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center flex-shrink-0">
        <span className="text-[12px] font-semibold text-slate-600">
          {getInitials(first.name)}
        </span>
      </div>
      <div className="min-w-0">
        <Link
          href={`/app/tenants/${first.id}`}
          className="text-[13px] font-medium text-slate-900 hover:text-brand-600 transition-colors truncate block"
        >
          {first.name}
        </Link>
        {rest.length > 0 && (
          <span className="text-[11px] text-slate-500">+{rest.length} more</span>
        )}
      </div>
    </div>
  );
}

/* ── Columns ── */

const columns: Column<LeaseRow>[] = [
  {
    key: "tenants",
    header: "Tenant",
    render: renderTenants,
  },
  {
    key: "property_name",
    header: "Property & Unit",
    sortable: true,
    render: (row) => (
      <div>
        <Link
          href={`/app/properties/${row.property_id}`}
          className="text-[13px] font-medium text-slate-900 hover:text-brand-600 transition-colors"
        >
          {row.property_name ?? row.property_id.slice(0, 8)}
        </Link>
        <p className="text-[12px] text-slate-500">
          {row.unit_number ? `Unit ${row.unit_number}` : "—"}
        </p>
      </div>
    ),
  },
  {
    key: "dates",
    header: "Lease Period",
    render: (row) => (
      <div className="flex items-center gap-2 text-slate-600">
        <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <div className="text-[12px]">
          <p className="font-medium">{formatDate(row.start_date)}</p>
          <p className="text-slate-500">to {formatDate(row.end_date)}</p>
        </div>
      </div>
    ),
  },
  {
    key: "rent_amount",
    header: "Monthly Rent",
    sortable: true,
    render: (row) => (
      <div className="flex items-center justify-end gap-1.5">
        <span className="text-[15px] font-semibold text-slate-900">
          {formatRent(row.rent_amount)}
        </span>
      </div>
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
    key: "actions",
    header: "",
    render: (row) => {
      const ds = displayStatus(row);
      let label = "View Details";
      let cls = "text-blue-600 hover:text-blue-700";
      if (ds === "DRAFT") {
        label = "Review";
        cls = "text-amber-700 font-semibold hover:text-amber-800";
      } else if (ds === "ACKNOWLEDGED") {
        label = "Send Docs";
        cls = "text-blue-700 font-semibold hover:text-blue-800";
      } else if (ds === "INACTIVE") {
        label = "Renew";
        cls = "text-brand-600 font-semibold hover:text-brand-700";
      }
      return (
        <Link href={`/app/leases/${row.id}`} className={`text-[12px] font-medium transition-colors hover:underline ${cls}`}>
          {label}
        </Link>
      );
    },
  },
];

/* ── Filter (lease-lifecycle only) ── */

const statusFilter: FilterConfig = {
  key: "display_status",
  label: "Status",
  options: [
    { label: "Draft",         value: "DRAFT" },
    { label: "Acknowledged",  value: "ACKNOWLEDGED" },
    { label: "Active",        value: "ACTIVE" },
    { label: "Inactive",      value: "INACTIVE" },
    { label: "Extended",      value: "EXTENDED" },
    { label: "Renewed",       value: "RENEWED" },
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
