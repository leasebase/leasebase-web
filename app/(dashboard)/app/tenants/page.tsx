"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Users, Search, Mail } from "lucide-react";
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

/* ─── Tenant row component ─── */
function TenantRow({ t }: { t: TenantListRow }) {
  const inner = (
    <>
      <div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-900">{t.name}</p>
          {statusBadge(t.status)}
        </div>
        <p className="text-xs text-slate-400 mt-0.5">
          {t.email}
          {t.unit_number && ` · Unit ${t.unit_number}`}
          {t.property_name && ` · ${t.property_name}`}
        </p>
      </div>
      <div className="text-right text-xs text-slate-500">
        {t.phone && <p>{t.phone}</p>}
        {t.lease_status && <p className="mt-0.5">Lease: {t.lease_status}</p>}
      </div>
    </>
  );

  // Invited rows (from invitations) cannot navigate to the TenantProfile detail page.
  if (t.source_type === "INVITATION") {
    return (
      <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/app/tenants/${t.id}`}
      className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
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

  return (
    <>
      <PageHeader title="Tenants" description="Manage tenant records, contacts, and lease associations." />
      {/* Actions */}
      <div className="mt-4 flex items-center gap-2">
        <Link href="/app/tenants/invitations">
          <Button variant="ghost" size="sm" icon={<Mail size={14} />}>Manage Invitations</Button>
        </Link>
      </div>
      {/* Search & Filter */}
      <div className="mt-3 flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-md border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none"
        >
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="JOINED">Joined</option>
          <option value="INVITED">Invited</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" className="h-14 w-full rounded-md" />)}</div>
        ) : error ? (
          <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : tenants.length === 0 ? (
          <EmptyState
            icon={<Users size={48} strokeWidth={1.5} />}
            title="No tenants"
            description={search || statusFilter ? "No tenants match your search or filter." : "Create a new lease to invite your first tenant."}
          />
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => <TenantRow key={t.id} t={t} />)}
            {meta && meta.total > 0 && <p className="text-xs text-slate-500 text-center pt-2">Showing {tenants.length} of {meta.total}</p>}
          </div>
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <OwnerTenantsPage />;
}
