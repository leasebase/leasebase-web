"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Wrench, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchTenantMaintenance } from "@/services/tenant/adapters/maintenanceAdapter";
import type { WorkOrderRow } from "@/services/tenant/types";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "warning",
  IN_PROGRESS: "info",
  RESOLVED: "success",
  CLOSED: "neutral",
};

const PRIORITY_VARIANTS: Record<string, "danger" | "warning" | "neutral"> = {
  HIGH: "danger",
  MEDIUM: "warning",
  LOW: "neutral",
};

/**
 * Maintenance — LIVE list for tenant (Phase 2), link to create new.
 * Fetches via GET /api/maintenance/mine (tenant-scoped, server-side filtered).
 */
export default function Page() {
  const { user } = authStore();
  const isTenant = user?.persona === "tenant";
  const [requests, setRequests] = useState<WorkOrderRow[]>([]);
  const [isLoading, setIsLoading] = useState(isTenant);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTenant) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchTenantMaintenance();
        if (!cancelled) {
          setRequests(result.data);
          if (result.source === "unavailable") setError(result.error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isTenant]);

  return (
    <>
      <PageHeader
        title="Maintenance"
        description={
          isTenant
            ? "Submit and track maintenance requests for your unit."
            : "Track maintenance requests, work orders, and vendor assignments."
        }
        actions={
          isTenant ? (
            <Link href="/app/maintenance/new">
              <Button variant="primary" icon={<Plus size={16} />}>
                New Request
              </Button>
            </Link>
          ) : undefined
        }
      />

      {isTenant ? (
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
              {error}
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              icon={<Wrench size={48} strokeWidth={1.5} />}
              title="No maintenance requests"
              description="Submit a request whenever something needs fixing in your unit."
              action={
                <Link href="/app/maintenance/new">
                  <Button variant="primary" icon={<Plus size={16} />}>
                    New Request
                  </Button>
                </Link>
              }
            />
          ) : (
            <div className="space-y-3">
              {requests.map((wo) => (
                <Link
                  key={wo.id}
                  href={`/app/maintenance/${wo.id}`}
                  className="block rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-slate-100 truncate">
                        {wo.description}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {wo.category} · {new Date(wo.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Badge variant={PRIORITY_VARIANTS[wo.priority] || "neutral"}>
                        {wo.priority}
                      </Badge>
                      <Badge variant={STATUS_VARIANTS[wo.status] || "neutral"}>
                        {wo.status.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : user?.persona === "propertyManager" ? (
        <PMMaintenancePage />
      ) : (
        <EmptyState
          icon={<Wrench size={48} strokeWidth={1.5} />}
          title="Coming soon"
          description="Maintenance management is under development."
          className="mt-8"
        />
      )}
    </>
  );
}

function PMMaintenancePage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { fetchPMMaintenance } = await import("@/services/pm/pmApiService");
        const res = await fetchPMMaintenance();
        if (!cancelled) setItems(res.data);
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <div className="mt-6 space-y-2">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />)}</div>;
  if (error) return <div className="mt-6 rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">{error}</div>;
  if (items.length === 0) return <EmptyState icon={<Wrench size={48} strokeWidth={1.5} />} title="No work orders" description="No maintenance requests for your assigned properties." className="mt-6" />;

  return (
    <div className="mt-6 space-y-3">
      {items.map((wo: any) => (
        <Link key={wo.id} href={`/app/maintenance/${wo.id}`}
          className="block rounded-lg border border-slate-800 bg-slate-900 p-4 transition-colors hover:border-slate-700">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-100 truncate">{wo.description}</p>
              <p className="mt-1 text-xs text-slate-400">{wo.property_name} · Unit {wo.unit_number} · {wo.category}</p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Badge variant={PRIORITY_VARIANTS[wo.priority] || "neutral"}>{wo.priority}</Badge>
              <Badge variant={STATUS_VARIANTS[wo.status] || "neutral"}>{wo.status.replace("_", " ")}</Badge>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
