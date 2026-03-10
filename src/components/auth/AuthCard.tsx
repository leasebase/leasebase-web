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
      className={`w-full max-w-md rounded-2xl border border-slate-800/80 bg-slate-950/80 p-8 shadow-xl backdrop-blur-sm sm:p-10 ${className}`}
    >
      {children}
    </div>
  );
}
