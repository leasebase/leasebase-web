"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

/* ─── Layout state context ─── */

interface AppShellContextValue {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  closeMobile: () => void;
  hamburgerRef: React.RefObject<HTMLButtonElement>;
}

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function useAppShell() {
  const ctx = useContext(AppShellContext);
  if (!ctx) throw new Error("useAppShell must be used inside <AppShell>");
  return ctx;
}

/* ─── Constants ─── */

const SIDEBAR_KEY = "lb-sidebar-collapsed";

/* ─── AppShell ─── */

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null!);

  // Restore persisted sidebar state
  useEffect(() => {
    try {
      const stored = localStorage.getItem(SIDEBAR_KEY);
      if (stored === "true") setSidebarCollapsed(true);
    } catch {}
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_KEY, String(next));
      } catch {}
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setTimeout(() => hamburgerRef.current?.focus(), 0);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Escape closes mobile drawer + lock body scroll
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeMobile();
    };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, closeMobile]);

  return (
    <AppShellContext.Provider
      value={{
        sidebarCollapsed,
        toggleSidebar,
        mobileOpen,
        setMobileOpen,
        closeMobile,
        hamburgerRef,
      }}
    >
      <div className="flex h-screen overflow-hidden bg-surface-base text-slate-900">
        {children}
      </div>
    </AppShellContext.Provider>
  );
}
