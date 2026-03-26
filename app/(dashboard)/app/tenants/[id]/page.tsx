"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { UserX, UserCheck, FileText, CreditCard, Wrench, AlertTriangle, Mail, Phone, MapPin, User, ArrowLeft, Calendar } from "lucide-react";
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
  const [tabError, setTabError] = useState<string | null>(null);

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
    setTabError(null);
    const promise =
      activeTab === "leases" ? fetchTenantLeases(id).then((r) => !cancelled && setLeases(r.data))
      : activeTab === "payments" ? fetchTenantPayments(id).then((r) => !cancelled && setPayments(r.data))
      : fetchTenantMaintenance(id).then((r) => !cancelled && setMaintenance(r.data));
    promise
      .catch((err) => {
        if (!cancelled) setTabError(err?.message || `Failed to load ${activeTab} data`);
      })
      .finally(() => !cancelled && setTabLoading(false));
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
      {/* Back link */}
      <Link href="/app/tenants" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm mb-4">
        <ArrowLeft className="w-4 h-4" /> Back to Tenants
      </Link>

      {/* Tenant header card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-sm">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-semibold text-gray-900">{tenant.name}</h1>
                <Badge variant={statusVariant}>{tenant.status}</Badge>
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {tenant.property_name && (
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{tenant.property_name}{tenant.unit_number ? ` · Unit ${tenant.unit_number}` : ""}</div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tenant.status === "ACTIVE" ? (
              <Button variant="danger" icon={<UserX size={14} />} onClick={handleDeactivate} disabled={actionLoading}>Deactivate</Button>
            ) : tenant.status === "DEACTIVATED" ? (
              <Button variant="primary" icon={<UserCheck size={14} />} onClick={handleReactivate} disabled={actionLoading}>Reactivate</Button>
            ) : null}
          </div>
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Contact Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Contact Information</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Email</p>
                    <p className="text-gray-900">{tenant.email}</p>
                  </div>
                </div>
                {tenant.phone && (
                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="text-gray-900">{tenant.phone}</p>
                    </div>
                  </div>
                )}
                {tenant.emergency_contact && (
                  <div className="pt-3 border-t border-gray-100">
                    <p className="text-sm text-gray-600 mb-1">Emergency Contact</p>
                    <p className="text-gray-900">{tenant.emergency_contact}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Lease Information */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Lease Information</h2>
              {tenant.lease_status ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Lease Status</p>
                    <Badge variant={tenant.lease_status === "ACTIVE" ? "success" : "neutral"}>{tenant.lease_status}</Badge>
                  </div>
                  {tenant.start_date && tenant.end_date && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Lease Period</p>
                      <div className="flex items-center gap-2 text-gray-900">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{new Date(tenant.start_date).toLocaleDateString()} — {new Date(tenant.end_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                  )}
                  {tenant.monthly_rent != null && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Monthly Rent</p>
                      <p className="text-lg font-semibold text-gray-900">${(tenant.monthly_rent / 100).toLocaleString()}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No active lease</p>
              )}
            </div>

            {/* Additional Info */}
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Details</h2>
              <div className="space-y-4">
                {tenant.move_in_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Move-in Date</p>
                    <p className="text-gray-900">{new Date(tenant.move_in_date).toLocaleDateString()}</p>
                  </div>
                )}
                {tenant.move_out_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Move-out Date</p>
                    <p className="text-gray-900">{new Date(tenant.move_out_date).toLocaleDateString()}</p>
                  </div>
                )}
                {tenant.notes && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Notes</p>
                    <p className="text-gray-900 text-sm">{tenant.notes}</p>
                  </div>
                )}
                {!tenant.move_in_date && !tenant.move_out_date && !tenant.notes && (
                  <p className="text-sm text-gray-400">No additional details</p>
                )}
              </div>
            </div>
          </div>
        )}

        {tabError && !tabLoading && (
          <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertTriangle size={16} className="shrink-0" />
            Unable to load {activeTab} data. Please try again.
          </div>
        )}

        {activeTab === "leases" && !tabError && (
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

        {activeTab === "payments" && !tabError && (
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

        {activeTab === "maintenance" && !tabError && (
          tabLoading ? <Skeleton variant="text" className="h-20 w-full rounded-lg" /> :
          maintenance.length === 0 ? <EmptyState icon={<Wrench size={36} strokeWidth={1.5} />} title="No maintenance requests" description="No work orders found for this tenant." /> : (
            <div className="space-y-2">
              {maintenance.map((m) => (
                <Link
                  key={m.id}
                  href={`/app/maintenance/${m.id}`}
                  className="block rounded-lg border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
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
                </Link>
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
