"use client";

import type { ReactNode } from "react";

export interface SectionCardProps {
  children: ReactNode;
  /** Optional gradient header content */
  header?: ReactNode;
  className?: string;
}

/**
 * UIUX card chrome: white card with subtle border, shadow, and optional gradient header.
 * Reusable across dashboard sections.
 */
export function SectionCard({ children, header, className = "" }: SectionCardProps) {
  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-md ${className}`}>
      {header && (
        <div className="p-4 border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white">
          {header}
        </div>
      )}
      {children}
    </div>
  );
}
