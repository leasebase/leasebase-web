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
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { deriveTenantInsights } from "@/lib/intelligence/deriveActions";

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

  // Find pay-rent action from action cards
  const payRentAction = vm.actionCards.actions.find((a) => /pay\s*rent/i.test(a.label));
  const tenantInsights = deriveTenantInsights(data);

  return (
    <section aria-labelledby="tenant-heading" className="space-y-6">
      <PageHeader
        title="Tenant dashboard"
        description="Check your rent status, lease details, and maintenance requests."
      />

      {/* ── Hero: Balance due + Pay Rent CTA ── */}
      <div className="rounded-xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/80 to-brand-950/30 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Balance due</p>
            <p className="mt-1 text-3xl font-bold tracking-tight text-slate-50">{vm.kpiHeader.rentAmount}</p>
            {vm.kpiHeader.dueDate !== "\u2014" && (
              <p className="mt-1 text-sm text-slate-400">Due {vm.kpiHeader.dueDate}</p>
            )}
          </div>
          {payRentAction && !payRentAction.disabled && (
            <a
              href={payRentAction.href}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-md transition-colors hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              Pay Rent
            </a>
          )}
        </div>
      </div>

      {/* ── Insights ── */}
      <WidgetErrorBoundary name="Recommended Actions">
        <RecommendedActions insights={tenantInsights} title="Insights" />
      </WidgetErrorBoundary>

      {/* ── Secondary KPIs ── */}
      <WidgetErrorBoundary name="KPI Header">
        <TenantKpiHeader vm={vm.kpiHeader} />
      </WidgetErrorBoundary>

      {/* ── Quick actions (other than Pay Rent which is promoted above) ── */}
      <WidgetErrorBoundary name="Quick Actions">
        <TenantActionCards vm={vm.actionCards} />
      </WidgetErrorBoundary>

      {/* ── Widgets grid ── */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetErrorBoundary name="Maintenance">
          <TenantMaintenanceWidget vm={vm.maintenance} />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="Payments">
          <TenantPaymentsWidget vm={vm.payments} />
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
