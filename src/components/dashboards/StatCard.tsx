"use client";

import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  /** Optional: color the change text (positive=green, negative=red) */
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
}

const changeColors = {
  positive: "text-green-600",
  negative: "text-red-600",
  neutral: "text-slate-500",
};

export function StatCard({ label, value, change, changeType = "neutral", icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-2 text-[28px] font-bold leading-none tracking-tight text-slate-900">{value}</p>
          {change && <p className={`mt-1.5 text-xs font-medium ${changeColors[changeType]}`}>{change}</p>}
        </div>
        {icon && (
          <span className="rounded-xl bg-brand-50 p-2.5 text-brand-500 shadow-sm" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-24 rounded bg-slate-200" />
    </div>
  );
}
