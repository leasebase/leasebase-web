"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { TenantDashboardData, TenantDashboardViewModel } from "@/services/tenant/types";
import { fetchTenantDashboard } from "@/services/tenant/tenantDashboardService";
import { toTenantDashboardViewModel } from "@/services/tenant/viewModel";
import { WidgetErrorBoundary } from "./owner/WidgetErrorBoundary";
import { TenantDashboardSkeleton } from "./tenant/TenantDashboardSkeleton";
import { TenantEmptyState } from "./tenant/TenantEmptyState";
import { TenantKpiHeader } from "./tenant/TenantKpiHeader";
import { TenantActionCards } from "./tenant/TenantActionCards";
import { TenantPaymentsWidget } from "./tenant/TenantPaymentsWidget";
import { TenantMaintenanceWidget } from "./tenant/TenantMaintenanceWidget";
import { TenantDocumentsWidget } from "./tenant/TenantDocumentsWidget";
import { TenantNotificationsWidget } from "./tenant/TenantNotificationsWidget";

export function TenantDashboard() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchTenantDashboard();
        if (!cancelled) setData(result);
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to load dashboard");
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <TenantDashboardSkeleton />;

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Tenant dashboard"
          description="Check your rent status, lease details, and maintenance requests."
        />
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6 text-center text-sm text-red-300">
          {error}
        </div>
      </section>
    );
  }

  if (!data) return null;

  // Show progressive empty state for non-active setup stages
  if (data.setupStage !== "active") {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Tenant dashboard"
          description="Check your rent status, lease details, and maintenance requests."
        />
        <TenantEmptyState stage={data.setupStage} />
      </section>
    );
  }

  const vm: TenantDashboardViewModel = toTenantDashboardViewModel(data);

  return (
    <section aria-labelledby="tenant-heading" className="space-y-6">
      <PageHeader
        title="Tenant dashboard"
        description="Check your rent status, lease details, and maintenance requests."
      />

      <WidgetErrorBoundary name="KPI Header">
        <TenantKpiHeader vm={vm.kpiHeader} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Quick Actions">
        <TenantActionCards vm={vm.actionCards} />
      </WidgetErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetErrorBoundary name="Payments">
          <TenantPaymentsWidget vm={vm.payments} />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="Maintenance">
          <TenantMaintenanceWidget vm={vm.maintenance} />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="Documents">
          <TenantDocumentsWidget vm={vm.documents} />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="Notifications">
          <TenantNotificationsWidget vm={vm.notifications} />
        </WidgetErrorBoundary>
      </div>
    </section>
  );
}
