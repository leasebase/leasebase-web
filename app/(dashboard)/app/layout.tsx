"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { authStore } from "@/lib/auth/store";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { groupNavForPersona, type NavGroup } from "@/lib/appNav";
import { Icon } from "@/components/ui/Icon";
import { Tooltip } from "@/components/ui/Tooltip";
import { ToastProvider } from "@/components/ui/Toast";
import { CommandPalette } from "@/components/ui/CommandPalette";
import {
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
} from "lucide-react";

const SIDEBAR_KEY = "lb-sidebar-collapsed";

/* ─── Sidebar nav (shared desktop / mobile) ─── */
function SidebarNav({
  pathname,
  groups,
  collapsed,
  onItemClick,
}: {
  pathname: string;
  groups: NavGroup[];
  collapsed: boolean;
  onItemClick?: () => void;
}) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.key}>
          {/* Group label — hidden when collapsed */}
          {!collapsed && (
            <p className="mb-1 px-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              {group.label}
            </p>
          )}
          {collapsed && (
            <div className="mx-auto my-1 h-px w-6 bg-slate-800" aria-hidden="true" />
          )}
          <ul className="space-y-0.5 text-sm">
            {group.items.map((item) => {
              const active = pathname === item.path;
              const linkContent = (
                <Link
                  href={item.path}
                  onClick={onItemClick}
                  className={`flex items-center gap-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                    collapsed ? "justify-center px-2 py-2" : "px-2.5 py-2"
                  } ${
                    active
                      ? "bg-brand-500/10 text-brand-400 font-medium"
                      : "text-slate-300 hover:bg-slate-800 hover:text-slate-100"
                  }`}
                  aria-current={active ? "page" : undefined}
                >
                  <Icon name={item.icon || ""} size={18} className={active ? "text-brand-400" : ""} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );

              return (
                <li key={item.path}>
                  {collapsed ? (
                    <Tooltip content={item.label}>{linkContent}</Tooltip>
                  ) : (
                    linkContent
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── Breadcrumbs ─── */
function Breadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname
    .replace(/^\/app\/?/, "")
    .split("/")
    .filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-slate-400">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/app" className="hover:text-slate-200">Home</Link>
        </li>
        {segments.map((seg, i) => {
          const href = `/app/${segments.slice(0, i + 1).join("/")}`;
          const label = seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
          const isLast = i === segments.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight size={12} aria-hidden="true" />
              {isLast ? (
                <span className="text-slate-200" aria-current="page">{label}</span>
              ) : (
                <Link href={href} className="hover:text-slate-200">{label}</Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── Main layout ─── */
export default function AppLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { user, isLoading } = useRequireAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const groups = groupNavForPersona(user?.persona);

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
      try { localStorage.setItem(SIDEBAR_KEY, String(next)); } catch {}
      return next;
    });
  }, []);

  const closeMobile = useCallback(() => {
    setMobileOpen(false);
    setTimeout(() => hamburgerRef.current?.focus(), 0);
  }, []);

  useEffect(() => { setMobileOpen(false); }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeMobile(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", handler); document.body.style.overflow = ""; };
  }, [mobileOpen, closeMobile]);

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

  const handleLogout = () => { authStore.getState().logout("manual"); };

  return (
    <ToastProvider>
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-brand-600 focus:px-3 focus:py-1 focus:text-white"
        >
          Skip to main content
        </a>

        {/* ─── Top bar ─── */}
        <header className="sticky top-0 z-40 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
          <div className="px-4 py-2.5 flex items-center justify-between gap-4">
            {/* Left: hamburger + logo + breadcrumbs */}
            <div className="flex items-center gap-3 min-w-0">
              <button
                ref={hamburgerRef}
                type="button"
                className="md:hidden rounded p-1.5 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((o) => !o)}
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
              <Link href="/app" className="flex items-center gap-2 shrink-0">
                <span className="h-8 w-8 rounded-md bg-brand-500 flex items-center justify-center text-white font-bold text-sm" aria-hidden="true">LB</span>
                <span className="hidden lg:block text-sm font-semibold tracking-wide">Leasebase</span>
              </Link>
              <div className="hidden md:block text-slate-600 select-none" aria-hidden="true">/</div>
              <div className="hidden md:block">
                <Breadcrumbs pathname={pathname} />
              </div>
            </div>

            {/* Center: global search */}
            <div className="hidden md:block flex-1 max-w-sm">
              <label className="sr-only" htmlFor="global-search">Search</label>
              <div className="relative">
                <Search size={16} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" aria-hidden="true" />
                <input
                  id="global-search"
                  type="search"
                  className="w-full rounded-md border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Search…"
                />
              </div>
            </div>

            {/* Right: Cmd+K, notifications, user */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCmdOpen(true)}
                className="hidden md:inline-flex items-center gap-1.5 rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Open command palette"
              >
                <Command size={14} />
                <kbd className="font-sans">K</kbd>
              </button>
              <Link
                href="/app/notifications"
                className="rounded-full p-2 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Notifications"
              >
                <Bell size={18} />
              </Link>
              <div className="flex items-center gap-2">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-600 text-xs font-semibold text-white">
                  {user?.name?.[0]?.toUpperCase() || "?"}
                </span>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-medium truncate max-w-[10rem]">{user?.name || user?.email || ""}</span>
                  <span className="text-[10px] text-slate-400 capitalize">{user?.persona?.replace(/([A-Z])/g, " $1").trim() || ""}</span>
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="ml-1 rounded p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  aria-label="Sign out"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* ─── Body ─── */}
        <div className="flex-1 flex w-full">
          {/* Desktop sidebar */}
          <nav
            className={`hidden md:flex flex-col shrink-0 border-r border-slate-800 transition-[width] duration-200 ease-in-out ${
              sidebarCollapsed ? "w-[72px]" : "w-[240px]"
            }`}
            aria-label="Primary navigation"
          >
            <div className="flex-1 overflow-y-auto px-2 py-4">
              <SidebarNav pathname={pathname} groups={groups} collapsed={sidebarCollapsed} />
            </div>

            {/* Collapse toggle */}
            <div className="border-t border-slate-800 px-2 py-2">
              <button
                type="button"
                onClick={toggleSidebar}
                className={`flex w-full items-center rounded-lg px-2.5 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  sidebarCollapsed ? "justify-center" : "gap-2"
                }`}
                aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <><PanelLeftClose size={16} /><span>Collapse</span></>}
              </button>
            </div>
          </nav>

          {/* Mobile drawer */}
          {mobileOpen && (
            <>
              <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={closeMobile} aria-hidden="true" />
              <nav className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 px-3 py-4 overflow-y-auto md:hidden" aria-label="Primary navigation">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200">Navigation</span>
                  <button type="button" onClick={closeMobile} className="rounded p-1 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Close navigation">
                    <X size={18} />
                  </button>
                </div>
                <SidebarNav pathname={pathname} groups={groups} collapsed={false} onItemClick={closeMobile} />
              </nav>
            </>
          )}

          <main id="main-content" className="flex-1 min-w-0 px-4 py-5 md:px-6">
            {isLoading ? (
              <div className="space-y-4 animate-pulse">
                <div className="h-7 w-48 rounded bg-slate-800" />
                <div className="h-4 w-72 rounded bg-slate-900" />
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="h-28 rounded-lg bg-slate-900" />
                  <div className="h-28 rounded-lg bg-slate-900" />
                  <div className="h-28 rounded-lg bg-slate-900" />
                </div>
              </div>
            ) : (
              children
            )}
          </main>
        </div>
      </div>

      {/* Command palette (Cmd+K / Ctrl+K) */}
      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
    </ToastProvider>
  );
}
