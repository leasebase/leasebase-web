"use client";

import Link from "next/link";
import { Home, CheckCircle2, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import type { VacancyReadinessViewModel } from "@/services/dashboard/types";

interface VacancyReadinessCardProps {
  vm: VacancyReadinessViewModel;
}

export function VacancyReadinessCard({ vm }: VacancyReadinessCardProps) {
  if (vm.source === "unavailable") {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold text-slate-900">Vacancy &amp; Readiness</h2>
        </CardHeader>
        <CardBody>
          <p className="py-4 text-center text-sm text-slate-400">Vacancy data is currently unavailable.</p>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">Vacancy &amp; Readiness</h2>
          <Link href="/app/units" className="text-xs font-medium text-brand-600 hover:text-brand-700">
            View units →
          </Link>
        </div>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-2 gap-3">
          <Tooltip content="Units without an active lease">
            <ReadinessStat
              label="Vacant Units"
              value={vm.vacantUnits}
              icon={<Home size={14} />}
              variant={vm.vacantUnits > 0 ? "warning" : "neutral"}
            />
          </Tooltip>
          <ReadinessStat
            label="Ready to Lease"
            value={vm.readyToLease}
            icon={<CheckCircle2 size={14} />}
            variant="success"
          />
          <ReadinessStat
            label="Missing Rent Config"
            value={vm.missingRentConfig}
            icon={<AlertCircle size={14} />}
            variant={vm.missingRentConfig > 0 ? "danger" : "neutral"}
          />
          <ReadinessStat
            label="Incomplete Setup"
            value={vm.missingSetup}
            icon={<AlertCircle size={14} />}
            variant={vm.missingSetup > 0 ? "danger" : "neutral"}
          />
        </div>

        {vm.missingRentConfig > 0 && (
          <p className="mt-3 text-xs text-slate-500">
            {vm.missingRentConfig} vacant {vm.missingRentConfig === 1 ? "unit needs" : "units need"} rent configuration before listing.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function ReadinessStat({
  label,
  value,
  icon,
  variant,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  variant: "success" | "warning" | "danger" | "neutral";
}) {
  const colors = {
    success: { text: "text-emerald-600", icon: "text-emerald-500" },
    warning: { text: "text-amber-600", icon: "text-amber-500" },
    danger: { text: "text-red-600", icon: "text-red-500" },
    neutral: { text: "text-slate-900", icon: "text-slate-400" },
  };
  const c = colors[variant];

  return (
    <div className="flex items-center gap-2 rounded-md border border-slate-100 px-3 py-2">
      <span className={c.icon}>{icon}</span>
      <div>
        <p className={`text-lg font-semibold ${c.text}`}>{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
