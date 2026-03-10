"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function PropertiesSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-48" />
          <Skeleton variant="text" className="h-4 w-72" />
        </div>
        <Skeleton variant="text" className="h-10 w-32 rounded-md" />
      </div>
      {/* Table skeleton */}
      <div className="rounded-lg border border-slate-200 overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50 px-4 py-3">
          <Skeleton variant="text" className="h-8 w-48 rounded-md" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-slate-200 px-4 py-3">
            <Skeleton variant="text" className="h-5 w-40" />
            <Skeleton variant="text" className="h-5 w-56" />
            <Skeleton variant="text" className="h-5 w-16" />
            <Skeleton variant="text" className="h-5 w-24" />
            <Skeleton variant="text" className="h-5 w-20" />
          </div>
        ))}
      </div>
    </div>
  );
}
