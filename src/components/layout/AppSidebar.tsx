"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { groupNavForPersona, type NavGroup } from "@/lib/appNav";
import { Avatar } from "@/components/ui/Avatar";
import { Tooltip } from "@/components/ui/Tooltip";
import { useShell } from "./AppShell";
import { SidebarNavItem } from "./SidebarNavItem";

/* ─── Nav group list ─── */

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
              className="mx-auto my-1 h-px w-6 bg-slate-800"
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
  } = useShell();

  const groups = groupNavForPersona(user?.persona);

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <nav
        className={`hidden md:flex flex-col shrink-0 border-r border-slate-800 bg-slate-900/50 transition-[width] duration-200 ease-in-out ${
          sidebarCollapsed ? "w-[72px]" : "w-[240px]"
        }`}
        aria-label="Primary navigation"
      >
        {/* Branding */}
        <div
          className={`flex items-center border-b border-slate-800 px-3 py-3 ${
            sidebarCollapsed ? "justify-center" : "gap-2.5"
          }`}
        >
          <Link href="/app" className="flex items-center gap-2.5 shrink-0">
            <span
              className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm shadow-sm"
              aria-hidden="true"
            >
              LB
            </span>
            {!sidebarCollapsed && (
              <span className="text-sm font-semibold tracking-wide text-slate-100">
                Leasebase
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

        {/* Footer: user info + collapse toggle */}
        <div className="border-t border-slate-800 px-2 py-2 space-y-1">
          {/* User mini-profile */}
          {user && (
            <div
              className={`flex items-center rounded-lg px-2 py-1.5 ${
                sidebarCollapsed ? "justify-center" : "gap-2.5"
              }`}
            >
              {sidebarCollapsed ? (
                <Tooltip content={user.name || user.email || "User"}>
                  <Avatar name={user.name || user.email} size="xs" />
                </Tooltip>
              ) : (
                <>
                  <Avatar name={user.name || user.email} size="xs" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-slate-200">
                      {user.name || user.email}
                    </p>
                    <p className="truncate text-[10px] text-slate-500 capitalize">
                      {user.persona
                        ?.replace(/([A-Z])/g, " $1")
                        .trim() || ""}
                    </p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={toggleSidebar}
            className={`flex w-full items-center rounded-lg px-2.5 py-2 text-xs text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 ${
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
            className="fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 border-r border-slate-800 overflow-y-auto md:hidden flex flex-col"
            aria-label="Primary navigation"
          >
            {/* Mobile header */}
            <div className="flex items-center justify-between border-b border-slate-800 px-3 py-3">
              <Link href="/app" className="flex items-center gap-2.5">
                <span
                  className="h-8 w-8 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold text-sm"
                  aria-hidden="true"
                >
                  LB
                </span>
                <span className="text-sm font-semibold text-slate-100">
                  Leasebase
                </span>
              </Link>
              <button
                type="button"
                onClick={closeMobile}
                className="rounded p-1 text-slate-400 hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
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
