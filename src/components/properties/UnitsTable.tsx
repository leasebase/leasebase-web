"use client";

import Link from "next/link";
import { DataTable, type Column, type FilterConfig } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { UnitRow } from "@/services/properties/types";

const STATUS_VARIANTS: Record<string, BadgeVariant> = {
  OCCUPIED: "success",
  AVAILABLE: "info",
  MAINTENANCE: "warning",
  OFFLINE: "neutral",
};

const columns: Column<UnitRow>[] = [
  {
    key: "unit_number",
    header: "Unit",
    sortable: true,
    render: (row) => (
      <Link
        href={`/app/units/${row.id}`}
        className="font-medium text-brand-600 hover:underline"
      >
        Unit {row.unit_number}
      </Link>
    ),
  },
  {
    key: "bedrooms",
    header: "Bed / Bath",
    render: (row) => (
      <span className="text-slate-600">
        {row.bedrooms}bd / {row.bathrooms}ba
      </span>
    ),
  },
  {
    key: "square_feet",
    header: "Sq Ft",
    sortable: true,
    render: (row) => (
      <span className="text-slate-600">
        {row.square_feet ? row.square_feet.toLocaleString() : "—"}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={STATUS_VARIANTS[row.status] ?? "neutral"}>
        {row.status}
      </Badge>
    ),
  },
];

const statusFilter: FilterConfig = {
  key: "status",
  label: "Status",
  options: [
    { label: "Available", value: "AVAILABLE" },
    { label: "Occupied", value: "OCCUPIED" },
    { label: "Maintenance", value: "MAINTENANCE" },
    { label: "Offline", value: "OFFLINE" },
  ],
};

interface UnitsTableProps {
  units: UnitRow[];
  loading?: boolean;
  error?: string;
}

export function UnitsTable({ units, loading, error }: UnitsTableProps) {
  return (
    <DataTable<UnitRow & Record<string, any>>
      columns={columns}
      rows={units}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      emptyMessage="No units found"
      searchable
      searchPlaceholder="Search units…"
      searchKeys={["unit_number"]}
      filters={[statusFilter]}
      pageSize={20}
    />
  );
}
