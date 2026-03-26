"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import type { OwnerDashboardData, OwnerDashboardViewModel } from "@/services/dashboard/types";
import { fetchOwnerDashboard } from "@/services/dashboard/ownerDashboardService";
import { toOwnerDashboardViewModel } from "@/services/dashboard/viewModel";
import { WidgetErrorBoundary } from "./owner/WidgetErrorBoundary";
import { OwnerDashboardSkeleton } from "./owner/OwnerDashboardSkeleton";
import { OwnerEmptyState } from "./owner/OwnerEmptyState";
import { AlertStrip } from "./owner/AlertStrip";
import { KpiGrid } from "./owner/KpiGrid";
import { CashFlowCard } from "./owner/CashFlowCard";
import { ActivityFeed } from "./owner/ActivityFeed";
import { PriorityActions } from "@/components/ui/PriorityActions";
import { deriveOwnerPriorityActions } from "@/lib/intelligence/deriveActions";
import { ownerOnboardingSteps } from "@/lib/intelligence/checklists";
import { track } from "@/lib/analytics";
import { CalendlyCta } from "@/components/onboarding/CalendlyCta";

export function OwnerDashboard() {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const onboardingTracked = useRef(false);

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

  // Track onboarding completion (fires once when all 3 steps done).
  useEffect(() => {
    if (!data || data.setupStage !== "active") return;
    const steps = ownerOnboardingSteps(data);
    if (
      !onboardingTracked.current &&
      steps.length > 0 &&
      steps.every((s) => s.done)
    ) {
      onboardingTracked.current = true;
      track("onboarding_completed");
    }
  }, [data]);

  if (isLoading) return <OwnerDashboardSkeleton />;

  if (error) {
    return (
      <section className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="Track income, performance, and expenses for your properties."
          sticky
        />
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
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
          sticky
        />
        <OwnerEmptyState stage={data.setupStage} />
        {/* Calendly CTA for new users */}
        <CalendlyCta />
      </section>
    );
  }

  const vm: OwnerDashboardViewModel = toOwnerDashboardViewModel(data);
  const priorityActions = deriveOwnerPriorityActions(data);
  const onboardingSteps = ownerOnboardingSteps(data);

  return (
    <section aria-labelledby="owner-heading" className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Real-time overview of your portfolio performance"
        sticky
        actions={
          <>
            <Link href="/app/reports">
              <Button variant="secondary" size="sm" icon={<Download size={14} />}>Export Report</Button>
            </Link>
            <Link href="/app/properties/new">
              <Button variant="success" size="sm" icon={<Plus size={14} />}>Add Property</Button>
            </Link>
          </>
        }
      />

      {/* Alert Strip */}
      <WidgetErrorBoundary name="Alert Strip">
        <AlertStrip vm={vm.alerts} />
      </WidgetErrorBoundary>

      {/* KPI Cards — 2x2 grid */}
      <WidgetErrorBoundary name="KPI Grid">
        <KpiGrid vm={vm.kpis} />
      </WidgetErrorBoundary>

      {/* Action Required Panel + Cash Flow — 3-column grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Action Required (1/3) */}
        <div className="xl:col-span-1">
          <WidgetErrorBoundary name="Priority Actions">
            <PriorityActions actions={priorityActions} />
          </WidgetErrorBoundary>
        </div>
        {/* Cash Flow / Revenue (2/3) */}
        <div className="xl:col-span-2">
          <WidgetErrorBoundary name="Cash Flow">
            <CashFlowCard vm={vm.cashFlow} />
          </WidgetErrorBoundary>
        </div>
      </div>

      {/* Activity Feed — full width */}
      <WidgetErrorBoundary name="Activity Feed">
        <ActivityFeed vm={vm.activityFeed} />
      </WidgetErrorBoundary>

      {/* Calendly CTA */}
      <CalendlyCta
        title="You're all set! Want a walkthrough?"
        description="Book a free call with our team to explore advanced features."
      />
    </section>
  );
}
