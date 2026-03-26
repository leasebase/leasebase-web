"use client";

import type { ReactNode } from "react";
import { AuthValuePanel } from "./AuthValuePanel";
import { Logo } from "@/components/Logo";

interface AuthShellProps {
  children: ReactNode;
}

/**
 * Two-panel responsive auth layout — UIUX v1 visual style.
 *
 * - Desktop (≥md): left value/branding panel + right form panel with green gradient bg.
 * - Mobile: single-column centered with gradient background.
 */
export function AuthShell({ children }: AuthShellProps) {
  return (
    <div className="grid min-h-screen md:grid-cols-[minmax(380px,45%)_1fr]">
      {/* Left: value panel (hidden on mobile via AuthValuePanel internals) */}
      <AuthValuePanel />

      {/* Right: form area — UIUX gradient background */}
      <div className="relative flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/20 px-4 py-10 sm:px-8 md:px-12 overflow-hidden">
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 right-20 w-72 h-72 bg-green-200/20 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
        </div>

        {/* Mobile-only compact brand header */}
        <div className="relative z-10 mb-8 flex items-center md:hidden">
          <Logo variant="full" theme="light" size={160} />
        </div>

        <div className="relative z-10 w-full flex flex-col items-center">
          {children}
        </div>
      </div>
    </div>
  );
}
