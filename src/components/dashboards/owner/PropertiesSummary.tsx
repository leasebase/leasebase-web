"use client";

import Link from "next/link";
import type { PropertiesSummaryViewModel } from "@/services/dashboard/types";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";

function occupancyVariant(rate: number): BadgeVariant {
  if (rate >= 90) return "success";
  if (rate >= 70) return "warning";
  return "danger";
}

interface PropertiesSummaryProps {
  vm: PropertiesSummaryViewModel;
}

export function PropertiesSummary({ vm }: PropertiesSummaryProps) {
  if (!vm.hasProperties) return null;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="border-b border-slate-800 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">Properties</h2>
      </div>
      <ul className="divide-y divide-slate-800/50 text-sm">
        {vm.properties.map((p) => (
          <li key={p.id}>
            <Link
              href={`/app/properties/${p.id}`}
              className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-slate-900/50"
            >
              <div className="min-w-0">
                <span className="text-slate-200">{p.name}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {p.occupiedUnits}/{p.totalUnits} units
                </span>
                {p.address && (
                  <p className="truncate text-xs text-slate-500">{p.address}</p>
                )}
              </div>
              <Badge variant={occupancyVariant(p.occupancyRate)}>
                {p.occupancyRate}%
              </Badge>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
