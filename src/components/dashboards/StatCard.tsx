"use client";

import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  /** Optional: color the change text (positive=green, negative=red) */
  changeType?: "positive" | "negative" | "neutral";
  icon?: ReactNode;
  /** Optional gradient class for the icon container (e.g. "from-green-500 to-green-600") */
  iconColor?: string;
  /** Secondary text shown alongside change (e.g. "vs last month") */
  subtitle?: string;
}

const changeColors = {
  positive: "text-[#15803D]",
  negative: "text-[#B91C1C]",
  neutral: "text-slate-600",
};

export function StatCard({ label, value, change, changeType = "neutral", icon, iconColor, subtitle }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-all duration-200 group">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-[12px] font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</p>
          <p className="text-[32px] font-bold text-slate-900 tracking-tight leading-none">{value}</p>
        </div>
        {icon && (
          <div
            className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow ${
              iconColor
                ? `bg-gradient-to-br ${iconColor} text-white`
                : "bg-brand-50 text-brand-500"
            }`}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
      {(change || subtitle) && (
        <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
          {change && <span className={`text-[13px] font-semibold ${changeColors[changeType]}`}>{change}</span>}
          {subtitle && <span className="text-[13px] text-slate-500">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="mt-3 h-8 w-20 rounded bg-slate-200" />
      <div className="mt-3 pt-3 border-t border-slate-100">
        <div className="h-3 w-24 rounded bg-slate-200" />
      </div>
    </div>
  );
}
