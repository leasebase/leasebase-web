"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { fetchPMDashboard, type PMDashboardFetchResult } from "@/services/pm/pmDashboardService";
import { toPMDashboardViewModel } from "@/services/pm/viewModel";
import type { PMDashboardData, PMDashboardViewModel } from "@/services/pm/types";
import { WidgetErrorBoundary } from "./owner/WidgetErrorBoundary";
import { PMDashboardSkeleton } from "./pm/PMDashboardSkeleton";
import { PMEmptyState } from "./pm/PMEmptyState";
import { PMKpiGrid } from "./pm/PMKpiGrid";
import { PMTasksList } from "./pm/PMTasksList";
import { PMMaintenanceWidget } from "./pm/PMMaintenanceWidget";
import { PriorityActions } from "@/components/ui/PriorityActions";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { WorkflowChecklist } from "@/components/ui/WorkflowChecklist";
import { derivePMPriorityActions, derivePMInsights } from "@/lib/intelligence/deriveActions";
import { pmOnboardingSteps } from "@/lib/intelligence/checklists";

/**
 * PM Dashboard — thin component.
 *
 * All domain transformation lives in the service + viewModel layers.
 * This component only manages fetch lifecycle and delegates rendering
 * to widget sub-components.
 *
 * States:
 * - loading → skeleton
 * - error (auth failure) → error banner
 * - stub (backend unavailable) → degraded banner + stub data
 * - no-assignments / no-units / no-leases → empty state
 * - active → full dashboard
 */
export function PMDashboard() {
  const [result, setResult] = useState<PMDashboardFetchResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      const res = await fetchPMDashboard();
      if (!cancelled) {
        setResult(res);
        setIsLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (isLoading) return <PMDashboardSkeleton />;

  // Error state — auth failures
  if (result?.status === "error") {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Portfolio overview"
          description="See occupancy, leases, and maintenance across your portfolio."
        />
        <div className="rounded-lg border border-red-800/50 bg-red-950/30 p-6 text-center text-sm text-red-300">
          {result.error}
        </div>
      </section>
    );
  }

  if (!result) return null;

  const data: PMDashboardData = result.data;
  const isStub = result.status === "stub";

  // Empty state — no properties assigned
  if (data.setupStage !== "active") {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Portfolio overview"
          description="See occupancy, leases, and maintenance across your portfolio."
        />
        <PMEmptyState stage={data.setupStage} />
      </section>
    );
  }

  const vm: PMDashboardViewModel = toPMDashboardViewModel(data);
  const priorityActions = derivePMPriorityActions(data);
  const insights = derivePMInsights(data);
  const onboardingSteps = pmOnboardingSteps(data);

  return (
    <section aria-labelledby="pm-heading" className="space-y-6">
      <PageHeader
        title="Portfolio overview"
        description="See occupancy, leases, and maintenance across your portfolio."
      />

      {/* Degraded/stub banner */}
      {isStub && (
        <div className="rounded-lg border border-amber-800/50 bg-amber-950/30 px-4 py-3 text-sm text-amber-300">
          Showing sample data — the dashboard backend is not connected yet.
          {result.status === "stub" && result.reason && (
            <span className="block mt-1 text-xs text-amber-400/70">{result.reason}</span>
          )}
        </div>
      )}

      <WidgetErrorBoundary name="KPI Grid">
        <PMKpiGrid vm={vm.kpis} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Priority Actions">
        <PriorityActions actions={priorityActions} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Portfolio Setup">
        <WorkflowChecklist
          title="Portfolio setup"
          steps={onboardingSteps}
          dismissKey="lb-pm-onboarding-dismissed"
        />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Tasks">
        <PMTasksList vm={vm.tasks} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Maintenance">
        <PMMaintenanceWidget vm={vm.maintenance} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Recommended Actions">
        <RecommendedActions insights={insights} />
      </WidgetErrorBoundary>
    </section>
  );
}
