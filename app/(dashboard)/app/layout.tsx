"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { AppShell } from "@/components/layout/AppShell";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { AppHeader } from "@/components/layout/AppHeader";
import { AppContent } from "@/components/layout/AppContent";

export default function AppLayout({ children }: { children: ReactNode }) {
  const { isLoading } = useRequireAuth();
  const [cmdOpen, setCmdOpen] = useState(false);

  // Global Cmd+K / Ctrl+K handler
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCmdOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  return (
    <ToastProvider>
      <AppShell>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-3 focus:py-1 focus:text-white"
        >
          Skip to main content
        </a>

        <AppSidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <AppHeader onOpenCommandPalette={() => setCmdOpen(true)} />
          <AppContent loading={isLoading}>{children}</AppContent>
        </div>
      </AppShell>

      {/* Command palette (Cmd+K / Ctrl+K) */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </ToastProvider>
  );
}
