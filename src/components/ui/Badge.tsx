"use client";

import type { ReactNode } from "react";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral";

export interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-success/20 text-emerald-300 border-emerald-700/40",
  warning: "bg-warning/20 text-amber-300 border-amber-700/40",
  danger: "bg-danger/20 text-red-300 border-red-700/40",
  info: "bg-info/20 text-blue-300 border-blue-700/40",
  neutral: "bg-slate-700/40 text-slate-300 border-slate-600/40",
};

export function Badge({ variant = "neutral", children, className = "" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
