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

interface KpiGridProps {
  vm: KpiGridViewModel;
}

export function KpiGrid({ vm }: KpiGridProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              icon={<Icon name={kpi.icon} size={20} />}
            />
          </Tooltip>
        );

        if (kpi.href) {
          return (
            <Link key={kpi.key} href={kpi.href} className="block rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400">
              {card}
            </Link>
          );
        }

        return <div key={kpi.key}>{card}</div>;
      })}
    </div>
  );
}
