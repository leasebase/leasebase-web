"use client";

import type { ReactNode } from "react";

export interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  icon?: ReactNode;
}

export function StatCard({ label, value, change, icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">{value}</p>
          {change && <p className="mt-1 text-xs text-slate-500">{change}</p>}
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
    <div className="rounded-xl border border-slate-200 bg-white p-5 animate-pulse">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="mt-2 h-7 w-16 rounded bg-slate-200" />
      <div className="mt-1.5 h-3 w-24 rounded bg-slate-200" />
    </div>
  );
}
