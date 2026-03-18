"use client";

import { StatCardSkeleton } from "@/components/dashboards/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";

export function OwnerDashboardSkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading dashboard">
      {/* Header skeleton */}
      <div>
        <Skeleton variant="text" className="h-7 w-48" />
        <Skeleton variant="text" className="mt-2 h-4 w-72" />
      </div>

      {/* KPI grid skeleton — 4 cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Priority actions skeleton */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <Skeleton variant="text" className="h-4 w-32" />
        <Skeleton variant="text" className="h-10 w-full" />
        <Skeleton variant="text" className="h-10 w-full" />
      </div>

      {/* Two-column skeleton */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="text" className="h-6 w-full" />
          <Skeleton variant="text" className="h-6 w-full" />
          <Skeleton variant="text" className="h-6 w-full" />
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <Skeleton variant="text" className="h-4 w-32" />
          <Skeleton variant="rectangular" className="h-2 w-full" />
          <Skeleton variant="rectangular" className="h-2 w-full" />
        </div>
      </div>

      {/* Table skeleton */}
      <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
        <Skeleton variant="text" className="h-4 w-40" />
        <Skeleton variant="text" className="h-8 w-full" />
        <Skeleton variant="text" className="h-8 w-full" />
        <Skeleton variant="text" className="h-8 w-full" />
      </div>
    </section>
  );
}
