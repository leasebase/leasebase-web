"use client";

import { StatCardSkeleton } from "@/components/dashboards/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function TenantDashboardSkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div>
        <Skeleton variant="text" className="h-7 w-48" />
        <Skeleton variant="text" className="mt-2 h-4 w-72" />
      </div>

      {/* KPI header skeleton — 3 cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Quick actions skeleton */}
      <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-4">
        <Skeleton variant="text" className="h-4 w-24" />
        <div className="mt-3 flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-9 w-28 rounded-md" />
          ))}
        </div>
      </div>

      {/* Two-column widget skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-lg border border-slate-800 bg-slate-950/70 p-4 space-y-3">
            <Skeleton variant="text" className="h-4 w-32" />
            <Skeleton variant="text" className="h-6 w-full" />
            <Skeleton variant="text" className="h-6 w-full" />
          </div>
        ))}
      </div>
    </section>
  );
}
