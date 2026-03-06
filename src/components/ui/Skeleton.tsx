"use client";

export interface SkeletonProps {
  className?: string;
  /** Preset shapes for common patterns */
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = "",
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  const base = "animate-pulse bg-slate-800";

  const variantClasses: Record<string, string> = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-md",
  };

  const style: React.CSSProperties = {};
  if (width) style.width = typeof width === "number" ? `${width}px` : width;
  if (height) style.height = typeof height === "number" ? `${height}px` : height;

  return (
    <div
      className={`${base} ${variantClasses[variant]} ${className}`}
      style={style}
      role="status"
      aria-label="Loading"
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}

/* ── Convenience presets ── */

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-slate-800 bg-slate-900 p-4 space-y-3 ${className}`}>
      <Skeleton variant="text" className="h-5 w-1/3" />
      <Skeleton variant="text" className="h-4 w-2/3" />
      <Skeleton variant="text" className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonTable({ rows = 5, className = "" }: { rows?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <Skeleton variant="text" className="h-10 w-full rounded-md" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} variant="text" className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}
