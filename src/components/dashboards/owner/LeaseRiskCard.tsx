"use client";

import Link from "next/link";
import { CalendarClock } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { DashboardBarChart, CHART_COLORS } from "@/components/dashboards/charts";
import type { LeaseRiskViewModel } from "@/services/dashboard/types";

interface LeaseRiskCardProps {
  vm: LeaseRiskViewModel;
}

export function LeaseRiskCard({ vm }: LeaseRiskCardProps) {
  if (vm.source === "unavailable") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Lease Risk &amp; Expirations</h2>
        </CardHeader>
        <CardBody>
          <p className="py-4 text-center text-sm text-slate-400">Lease risk data is currently unavailable.</p>
        </CardBody>
      </Card>
    );
  }

  const hasRisk = vm.expiring30 > 0 || vm.expiring60 > 0 || vm.monthToMonth > 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Lease Risk &amp; Expirations</h2>
          <Link href="/app/leases" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View all →
          </Link>
        </div>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Lease risk bar chart */}
        {hasRisk && (
          <DashboardBarChart
            data={[
              { tier: "30 days", count: vm.expiring30 },
              { tier: "60 days", count: vm.expiring60 },
              { tier: "Month-to-month", count: vm.monthToMonth },
            ]}
            xAxisKey="tier"
            bars={[
              { dataKey: "count", label: "Leases", color: CHART_COLORS.warning },
            ]}
            height={120}
            showYAxis={false}
            showGrid={false}
          />
        )}

        {/* Tier summary */}
        <div className="flex flex-wrap gap-3">
          <TierBadge label="Expiring in 30 days" count={vm.expiring30} variant={vm.expiring30 > 0 ? "danger" : "neutral"} />
          <TierBadge label="Expiring in 60 days" count={vm.expiring60} variant={vm.expiring60 > 0 ? "warning" : "neutral"} />
          <Tooltip content="Active leases past their end date — may be month-to-month">
            <TierBadge label="Possibly month-to-month" count={vm.monthToMonth} variant={vm.monthToMonth > 0 ? "info" : "neutral"} />
          </Tooltip>
        </div>

        {/* Top expirations */}
        {vm.topExpirations.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Upcoming Expirations</p>
            <ul className="divide-y divide-slate-100">
              {vm.topExpirations.slice(0, 5).map((exp) => (
                <li key={exp.leaseId} className="flex items-center justify-between py-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CalendarClock size={14} className="text-slate-400" />
                    <Link
                      href={`/app/leases/${exp.leaseId}`}
                      className="font-medium text-slate-700 hover:text-brand-600"
                    >
                      Unit {exp.unitId}
                    </Link>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="text-slate-500">{exp.endDate}</span>
                    <Badge variant={exp.daysLeft <= 30 ? "danger" : "warning"}>
                      {exp.daysLeft}d left
                    </Badge>
                    <span className="text-slate-500">{exp.rentAmount}/mo</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {!hasRisk && (
          <p className="text-sm text-slate-500">No upcoming expirations or overdue renewals detected.</p>
        )}
      </CardBody>
    </Card>
  );
}

function TierBadge({ label, count, variant }: { label: string; count: number; variant: "danger" | "warning" | "info" | "neutral" }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-100 px-3 py-2">
      <span className={`text-xl font-bold ${
        variant === "danger" ? "text-red-600" :
        variant === "warning" ? "text-amber-600" :
        variant === "info" ? "text-blue-600" :
        "text-slate-400"
      }`}>
        {count}
      </span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  );
}
