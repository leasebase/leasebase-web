"use client";

import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  iconColor?: string;
  subtitle?: string;
}

const changeColors = {
  positive: "text-green-600",
  negative: "text-red-600",
  neutral: "text-slate-500",
};

export function StatCard({ label, value, change, changeType = "neutral", icon, iconColor, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
          {change && <p className={`mt-1 text-xs font-medium ${changeColors[changeType]}`}>{change}</p>}
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
        {icon && (
          <span
            className={`rounded-xl p-2.5 shadow-sm ${iconColor ? `bg-gradient-to-br ${iconColor} text-white` : "bg-brand-50 text-brand-500"}`}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="mt-2 h-7 w-16 rounded bg-slate-200" />
      <div className="mt-1.5 h-3 w-24 rounded bg-slate-200" />
    </div>
  );
}
