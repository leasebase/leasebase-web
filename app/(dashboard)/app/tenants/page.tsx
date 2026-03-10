"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { Users, Plus, Mail } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchPMTenants } from "@/services/pm/pmApiService";
import type { PMTenantListRow } from "@/services/pm/pmApiService";
import type { PMPaginationMeta } from "@/services/pm/types";
import { InviteTenantModal } from "@/components/invitations/InviteTenantModal";

function PMTenantsPage() {
  const [tenants, setTenants] = useState<PMTenantListRow[]>([]);
  const [meta, setMeta] = useState<PMPaginationMeta | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteOpen, setInviteOpen] = useState(false);

  function loadTenants() {
    setIsLoading(true);
    fetchPMTenants()
      .then((res) => { setTenants(res.data); setMeta(res.meta); })
      .catch((e: any) => setError(e.message))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => { loadTenants(); }, []);

  return (
    <>
      <PageHeader title="Tenants" description="Tenants across your assigned properties." />
      <div className="mt-4 flex items-center gap-2">
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setInviteOpen(true)}>
          Invite Tenant
        </Button>
        <Link href="/app/tenants/invitations">
          <Button variant="secondary" icon={<Mail size={16} />}>Invitations</Button>
        </Link>
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
            description="No tenants found. Invite your first tenant to get started."
            action={
              <Button variant="primary" icon={<Plus size={16} />} onClick={() => setInviteOpen(true)}>Invite Tenant</Button>
            }
          />
        ) : (
          <div className="space-y-2">
            {tenants.map((t) => (
              <Link key={t.id} href={`/app/tenants/${t.id}`}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-200">
                <div>
                  <p className="text-sm font-medium text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-400">{t.email} · Unit {t.unit_number} · {t.property_name}</p>
                </div>
                {t.phone && <span className="text-xs text-slate-500">{t.phone}</span>}
              </Link>
            ))}
            {meta && meta.total > 0 && <p className="text-xs text-slate-500 text-center pt-2">Showing {tenants.length} of {meta.total}</p>}
          </div>
        )}
      </div>
      <InviteTenantModal open={inviteOpen} onClose={() => setInviteOpen(false)} onSuccess={loadTenants} />
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  const [inviteOpen, setInviteOpen] = useState(false);
  if (user?.persona === "propertyManager") return <PMTenantsPage />;
  return (
    <>
      <PageHeader title="Tenants" description="Manage tenant records, contacts, and lease associations." />
      <div className="mt-4 flex items-center gap-2">
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setInviteOpen(true)}>
          Invite Tenant
        </Button>
        <Link href="/app/tenants/invitations">
          <Button variant="secondary" icon={<Mail size={16} />}>Invitations</Button>
        </Link>
      </div>
      <EmptyState
        icon={<Users size={48} strokeWidth={1.5} />}
        title="No tenants yet"
        description="Invite your first tenant to manage contacts and lease associations."
        action={
          <Button variant="primary" icon={<Plus size={16} />} onClick={() => setInviteOpen(true)}>Invite Tenant</Button>
        }
        className="mt-8"
      />
      <InviteTenantModal open={inviteOpen} onClose={() => setInviteOpen(false)} />
    </>
  );
}
