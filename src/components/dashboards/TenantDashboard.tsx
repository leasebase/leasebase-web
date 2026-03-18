"use client";

import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import type { TenantDashboardData, TenantDashboardViewModel } from "@/services/tenant/types";
import { fetchTenantDashboard } from "@/services/tenant/tenantDashboardService";
import { toTenantDashboardViewModel } from "@/services/tenant/viewModel";
import { WidgetErrorBoundary } from "./owner/WidgetErrorBoundary";
import { TenantDashboardSkeleton } from "./tenant/TenantDashboardSkeleton";
import { TenantEmptyState } from "./tenant/TenantEmptyState";
import { TenantWelcomeBanner } from "./tenant/TenantWelcomeBanner";
import { CustomizeDashboard } from "./CustomizeDashboard";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { deriveTenantInsights } from "@/lib/intelligence/deriveActions";
import { TENANT_WIDGETS } from "@/lib/dashboard/tenantWidgets";
import { mergePreferences, type ResolvedWidget } from "@/lib/dashboard/widgetRegistry";
import { loadPreferences } from "@/lib/dashboard/preferences";
import { LeaseContextSelector } from "@/components/tenant/LeaseContextSelector";

export function TenantDashboard() {
  const [data, setData] = useState<TenantDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [widgets, setWidgets] = useState<ResolvedWidget[]>(() =>
    mergePreferences(TENANT_WIDGETS, []),
  );

  // Load saved preferences on mount (after hydration)
  useEffect(() => {
    const saved = loadPreferences("tenant");
    if (saved.length > 0) {
      setWidgets(mergePreferences(TENANT_WIDGETS, saved));
    }
  }, []);

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

  // Build registry-driven widget elements
  const enabledWidgets = widgets.filter((w) => w.enabled);
  const widgetElements: JSX.Element[] = [];
  let idx = 0;

  while (idx < enabledWidgets.length) {
    const w = enabledWidgets[idx];
    const Component = w.definition.component;
    const vmProp = w.definition.vmKey
      ? (vm as unknown as Record<string, unknown>)[w.definition.vmKey]
      : undefined;

    // Pair consecutive half-size widgets into a 2-col grid
    if (
      w.size === "half" &&
      idx + 1 < enabledWidgets.length &&
      enabledWidgets[idx + 1].size === "half"
    ) {
      const next = enabledWidgets[idx + 1];
      const NextComponent = next.definition.component;
      const nextVmProp = next.definition.vmKey
        ? (vm as unknown as Record<string, unknown>)[next.definition.vmKey]
        : undefined;

      widgetElements.push(
        <div key={`pair-${w.definition.id}`} className="grid gap-6 lg:grid-cols-2">
          <WidgetErrorBoundary name={w.definition.title} variant="dark">
            <Component vm={vmProp} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary name={next.definition.title} variant="dark">
            <NextComponent vm={nextVmProp} />
          </WidgetErrorBoundary>
        </div>,
      );
      idx += 2;
    } else {
      widgetElements.push(
        <WidgetErrorBoundary key={w.definition.id} name={w.definition.title} variant="dark">
          <Component vm={vmProp} />
        </WidgetErrorBoundary>,
      );
      idx += 1;
    }
  }

  return (
    <section aria-labelledby="tenant-heading" className="space-y-6">
      <PageHeader
        title="Tenant dashboard"
        description="Check your rent status, lease details, and maintenance requests."
        actions={
          <div className="flex items-center gap-3">
            <LeaseContextSelector />
            <Button
              variant="secondary"
              size="sm"
              icon={<Settings2 size={14} />}
              onClick={() => setCustomizeOpen(true)}
            >
              Customize
            </Button>
          </div>
        }
      />

      {/* Welcome banner (first 7 days after invitation acceptance) */}
      {data.profile && (
        <TenantWelcomeBanner
          userId={data.profile.user_id}
          profileCreatedAt={data.profile.created_at}
        />
      )}

      {/* Hero: Balance due + Pay Rent CTA */}
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

      {/* Insights (fixed) */}
      <WidgetErrorBoundary name="Recommended Actions" variant="dark">
        <RecommendedActions insights={tenantInsights} title="Insights" />
      </WidgetErrorBoundary>

      {/* Registry-driven configurable widgets */}
      {widgetElements}

      {/* Customization modal */}
      <CustomizeDashboard
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        role="tenant"
        widgets={widgets}
        onSave={setWidgets}
      />
    </section>
  );
}
