"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  Search,
  LogOut,
  ChevronRight,
  Command,
  User,
  Settings,
  CreditCard,
} from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { Avatar } from "@/components/ui/Avatar";
import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { useAppShell } from "./AppShell";

/* ─── Breadcrumbs ─── */

function HeaderBreadcrumbs({ pathname }: { pathname: string }) {
  const segments = pathname
    .replace(/^\/app\/?/, "")
    .split("/")
    .filter(Boolean);

  return (
    <nav aria-label="Breadcrumb" className="text-xs text-slate-400">
      <ol className="flex items-center gap-1">
        <li>
          <Link href="/app" className="transition-colors hover:text-slate-200">
            Home
          </Link>
        </li>
        {segments.map((seg, i) => {
          const href = `/app/${segments.slice(0, i + 1).join("/")}`;
          const label =
            seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " ");
          const isLast = i === segments.length - 1;
          return (
            <li key={href} className="flex items-center gap-1">
              <ChevronRight size={12} aria-hidden="true" />
              {isLast ? (
                <span className="text-slate-200" aria-current="page">
                  {label}
                </span>
              ) : (
                <Link
                  href={href}
                  className="transition-colors hover:text-slate-200"
                >
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* ─── AppHeader ─── */

export interface AppHeaderProps {
  onOpenCommandPalette?: () => void;
}

export function AppHeader({ onOpenCommandPalette }: AppHeaderProps) {
  const pathname = usePathname();
  const { user } = authStore();
  const { mobileOpen, setMobileOpen, hamburgerRef } = useAppShell();

  const handleLogout = () => {
    authStore.getState().logout("manual");
  };

  const userMenuItems: DropdownMenuItem[] = [
    {
      id: "profile",
      label: "Profile",
      icon: <User size={14} />,
      onClick: () => {
        /* TODO: navigate to profile */
      },
    },
    {
      id: "workspace-settings",
      label: "Workspace settings",
      icon: <Settings size={14} />,
      onClick: () => {
        /* TODO: navigate to settings */
      },
    },
    {
      id: "billing",
      label: "Billing",
      icon: <CreditCard size={14} />,
      onClick: () => {
        /* TODO: navigate to billing */
      },
    },
    {
      id: "sign-out",
      label: "Sign out",
      icon: <LogOut size={14} />,
      danger: true,
      onClick: handleLogout,
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-surface/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        {/* Left: hamburger + breadcrumbs */}
        <div className="flex min-w-0 items-center gap-3">
          <button
            ref={hamburgerRef}
            type="button"
            className="rounded p-1.5 text-slate-300 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand-500 md:hidden"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden min-w-0 items-center gap-2 md:flex">
            <HeaderBreadcrumbs pathname={pathname} />
          </div>
        </div>

        {/* Center: global search */}
        <div className="hidden flex-1 max-w-sm md:block">
          <label className="sr-only" htmlFor="global-search">
            Search
          </label>
          <div className="relative">
            <Search
              size={16}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
              aria-hidden="true"
            />
            <input
              id="global-search"
              type="search"
              className="w-full rounded-lg border border-slate-700 bg-surface pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search…"
            />
          </div>
        </div>

        {/* Right: Cmd+K, notifications, user dropdown */}
        <div className="flex items-center gap-2">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-700 bg-surface px-2.5 py-1.5 text-xs text-slate-400 hover:bg-surface-raised hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 md:inline-flex"
              aria-label="Open command palette"
            >
              <Command size={14} />
              <kbd className="font-sans">K</kbd>
            </button>
          )}

          <Link
            href="/app/notifications"
            className="rounded-full p-2 text-slate-300 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </Link>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="User menu"
              >
                <Avatar name={user?.name || user?.email} size="sm" />
                <span className="hidden max-w-[8rem] truncate text-xs font-medium text-slate-200 sm:block">
                  {user?.name || user?.email || ""}
                </span>
              </button>
            }
            items={userMenuItems}
            align="right"
          />
        </div>
      </div>
    </header>
  );
}
