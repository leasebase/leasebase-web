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
    <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900">{value}</p>
          {change && <p className="mt-0.5 text-xs text-slate-500">{change}</p>}
        </div>
        {icon && (
          <span className="rounded-md bg-brand-50 p-2 text-brand-600" aria-hidden="true">
            {icon}
          </span>
        )}
      </div>
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 animate-pulse">
      <div className="h-3 w-20 rounded bg-slate-200" />
      <div className="mt-2 h-7 w-16 rounded bg-slate-200" />
      <div className="mt-1 h-3 w-24 rounded bg-slate-200" />
    </div>
  );
}
