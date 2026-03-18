"use client";

import type { ReactNode } from "react";

interface AuthCardProps {
  children: ReactNode;
  /** Optional extra className */
  className?: string;
}

/**
 * Elevated card for auth form content.
 * Builds on the design-system Card look with auth-specific enhancements:
 * stronger shadow, refined border, generous padding.
 */
export function AuthCard({ children, className = "" }: AuthCardProps) {
  return (
    <div
      className={`w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
