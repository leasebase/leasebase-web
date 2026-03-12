"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  X,
  Bell,
  MessageSquare,
  Search,
  LogOut,
  Command,
  Settings,
} from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { Avatar } from "@/components/ui/Avatar";
import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { useAppShell } from "./AppShell";

/* ─── AppHeader ─── */

export interface AppHeaderProps {
  onOpenCommandPalette?: () => void;
}

export function AppHeader({ onOpenCommandPalette }: AppHeaderProps) {
  const router = useRouter();
  const { user } = authStore();
  const { mobileOpen, setMobileOpen, hamburgerRef } = useAppShell();

  const handleLogout = () => {
    authStore.getState().logout("manual");
  };

  const userMenuItems: DropdownMenuItem[] = [
    {
      id: "settings",
      label: "Settings",
      icon: <Settings size={14} />,
      onClick: () => router.push("/app/settings"),
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
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-surface/80 backdrop-blur">
      <div className="flex items-center justify-between gap-4 px-4 py-2.5">
        {/* Left: hamburger — mobile only, hidden on desktop */}
        <div className="flex items-center md:hidden">
          <button
            ref={hamburgerRef}
            type="button"
            className="rounded p-1.5 text-slate-600 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Center: global search — hidden on xs, shown md+ */}
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
              className="w-full rounded-lg border border-slate-200 bg-white pl-8 pr-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="Search…"
            />
          </div>
        </div>

        {/* Right: Cmd+K, messages, notifications, user dropdown */}
        <div className="flex items-center gap-2">
          {onOpenCommandPalette && (
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-500 hover:bg-surface-raised hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 md:inline-flex"
              aria-label="Open command palette"
            >
              <Command size={14} />
              <kbd className="font-sans">K</kbd>
            </button>
          )}

          <Link
            href="/app/messages"
            className="rounded-full p-2 text-slate-500 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand-500"
            aria-label="Messages"
          >
            <MessageSquare size={18} />
          </Link>

          <Link
            href="/app/notifications"
            className="rounded-full p-2 text-slate-500 hover:bg-surface-raised focus:outline-none focus:ring-2 focus:ring-brand-500"
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
                <span className="hidden max-w-[8rem] truncate text-xs font-medium text-slate-700 sm:block">
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
