"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserX, UserCheck, FileText, CreditCard, Wrench } from "lucide-react";
import {
  fetchTenant, deactivateTenant, reactivateTenant,
  fetchTenantLeases, fetchTenantPayments, fetchTenantMaintenance,
} from "@/services/tenants/tenantApiService";
import type {
  TenantDetailRow, LeaseHistoryRow, PaymentHistoryRow, MaintenanceHistoryRow,
} from "@/services/tenants/tenantApiService";

/* ── Tab types ── */
type TabKey = "profile" | "leases" | "payments" | "maintenance";
const TABS: { key: TabKey; label: string }[] = [
  { key: "profile", label: "Profile" },
  { key: "leases", label: "Leases" },
  { key: "payments", label: "Payments" },
  { key: "maintenance", label: "Maintenance" },
];

/* ── Owner / Admin Detail with Tabs ── */
function OwnerTenantDetail() {
  const { id } = useParams<{ id: string }>();
  const [tenant, setTenant] = useState<TenantDetailRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("profile");
  const [actionLoading, setActionLoading] = useState(false);

  // History state
  const [leases, setLeases] = useState<LeaseHistoryRow[]>([]);
  const [payments, setPayments] = useState<PaymentHistoryRow[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceHistoryRow[]>([]);
  const [tabLoading, setTabLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchTenant(id);
        if (!cancelled) setTenant(res.data);
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  useEffect(() => {
    if (activeTab === "profile" || !tenant) return;
    let cancelled = false;
    setTabLoading(true);
    const promise =
      activeTab === "leases" ? fetchTenantLeases(id).then((r) => !cancelled && setLeases(r.data))
      : activeTab === "payments" ? fetchTenantPayments(id).then((r) => !cancelled && setPayments(r.data))
      : fetchTenantMaintenance(id).then((r) => !cancelled && setMaintenance(r.data));
    promise.catch(() => {}).finally(() => !cancelled && setTabLoading(false));
    return () => { cancelled = true; };
  }, [activeTab, id, tenant]);

  async function handleDeactivate() {
    if (!confirm("Deactivate this tenant? They will lose access.")) return;
    setActionLoading(true);
    try {
      const res = await deactivateTenant(id);
      setTenant(res.data);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  }

  async function handleReactivate() {
    setActionLoading(true);
    try {
      const res = await reactivateTenant(id);
      setTenant(res.data);
    } catch (e: any) { alert(e.message); }
    finally { setActionLoading(false); }
  }

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-48" /><Skeleton variant="text" className="h-32 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!tenant) return null;

  const statusVariant = tenant.status === "ACTIVE" ? "success" : tenant.status === "DEACTIVATED" ? "danger" : "neutral";

  return (
    <>
      <div className="flex items-start justify-between">
        <PageHeader
          title={tenant.name}
          description={[
            tenant.email,
            tenant.unit_number && `Unit ${tenant.unit_number}`,
            tenant.property_name,
          ].filter(Boolean).join(" · ")}
        />
        <div className="flex items-center gap-2 pt-1">
          {tenant.status === "ACTIVE" ? (
            <Button variant="danger" icon={<UserX size={14} />} onClick={handleDeactivate} disabled={actionLoading}>
              Deactivate
            </Button>
          ) : tenant.status === "DEACTIVATED" ? (
            <Button variant="primary" icon={<UserCheck size={14} />} onClick={handleReactivate} disabled={actionLoading}>
              Reactivate
            </Button>
          ) : null}
        </div>
      </div>

      {/* Tabs */}
      <div className="mt-4 flex border-b border-slate-200">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-b-2 border-blue-600 text-blue-600"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="mt-4">
        {activeTab === "profile" && (
          <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Status:</span>
              <Badge variant={statusVariant}>{tenant.status}</Badge>
            </div>
            {tenant.phone && <p className="text-sm text-slate-600">Phone: {tenant.phone}</p>}
            {tenant.emergency_contact && <p className="text-sm text-slate-600">Emergency contact: {tenant.emergency_contact}</p>}
            {tenant.move_in_date && <p className="text-sm text-slate-600">Move-in: {new Date(tenant.move_in_date).toLocaleDateString()}</p>}
            {tenant.move_out_date && <p className="text-sm text-slate-600">Move-out: {new Date(tenant.move_out_date).toLocaleDateString()}</p>}
            {tenant.notes && <p className="text-sm text-slate-600">Notes: {tenant.notes}</p>}
            {tenant.lease_status && (
              <div className="pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-400 mb-1">Current Lease</p>
                <div className="flex items-center gap-2">
                  <Badge variant={tenant.lease_status === "ACTIVE" ? "success" : "neutral"}>{tenant.lease_status}</Badge>
                  {tenant.monthly_rent != null && <span className="text-sm text-slate-600">${(tenant.monthly_rent / 100).toLocaleString()}/mo</span>}
                </div>
                {tenant.start_date && tenant.end_date && (
                  <p className="text-xs text-slate-500 mt-1">{new Date(tenant.start_date).toLocaleDateString()} — {new Date(tenant.end_date).toLocaleDateString()}</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "leases" && (
          tabLoading ? <Skeleton variant="text" className="h-20 w-full rounded-lg" /> :
          leases.length === 0 ? <EmptyState icon={<FileText size={36} strokeWidth={1.5} />} title="No lease history" description="This tenant has no leases on record." /> : (
            <div className="space-y-2">
              {leases.map((l) => (
                <div key={l.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{l.property_name} · Unit {l.unit_number}</p>
                      <p className="text-xs text-slate-500">{new Date(l.start_date).toLocaleDateString()} — {new Date(l.end_date).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={l.status === "ACTIVE" ? "success" : "neutral"}>{l.status}</Badge>
                      <p className="text-xs text-slate-500 mt-1">${((l.rent_amount || l.monthly_rent || 0) / 100).toLocaleString()}/mo</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "payments" && (
          tabLoading ? <Skeleton variant="text" className="h-20 w-full rounded-lg" /> :
          payments.length === 0 ? <EmptyState icon={<CreditCard size={36} strokeWidth={1.5} />} title="No payment history" description="No payments found for this tenant." /> : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
                  <div>
                    <p className="text-sm font-medium text-slate-900">${(p.amount / 100).toLocaleString()}</p>
                    <p className="text-xs text-slate-500">{new Date(p.created_at).toLocaleDateString()} · {p.method || "N/A"}</p>
                  </div>
                  <Badge variant={p.status === "SUCCEEDED" ? "success" : p.status === "FAILED" ? "danger" : "neutral"}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === "maintenance" && (
          tabLoading ? <Skeleton variant="text" className="h-20 w-full rounded-lg" /> :
          maintenance.length === 0 ? <EmptyState icon={<Wrench size={36} strokeWidth={1.5} />} title="No maintenance requests" description="No work orders found for this tenant." /> : (
            <div className="space-y-2">
              {maintenance.map((m) => (
                <div key={m.id} className="rounded-lg border border-slate-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{m.category}</p>
                      <p className="text-xs text-slate-500">{m.description?.slice(0, 80)}{(m.description?.length ?? 0) > 80 ? "…" : ""}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant={m.status === "RESOLVED" || m.status === "CLOSED" ? "success" : m.status === "OPEN" ? "warning" : "info"}>{m.status}</Badge>
                      <p className="text-xs text-slate-500 mt-1">{m.priority} · {new Date(m.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>
    </>
  );
}

export default function Page() {
  return <OwnerTenantDetail />;
}
