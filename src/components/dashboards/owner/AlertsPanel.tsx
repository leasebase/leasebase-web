"use client";

import Link from "next/link";
import { AlertTriangle, Info, ShieldAlert } from "lucide-react";
import type { AlertsViewModel, AlertSeverity } from "@/services/dashboard/types";

const severityConfig: Record<AlertSeverity, { bar: string; icon: typeof AlertTriangle; rowBg: string; iconBg: string; iconColor: string }> = {
  danger:  { bar: "bg-red-500",   icon: ShieldAlert,   rowBg: "bg-red-50/50",   iconBg: "bg-red-100",   iconColor: "text-red-600" },
  warning: { bar: "bg-amber-500", icon: AlertTriangle,  rowBg: "bg-amber-50/40", iconBg: "bg-amber-100", iconColor: "text-amber-600" },
  info:    { bar: "bg-blue-500",  icon: Info,           rowBg: "",                iconBg: "bg-blue-100",  iconColor: "text-blue-600" },
};

interface AlertsPanelProps {
  vm: AlertsViewModel;
}

export function AlertsPanel({ vm }: AlertsPanelProps) {
  if (!vm.hasAlerts) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-3.5">
          <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
        </div>
        <p className="px-5 py-6 text-center text-sm text-slate-400">No active alerts.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-3.5">
        <h2 className="text-sm font-semibold text-slate-900">Alerts</h2>
        <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600">
          {vm.alerts.length}
        </span>
      </div>
      <ul className="divide-y divide-slate-100">
        {vm.alerts.map((alert, i) => {
          const cfg = severityConfig[alert.severity];
          const IconCmp = cfg.icon;
          return (
            <li key={`${alert.type}-${i}`}>
              <Link
                href={alert.link}
                className={`flex items-center gap-3 px-5 py-3.5 text-sm transition-colors hover:bg-slate-50/60 ${cfg.rowBg}`}
              >
                <div className={`h-9 w-1 shrink-0 rounded-full ${cfg.bar}`} />
                <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${cfg.iconBg}`}>
                  <IconCmp size={14} className={cfg.iconColor} />
                </div>
                <span className="text-[13px] text-slate-700 font-medium">{alert.message}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
