"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function TenantDashboardSkeleton() {
  return (
    <section className="space-y-6" aria-label="Loading dashboard">
      {/* Welcome card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-6">
        <Skeleton variant="text" className="h-7 w-64" />
        <Skeleton variant="text" className="mt-2 h-4 w-80" />
        <div className="mt-3 flex gap-4">
          <Skeleton variant="text" className="h-4 w-24" />
          <Skeleton variant="text" className="h-4 w-32" />
        </div>
      </div>

      {/* Rent card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <Skeleton variant="text" className="h-5 w-32" />
            <Skeleton variant="text" className="mt-2 h-4 w-48" />
          </div>
          <Skeleton variant="rectangular" className="w-14 h-14 rounded-xl" />
        </div>
        <Skeleton variant="text" className="h-10 w-32" />
        <Skeleton variant="rectangular" className="mt-6 h-12 w-full rounded-xl" />
      </div>

      {/* Two-column grid skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <Skeleton variant="text" className="h-5 w-36" />
            </div>
            <div className="p-5 space-y-4">
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex gap-3">
                  <Skeleton variant="rectangular" className="w-10 h-10 rounded-lg" />
                  <div className="flex-1">
                    <Skeleton variant="text" className="h-3 w-20" />
                    <Skeleton variant="text" className="mt-1 h-4 w-32" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
