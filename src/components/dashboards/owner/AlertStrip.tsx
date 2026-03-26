"use client";

import Link from "next/link";
import { AlertCircle, ArrowRight } from "lucide-react";
import type { AlertsViewModel } from "@/services/dashboard/types";

interface AlertStripProps {
  vm: AlertsViewModel;
}

/**
 * UIUX-style gradient alert banner displayed above KPI cards.
 * Additive — the AlertsPanel widget remains in the registry for fallback.
 */
export function AlertStrip({ vm }: AlertStripProps) {
  if (!vm.hasAlerts) return null;

  const hasDanger = vm.alerts.some((a) => a.severity === "danger");

  return (
    <div
      className={`rounded-xl p-4 shadow-md ${
        hasDanger
          ? "bg-gradient-to-br from-red-50 via-red-50 to-orange-50 border border-red-200 shadow-red-100/50"
          : "bg-gradient-to-br from-amber-50 via-amber-50 to-yellow-50 border border-amber-200 shadow-amber-100/50"
      }`}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${
            hasDanger ? "bg-red-100" : "bg-amber-100"
          }`}
        >
          <AlertCircle
            className={`w-5 h-5 ${hasDanger ? "text-red-600" : "text-amber-600"}`}
            strokeWidth={2.5}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2.5">
            <h3
              className={`text-[14px] font-semibold ${
                hasDanger ? "text-red-900" : "text-amber-900"
              }`}
            >
              Action Required
            </h3>
            <span
              className={`px-2 py-0.5 text-[11px] font-semibold rounded-md shadow-sm ${
                hasDanger
                  ? "bg-red-100 text-red-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {vm.alerts.length} {vm.alerts.length === 1 ? "item" : "items"}
            </span>
          </div>
          <div className="space-y-2">
            {vm.alerts.map((alert, i) => (
              <div
                key={`${alert.type}-${i}`}
                className="flex items-center justify-between group"
              >
                <span
                  className={`text-[13px] ${
                    hasDanger ? "text-red-800" : "text-amber-800"
                  }`}
                >
                  <span className="font-semibold">{alert.count}</span>{" "}
                  {alert.message.replace(/^\d+\s*/, "")}
                </span>
                <Link
                  href={alert.link}
                  className={`text-[12px] font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${
                    hasDanger
                      ? "text-red-700 hover:text-red-900"
                      : "text-amber-700 hover:text-amber-900"
                  }`}
                >
                  Review <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
