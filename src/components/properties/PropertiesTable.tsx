"use client";

import Link from "next/link";
import { DataTable, type Column, type FilterConfig } from "@/components/ui/DataTable";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import type { PropertyRow } from "@/services/properties/types";

interface PropertyTableRow extends PropertyRow {
  unitCount: number;
  occupiedCount: number;
}

function occupancyVariant(total: number, occupied: number): BadgeVariant {
  if (total === 0) return "neutral";
  const rate = (occupied / total) * 100;
  if (rate >= 90) return "success";
  if (rate >= 70) return "warning";
  return "danger";
}

const columns: Column<PropertyTableRow>[] = [
  {
    key: "name",
    header: "Property",
    sortable: true,
    render: (row) => (
      <Link
        href={`/app/properties/${row.id}`}
        className="font-medium text-brand-600 hover:underline"
      >
        {row.name}
      </Link>
    ),
  },
  {
    key: "address",
    header: "Address",
    render: (row) => (
      <span className="text-slate-600">
        {row.address_line1}, {row.city}, {row.state} {row.postal_code}
      </span>
    ),
  },
  {
    key: "unitCount",
    header: "Units",
    sortable: true,
    render: (row) => <span>{row.unitCount}</span>,
  },
  {
    key: "occupancy",
    header: "Occupancy",
    sortable: true,
    sortFn: (a: number, b: number) => a - b,
    render: (row) => {
      const rate = row.unitCount > 0 ? Math.round((row.occupiedCount / row.unitCount) * 100) : 0;
      return (
        <Badge variant={occupancyVariant(row.unitCount, row.occupiedCount)}>
          {row.occupiedCount}/{row.unitCount} ({rate}%)
        </Badge>
      );
    },
  },
  {
    key: "status",
    header: "Status",
    render: (row) => (
      <Badge variant={row.status === "ACTIVE" ? "success" : "neutral"}>
        {row.status}
      </Badge>
    ),
  },
];

const statusFilter: FilterConfig = {
  key: "status",
  label: "Status",
  options: [
    { label: "Active", value: "ACTIVE" },
    { label: "Inactive", value: "INACTIVE" },
  ],
};

interface PropertiesTableProps {
  properties: PropertyRow[];
  unitCounts: Record<string, { total: number; occupied: number }>;
  loading?: boolean;
  error?: string;
}

export function PropertiesTable({ properties, unitCounts, loading, error }: PropertiesTableProps) {
  const rows: PropertyTableRow[] = properties.map((p) => ({
    ...p,
    unitCount: unitCounts[p.id]?.total ?? 0,
    occupiedCount: unitCounts[p.id]?.occupied ?? 0,
    // synthetic field for DataTable sorting
    occupancy: unitCounts[p.id]?.total
      ? Math.round(((unitCounts[p.id]?.occupied ?? 0) / unitCounts[p.id].total) * 100)
      : 0,
  }));

  return (
    <DataTable<PropertyTableRow & Record<string, any>>
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      loading={loading}
      error={error}
      emptyMessage="No properties found"
      searchable
      searchPlaceholder="Search properties…"
      searchKeys={["name", "address_line1", "city", "state"]}
      filters={[statusFilter]}
      pageSize={20}
    />
  );
}
