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
import { useShell } from "./AppShell";

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
          <Link href="/app" className="hover:text-slate-200 transition-colors">
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
                  className="hover:text-slate-200 transition-colors"
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
  const { mobileOpen, setMobileOpen, hamburgerRef } = useShell();

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
    <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-900/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        {/* Left: hamburger + breadcrumbs */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            ref={hamburgerRef}
            type="button"
            className="md:hidden rounded p-1.5 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div className="hidden md:flex items-center gap-2 min-w-0">
            <HeaderBreadcrumbs pathname={pathname} />
          </div>
        </div>

        {/* Center: global search */}
        <div className="hidden md:block flex-1 max-w-sm">
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
              className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-8 pr-3 py-1.5 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
              className="hidden md:inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-400 hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Open command palette"
            >
              <Command size={14} />
              <kbd className="font-sans">K</kbd>
            </button>
          )}

          <Link
            href="/app/notifications"
            className="rounded-full p-2 text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Notifications"
          >
            <Bell size={18} />
          </Link>

          <DropdownMenu
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
                aria-label="User menu"
              >
                <Avatar
                  name={user?.name || user?.email}
                  size="sm"
                />
                <span className="hidden sm:block text-xs font-medium text-slate-200 max-w-[8rem] truncate">
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
