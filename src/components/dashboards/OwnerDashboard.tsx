"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import type { OwnerDashboardData, OwnerDashboardViewModel } from "@/services/dashboard/types";
import { fetchOwnerDashboard } from "@/services/dashboard/ownerDashboardService";
import { toOwnerDashboardViewModel } from "@/services/dashboard/viewModel";
import { WidgetErrorBoundary } from "./owner/WidgetErrorBoundary";
import { KpiGrid } from "./owner/KpiGrid";
import { AlertsPanel } from "./owner/AlertsPanel";
import { ActivityFeed } from "./owner/ActivityFeed";
import { PortfolioHealthWidget } from "./owner/PortfolioHealth";
import { QuickActions } from "./owner/QuickActions";
import { PropertiesSummary } from "./owner/PropertiesSummary";
import { OwnerDashboardSkeleton } from "./owner/OwnerDashboardSkeleton";
import { OwnerEmptyState } from "./owner/OwnerEmptyState";
import { PriorityActions } from "@/components/ui/PriorityActions";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { WorkflowChecklist } from "@/components/ui/WorkflowChecklist";
import { deriveOwnerPriorityActions, deriveOwnerInsights } from "@/lib/intelligence/deriveActions";
import { ownerOnboardingSteps } from "@/lib/intelligence/checklists";

export function OwnerDashboard() {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setIsLoading(true);
        setError(null);
        const result = await fetchOwnerDashboard();
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

  if (isLoading) return <OwnerDashboardSkeleton />;

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Owner dashboard"
          description="Track income, performance, and expenses for your properties."
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
          title="Owner dashboard"
          description="Track income, performance, and expenses for your properties."
        />
        <OwnerEmptyState stage={data.setupStage} />
      </section>
    );
  }

  const vm: OwnerDashboardViewModel = toOwnerDashboardViewModel(data);
  const priorityActions = deriveOwnerPriorityActions(data);
  const insights = deriveOwnerInsights(data);
  const onboardingSteps = ownerOnboardingSteps(data);

  return (
    <section aria-labelledby="owner-heading" className="space-y-6">
      <PageHeader
        title="Owner dashboard"
        description="Track income, performance, and expenses for your properties."
      />

      <WidgetErrorBoundary name="KPI Grid">
        <KpiGrid vm={vm.kpis} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Priority Actions">
        <PriorityActions actions={priorityActions} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Onboarding Checklist">
        <WorkflowChecklist
          title="Getting started"
          steps={onboardingSteps}
          dismissKey="lb-owner-onboarding-dismissed"
        />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Alerts">
        <AlertsPanel vm={vm.alerts} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Quick Actions">
        <QuickActions vm={vm.quickActions} />
      </WidgetErrorBoundary>

      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetErrorBoundary name="Activity Feed">
          <ActivityFeed vm={vm.activityFeed} />
        </WidgetErrorBoundary>

        <WidgetErrorBoundary name="Recommended Actions">
          <RecommendedActions insights={insights} />
        </WidgetErrorBoundary>
      </div>

      <WidgetErrorBoundary name="Portfolio Health">
        <PortfolioHealthWidget vm={vm.portfolioHealth} />
      </WidgetErrorBoundary>

      <WidgetErrorBoundary name="Properties Summary">
        <PropertiesSummary vm={vm.propertiesSummary} />
      </WidgetErrorBoundary>
    </section>
  );
}
