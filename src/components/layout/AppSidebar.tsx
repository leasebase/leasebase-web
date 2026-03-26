"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X, ChevronRight } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { groupNavForPersona, type NavGroup } from "@/lib/appNav";
import { Tooltip } from "@/components/ui/Tooltip";
import { Logo } from "@/components/Logo";
import { useAppShell } from "./AppShell";
import { SidebarNavItem } from "./SidebarNavItem";
import { apiRequest } from "@/lib/api/client";

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
  // Flatten all groups into a single list (no section headers per Figma)
  const allItems = groups.flatMap((g) => g.items);
  return (
    <ul className="space-y-1 text-sm">
      {allItems.map((item) => (
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
  );
}

/* ─── Tenant unit info (lightweight fetch) ─── */

interface TenantUnitInfo {
  propertyName: string;
  unitNumber: string;
}

function useTenantUnitInfo(isTenant: boolean): TenantUnitInfo | null {
  const [info, setInfo] = useState<TenantUnitInfo | null>(null);

  useEffect(() => {
    if (!isTenant) return;
    apiRequest<{ data: Array<{ property_name?: string | null; unit_number?: string | null; status: string }> }>({
      path: "api/tenants/me/leases",
    })
      .then((res) => {
        const leases = res.data ?? [];
        const active = leases.find((l) => l.status === "ACTIVE" || l.status === "EXTENDED") ?? leases[0];
        if (active) {
          setInfo({
            propertyName: active.property_name || "Property",
            unitNumber: active.unit_number || "—",
          });
        }
      })
      .catch(() => {});
  }, [isTenant]);

  return info;
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
  const isTenant = user?.persona === "tenant";
  const tenantUnit = useTenantUnitInfo(isTenant);

  return (
    <>
      {/* ─── Desktop sidebar ─── */}
      <nav
        className={`hidden shrink-0 flex-col border-r border-slate-200 bg-white transition-[width] duration-200 ease-in-out md:flex ${
          sidebarCollapsed ? "w-[72px]" : "w-[260px]"
        }`}
        aria-label="Primary navigation"
      >
        {/* Branding */}
        <div
          className={`flex h-16 items-center border-b border-slate-100 px-4 ${
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
        <div className="flex-1 overflow-y-auto px-3 py-4">
          <SidebarNavGroups
            groups={groups}
            pathname={pathname}
            collapsed={sidebarCollapsed}
          />
        </div>

        {/* Footer: tenant unit info + user avatar */}
        <div className="border-t border-slate-100 px-3 py-2.5 bg-slate-50/50">
          {sidebarCollapsed ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="flex w-full items-center justify-center rounded-lg px-2.5 py-2 text-xs text-slate-500 hover:bg-surface-raised hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
              aria-label="Expand sidebar"
            >
              <PanelLeftOpen size={16} />
            </button>
          ) : (
            <>
              {/* Tenant unit info card */}
              {isTenant && tenantUnit && (
                <div className="mb-2 px-3 py-2.5 bg-slate-50 rounded-xl">
                  <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Your Unit</p>
                  <p className="text-[13px] font-semibold text-slate-900">{tenantUnit.propertyName}</p>
                  <p className="text-[12px] text-slate-600">Unit {tenantUnit.unitNumber}</p>
                </div>
              )}
              {/* User avatar + name */}
              <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 flex items-center justify-center ring-2 ring-white shadow-sm">
                  <span className="text-[11px] font-bold text-slate-600">
                    {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "?"}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-slate-900 truncate">{user?.name || "User"}</p>
                  <p className="text-[11px] text-slate-500 truncate">{user?.persona === "owner" ? "Owner" : "Tenant"}</p>
                </div>
              </div>
            </>
          )}
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
            className="fixed inset-y-0 left-0 z-50 flex w-[260px] flex-col overflow-y-auto border-r border-slate-200 bg-white md:hidden"
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
