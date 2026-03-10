"use client";

import type { ReactNode } from "react";

export interface AppContentProps {
  children: ReactNode;
  loading?: boolean;
}

export function AppContent({ children, loading = false }: AppContentProps) {
  return (
    <main
      id="main-content"
      className="flex-1 min-w-0 overflow-y-auto scroll-smooth"
    >
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6">
        {loading ? (
          <div className="space-y-4 animate-pulse">
            <div className="h-7 w-48 rounded bg-surface-raised" />
            <div className="h-4 w-72 rounded bg-surface" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-28 rounded-lg bg-surface" />
              <div className="h-28 rounded-lg bg-surface" />
              <div className="h-28 rounded-lg bg-surface" />
            </div>
          </div>
        ) : (
          children
        )}
      </div>
    </main>
  );
}
