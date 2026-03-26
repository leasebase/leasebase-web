"use client";

import Link from "next/link";
import type { KpiGridViewModel } from "@/services/dashboard/types";
import { StatCard } from "@/components/dashboards/StatCard";
import { Tooltip } from "@/components/ui/Tooltip";
import { Icon } from "@/components/ui/Icon";

const provenanceLabel: Record<string, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

/** Maps KPI keys to UIUX gradient icon colors */
const kpiIconColor: Record<string, string> = {
  collectedThisMonth: "from-green-500 to-green-600",
  overdueAmount: "from-red-500 to-red-600",
  occupancy: "from-blue-500 to-blue-600",
  openMaintenanceRequests: "from-violet-500 to-violet-600",
};

/** Maps KPI keys to UIUX change color type */
function kpiChangeType(key: string, rawValue: number): "positive" | "negative" | "neutral" {
  if (key === "overdueAmount") return rawValue > 0 ? "negative" : "neutral";
  if (key === "collectedThisMonth") return "positive";
  return "neutral";
}

interface KpiGridProps {
  vm: KpiGridViewModel;
}

export function KpiGrid({ vm }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {vm.items.map((kpi) => {
        const card = (
          <Tooltip
            key={kpi.key}
            content={provenanceLabel[kpi.source] ?? kpi.source}
          >
            <StatCard
              label={kpi.label}
              value={kpi.value}
              change={kpi.change}
              changeType={kpiChangeType(kpi.key, kpi.rawValue)}
              subtitle={kpi.subtitle}
              icon={<Icon name={kpi.icon} size={22} strokeWidth={2.5} />}
              iconColor={kpiIconColor[kpi.key]}
            />
          </Tooltip>
        );

        if (kpi.href) {
          return (
            <Link key={kpi.key} href={kpi.href} className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
              {card}
            </Link>
          );
        }

        return <div key={kpi.key}>{card}</div>;
      })}
    </div>
  );
}
