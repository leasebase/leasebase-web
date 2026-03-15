"use client";

import type { PortfolioHealthViewModel } from "@/services/dashboard/types";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Tooltip } from "@/components/ui/Tooltip";
import { Wrench } from "lucide-react";
import { DonutChart, CHART_COLORS } from "@/components/dashboards/charts";

const provenanceLabel: Record<string, string> = {
  live: "Live data",
  stub: "Sample data",
  unavailable: "Data unavailable",
};

interface PortfolioHealthProps {
  vm: PortfolioHealthViewModel;
}

export function PortfolioHealthWidget({ vm }: PortfolioHealthProps) {
  const occupancy = vm.occupancyRate.source !== "unavailable" ? vm.occupancyRate.value : 0;
  const vacancy = Math.max(0, 100 - occupancy);

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-200 px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-900">Portfolio Health</h2>
      </div>
      <div className="space-y-4 px-4 py-4">
        {/* Occupancy donut + progress bars side by side */}
        <div className="flex items-center gap-6">
          {vm.occupancyRate.source !== "unavailable" && (
            <div className="shrink-0">
              <DonutChart
                segments={[
                  { label: "Occupied", value: occupancy, color: CHART_COLORS.success },
                  { label: "Vacant", value: vacancy, color: CHART_COLORS.slate200 },
                ]}
                centerLabel={`${occupancy.toFixed(1)}%`}
                centerSub="occupied"
                height={130}
                innerRadius={38}
                outerRadius={58}
              />
            </div>
          )}

          <div className="min-w-0 flex-1 space-y-4">
            <Tooltip content={provenanceLabel[vm.occupancyRate.source]}>
              <ProgressBar
                label="Occupancy Rate"
                value={vm.occupancyRate.source === "unavailable" ? 0 : vm.occupancyRate.value}
                variant={vm.occupancyRate.value >= 90 ? "success" : vm.occupancyRate.value >= 70 ? "warning" : "danger"}
              />
            </Tooltip>

            <Tooltip content={provenanceLabel[vm.collectionRate.source]}>
              <ProgressBar
                label="Collection Rate"
                value={vm.collectionRate.source === "unavailable" ? 0 : vm.collectionRate.value}
                variant={vm.collectionRate.value >= 90 ? "success" : vm.collectionRate.value >= 70 ? "warning" : "danger"}
              />
            </Tooltip>

            <div className="flex items-center gap-2 text-sm">
              <Wrench size={14} className="text-slate-400" />
              <span className="text-slate-500">Open Work Orders:</span>
              <Tooltip content={provenanceLabel[vm.openWorkOrders.source]}>
                <span className="font-medium text-slate-900">
                  {vm.openWorkOrders.source === "unavailable" ? "—" : vm.openWorkOrders.value}
                </span>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
