"use client";

import Link from "next/link";
import { Wrench, AlertTriangle, Clock } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import type { MaintenanceOverviewViewModel } from "@/services/dashboard/types";

interface MaintenanceOverviewCardProps {
  vm: MaintenanceOverviewViewModel;
}

export function MaintenanceOverviewCard({ vm }: MaintenanceOverviewCardProps) {
  if (vm.source === "unavailable") return null;

  const total = vm.open + vm.inProgress;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Maintenance Overview</h2>
          <Link href="/app/maintenance" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Status breakdown */}
        <div className="grid grid-cols-2 gap-3">
          <StatusStat label="Open" value={vm.open} icon={<Wrench size={14} />} />
          <StatusStat label="In Progress" value={vm.inProgress} icon={<Wrench size={14} />} />
          <StatusStat label="Waiting" value={vm.waiting} icon={<Clock size={14} />} />
          <StatusStat
            label="Urgent"
            value={vm.urgent}
            icon={<AlertTriangle size={14} />}
            accent={vm.urgent > 0}
          />
        </div>

        {/* Aging */}
        {vm.oldestOpenAgeDays > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Clock size={14} className="text-slate-400" />
            <span className="text-slate-500">Oldest open request:</span>
            <Badge variant={vm.oldestOpenAgeDays > 7 ? "warning" : "neutral"}>
              {vm.oldestOpenAgeDays} {vm.oldestOpenAgeDays === 1 ? "day" : "days"}
            </Badge>
          </div>
        )}

        {/* Most affected property */}
        {vm.mostAffectedProperty && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Most affected:</span>
            <Link
              href={`/app/properties/${vm.mostAffectedProperty.id}`}
              className="font-medium text-slate-700 hover:text-brand-600"
            >
              {vm.mostAffectedProperty.name}
            </Link>
            <Badge variant="neutral">{vm.mostAffectedProperty.count} requests</Badge>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function StatusStat({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-100 px-3 py-2">
      <span className={accent ? "text-red-500" : "text-slate-400"}>{icon}</span>
      <div>
        <p className={`text-lg font-semibold ${accent ? "text-red-600" : "text-slate-900"}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
