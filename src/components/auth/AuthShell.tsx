"use client";

import type { ReactNode } from "react";
import { AuthValuePanel } from "./AuthValuePanel";
import { Logo } from "@/components/Logo";

interface AuthShellProps {
  children: ReactNode;
}

/**
 * Two-panel responsive auth layout.
 *
 * - Desktop (≥md): left value/branding panel + right form panel.
 * - Mobile: single-column, compact brand header above the form.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(380px,45%)_1fr]">
      {/* Left: value panel (hidden on mobile via AuthValuePanel internals) */}
      <AuthValuePanel />

      {/* Right: form area */}
      <div className="flex flex-col items-center justify-center bg-surface-base px-4 py-10 sm:px-8 md:px-12">
        {/* Mobile-only compact brand header */}
        <div className="mb-8 flex items-center md:hidden">
          <Logo variant="full" theme="light" size={160} />
        </div>

        {children}
      </div>
    </div>
  );
}
