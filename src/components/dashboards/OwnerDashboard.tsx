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
import { CashFlowCard } from "./owner/CashFlowCard";
import { MaintenanceOverviewCard } from "./owner/MaintenanceOverviewCard";
import { LeaseRiskCard } from "./owner/LeaseRiskCard";
import { VacancyReadinessCard } from "./owner/VacancyReadinessCard";
import { PropertyHealthTable } from "./owner/PropertyHealthTable";
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
          title="Dashboard"
          description="Track income, performance, and expenses for your properties."
        />
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
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
          title="Dashboard"
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
      {/* 1. Page Header — dynamic subtitle */}
      <PageHeader
        title={vm.header.title}
        description={vm.header.subtitle}
      />

      {/* 2. Priority Actions */}
      <WidgetErrorBoundary name="Priority Actions">
        <PriorityActions actions={priorityActions} />
      </WidgetErrorBoundary>

      {/* 3. KPI Row — 4 cards */}
      <WidgetErrorBoundary name="KPI Grid">
        <KpiGrid vm={vm.kpis} />
      </WidgetErrorBoundary>

      {/* 4. Cash Flow + Maintenance Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetErrorBoundary name="Cash Flow">
          <CashFlowCard vm={vm.cashFlow} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="Maintenance Overview">
          <MaintenanceOverviewCard vm={vm.maintenanceOverview} />
        </WidgetErrorBoundary>
      </div>

      {/* 5. Lease Risk + Vacancy / Readiness */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetErrorBoundary name="Lease Risk">
          <LeaseRiskCard vm={vm.leaseRisk} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="Vacancy Readiness">
          <VacancyReadinessCard vm={vm.vacancyReadiness} />
        </WidgetErrorBoundary>
      </div>

      {/* 6. Property Health Table */}
      <WidgetErrorBoundary name="Property Health">
        <PropertyHealthTable vm={vm.propertyHealthTable} />
      </WidgetErrorBoundary>

      {/* 7. Recommended Actions */}
      <WidgetErrorBoundary name="Recommended Actions">
        <RecommendedActions insights={insights} />
      </WidgetErrorBoundary>

      {/* 8. Recent Activity + Alerts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <WidgetErrorBoundary name="Activity Feed">
          <ActivityFeed vm={vm.activityFeed} />
        </WidgetErrorBoundary>
        <WidgetErrorBoundary name="Alerts">
          <AlertsPanel vm={vm.alerts} />
        </WidgetErrorBoundary>
      </div>

      {/* 9. Portfolio Health (summary bars) */}
      <WidgetErrorBoundary name="Portfolio Health">
        <PortfolioHealthWidget vm={vm.portfolioHealth} />
      </WidgetErrorBoundary>

      {/* 10. Quick Actions */}
      <WidgetErrorBoundary name="Quick Actions">
        <QuickActions vm={vm.quickActions} />
      </WidgetErrorBoundary>

      {/* 11. Onboarding Checklist */}
      <WidgetErrorBoundary name="Onboarding Checklist">
        <WorkflowChecklist
          title="Getting started"
          steps={onboardingSteps}
          dismissKey="lb-owner-onboarding-dismissed"
        />
      </WidgetErrorBoundary>
    </section>
  );
}
