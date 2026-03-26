"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Users, Search, Mail, Phone, MapPin, User, Filter, Plus } from "lucide-react";
import { fetchTenants } from "@/services/tenants/tenantApiService";
import type { TenantListRow, PaginationMeta } from "@/services/tenants/tenantApiService";

/* ─── Status badge helper (aligned with backend tenant_status_enum) ─── */
const STATUS_BADGE: Record<string, { variant: "success" | "info" | "warning" | "danger" | "neutral"; label: string }> = {
  ACTIVE:   { variant: "success", label: "Active" },
  JOINED:   { variant: "info",    label: "Joined" },
  INVITED:  { variant: "warning", label: "Invited" },
  INACTIVE: { variant: "danger",  label: "Inactive" },
};

function statusBadge(status: string) {
  const cfg = STATUS_BADGE[status] ?? { variant: "neutral" as const, label: status };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

/* ─── UIUX Tenant card component ─── */
function TenantCard({ t }: { t: TenantListRow }) {
  const initials = t.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const inner = (
    <>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-sm">
            <span className="text-[13px] font-bold text-white">{initials}</span>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[14px] font-semibold text-slate-900 truncate group-hover:text-blue-600 transition-colors">
              {t.name}
            </h3>
            <p className="text-[12px] text-slate-500 font-medium">
              {t.unit_number ? `Unit ${t.unit_number}` : "No unit"}
            </p>
          </div>
        </div>
        {statusBadge(t.status)}
      </div>

      <div className="space-y-2.5 mb-5">
        {t.property_name && (
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
            <MapPin className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span className="truncate">{t.property_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
          <Mail className="w-4 h-4 flex-shrink-0 text-slate-400" />
          <span className="truncate">{t.email}</span>
        </div>
        {t.phone && (
          <div className="flex items-center gap-2.5 text-[13px] text-slate-600">
            <Phone className="w-4 h-4 flex-shrink-0 text-slate-400" />
            <span>{t.phone}</span>
          </div>
        )}
      </div>

      {t.lease_status && (
        <div className="pt-5 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-slate-500 font-medium">Lease Status</span>
            <Badge variant={t.lease_status === "ACTIVE" ? "success" : t.lease_status === "DRAFT" ? "warning" : "neutral"}>
              {t.lease_status}
            </Badge>
          </div>
        </div>
      )}
    </>
  );

  if (t.source_type === "INVITATION") {
    return (
      <div className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group">
        {inner}
      </div>
    );
  }

  return (
    <Link
      href={`/app/tenants/${t.id}`}
      className="bg-white rounded-xl border border-slate-200/80 p-6 hover:border-slate-300 hover:shadow-lg hover:shadow-slate-200/50 transition-all duration-300 group block"
    >
      {inner}
    </Link>
  );
}

/* ─── Owner / Admin Tenants ─── */
function OwnerTenantsPage() {
  const [tenants, setTenants] = useState<TenantListRow[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const loadTenants = useCallback(() => {
    setIsLoading(true);
    fetchTenants({ search: search || undefined, status: statusFilter || undefined })
      .then((res) => { setTenants(res.data); setMeta(res.meta); })
      .catch((e: any) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [search, statusFilter]);

  useEffect(() => { loadTenants(); }, [loadTenants]);

  const activeCount = tenants.filter((t) => t.status === "ACTIVE").length;
  const invitedCount = tenants.filter((t) => t.status === "INVITED").length;

  return (
    <>
      <PageHeader
        title="Tenants"
        description={`${activeCount} active \u00b7 ${invitedCount} invited`}
        actions={
          <Link href="/app/tenants/invitations">
            <Button variant="secondary" size="sm" icon={<Mail size={14} />}>Manage Invitations</Button>
          </Link>
        }
      />

      {/* Filters — UIUX style */}
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
        >
          <option value="">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="JOINED">Joined</option>
          <option value="INVITED">Invited</option>
          <option value="INACTIVE">Inactive</option>
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all"
          />
        </div>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-slate-200 bg-white p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-slate-200" />
                  <div className="flex-1"><div className="h-3 w-24 rounded bg-slate-200" /><div className="mt-2 h-2 w-16 rounded bg-slate-200" /></div>
                </div>
                <div className="space-y-2"><div className="h-2 w-full rounded bg-slate-100" /><div className="h-2 w-3/4 rounded bg-slate-100" /></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">{error}</div>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="No tenants"
            description={search || statusFilter ? "No tenants match your search or filter." : "Create a new lease to invite your first tenant."}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {tenants.map((t) => <TenantCard key={t.id} t={t} />)}
            </div>
            {meta && meta.total > tenants.length && (
              <p className="text-xs text-slate-500 text-center pt-4">Showing {tenants.length} of {meta.total}</p>
            )}
          </>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <OwnerTenantsPage />;
}
