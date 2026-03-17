"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { groupNavForPersona, type NavGroup } from "@/lib/appNav";
import { Tooltip } from "@/components/ui/Tooltip";
import { Logo } from "@/components/Logo";
import { useAppShell } from "./AppShell";
import { SidebarNavItem } from "./SidebarNavItem";

/* ─── Nav group list (shared desktop / mobile) ─── */

function SidebarNavGroups({
  groups,
  pathname,
  collapsed,
  onItemClick,
}: {
  groups: NavGroup[];
  pathname: string;
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
            <div
              className="mx-auto my-1 h-px w-6 bg-slate-200"
              aria-hidden="true"
            />
          )}
          <ul className="space-y-0.5 text-sm">
            {group.items.map((item) => (
              <SidebarNavItem
                key={item.path}
                path={item.path}
                label={item.label}
                icon={item.icon}
                active={pathname === item.path}
                collapsed={collapsed}
                onClick={onItemClick}
              />
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ─── AppSidebar ─── */

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = authStore();
  const {
    sidebarCollapsed,
    toggleSidebar,
    mobileOpen,
    closeMobile,
  } = useAppShell();

  const groups = groupNavForPersona(user?.persona);

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <nav
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-surface transition-[width] duration-200 ease-in-out md:flex ${
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
        aria-label="Primary navigation"
      >
        {/* Branding */}
        <div
          className={`flex items-center border-b border-slate-200 px-3 py-3 ${
            sidebarCollapsed ? "justify-center" : "gap-2.5"
          }`}
        >
          <Link href="/app" className="flex shrink-0 items-center gap-2.5">
            <Logo variant="mark" theme="light" size={32} />
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold tracking-wide text-slate-800">
                LeaseBase
              </span>
            )}
          </Link>
        </div>

        {/* Nav items */}
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <SidebarNavGroups
            groups={groups}
            pathname={pathname}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* Footer: collapse toggle */}
        <div className="border-t border-slate-200 px-2 py-2">
          <button
            type="button"
            onClick={toggleSidebar}
            className={`flex w-full items-center rounded-lg px-2.5 py-2 text-xs text-slate-500 transition-colors hover:bg-surface-raised hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
              sidebarCollapsed ? "justify-center" : "gap-2"
            }`}
            aria-label={
              sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen size={16} />
            ) : (
              <>
                <PanelLeftClose size={16} />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </nav>

      {/* ─── Mobile drawer ─── */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
            onClick={closeMobile}
            aria-hidden="true"
          />
          <nav
            className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col overflow-y-auto border-r border-slate-200 bg-surface md:hidden"
            aria-label="Primary navigation"
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
              <Link href="/app" className="flex items-center gap-2.5">
                <Logo variant="mark" theme="light" size={32} />
                <span className="text-sm font-semibold text-slate-800">
                  LeaseBase
                </span>
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded p-1 text-slate-400 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
                aria-label="Close navigation"
              >
                <X size={18} />
              </button>
            </div>

            {/* Mobile nav */}
            <div className="flex-1 px-3 py-4">
              <SidebarNavGroups
                groups={groups}
                pathname={pathname}
                collapsed={false}
                onItemClick={closeMobile}
              />
            </div>
          </nav>
        </>
      )}
    </>
  );
}
