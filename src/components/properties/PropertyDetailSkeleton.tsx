"use client";

import { Skeleton } from "@/components/ui/Skeleton";

export function PropertyDetailSkeleton() {
  return (
    <div className="space-y-6">
      {/* Breadcrumb skeleton */}
      <Skeleton variant="text" className="h-4 w-48" />
      {/* Header skeleton */}
      <div className="space-y-2">
        <Skeleton variant="text" className="h-8 w-64" />
        <Skeleton variant="text" className="h-4 w-80" />
      </div>
      {/* Tabs skeleton */}
      <div className="flex gap-4 border-b border-slate-200 pb-2">
        <Skeleton variant="text" className="h-8 w-20" />
        <Skeleton variant="text" className="h-8 w-20" />
        <Skeleton variant="text" className="h-8 w-16" />
      </div>
      {/* Content skeleton */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Skeleton variant="text" className="h-32 w-full rounded-lg" />
        <Skeleton variant="text" className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
