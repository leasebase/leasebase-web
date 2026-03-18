"use client";

import { useEffect, useState } from "react";
import { ChevronDown, Building2 } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { apiRequest } from "@/lib/api/client";

export interface LeaseContext {
  id: string;
  organization_id: string;
  organization_name: string | null;
  property_name: string | null;
  property_address: string | null;
  unit_number: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
}

/**
 * Lease context selector for multi-lease tenants.
 *
 * Only renders when the tenant has leases in 2+ orgs.
 * Shows a dropdown allowing the tenant to switch their active org context.
 */
export function LeaseContextSelector() {
  const [leases, setLeases] = useState<LeaseContext[]>([]);
  const [open, setOpen] = useState(false);

  const user = authStore((s) => s.user);
  const selectedOrgId = authStore((s) => s.selectedOrgId);
  const setSelectedOrg = authStore((s) => s.setSelectedOrg);

  useEffect(() => {
    if (!user || user.role !== "TENANT") return;

    apiRequest<{ data: LeaseContext[] }>({ path: "api/tenants/me/leases" })
      .then((res) => setLeases(res.data ?? []))
      .catch(() => setLeases([]));
  }, [user]);

  // Only show if tenant has leases in multiple orgs
  const orgIds = [...new Set(leases.map((l) => l.organization_id))];
  if (orgIds.length < 2) return null;

  const activeLease = leases.find((l) => l.organization_id === selectedOrgId);
  const label = activeLease
    ? `${activeLease.property_name ?? "Property"}${activeLease.unit_number ? ` — Unit ${activeLease.unit_number}` : ""}`
    : "Select lease";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
      >
        <Building2 size={14} className="text-brand-400" />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-[260px] rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
          {leases.map((lease) => {
            const isActive = lease.organization_id === selectedOrgId;
            return (
              <button
                key={lease.id}
                type="button"
                onClick={() => {
                  setSelectedOrg(lease.organization_id);
                  setOpen(false);
                  // Force dashboard refresh by reloading
                  window.location.reload();
                }}
                className={`flex w-full items-start gap-3 px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800 ${
                  isActive ? "bg-slate-800/50 text-brand-300" : "text-slate-400"
                }`}
              >
                <Building2 size={14} className={isActive ? "text-brand-400" : "text-slate-600"} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-200 truncate">
                    {lease.property_name ?? "Property"}
                    {lease.unit_number ? ` — Unit ${lease.unit_number}` : ""}
                  </p>
                  <p className="text-slate-500 truncate">
                    {lease.organization_name ?? lease.organization_id}
                  </p>
                </div>
                {isActive && (
                  <span className="shrink-0 rounded bg-brand-500/20 px-1.5 py-0.5 text-[10px] font-semibold text-brand-300">
                    Active
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
