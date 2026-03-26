"use client";

import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import type { OwnerDashboardData, OwnerDashboardViewModel } from "@/services/dashboard/types";
import { fetchOwnerDashboard } from "@/services/dashboard/ownerDashboardService";
import { toOwnerDashboardViewModel } from "@/services/dashboard/viewModel";
import { WidgetErrorBoundary } from "./owner/WidgetErrorBoundary";
import { OwnerDashboardSkeleton } from "./owner/OwnerDashboardSkeleton";
import { OwnerEmptyState } from "./owner/OwnerEmptyState";
import { PriorityActions } from "@/components/ui/PriorityActions";
import { RecommendedActions } from "@/components/ui/RecommendedActions";
import { WorkflowChecklist } from "@/components/ui/WorkflowChecklist";
import { CustomizeDashboard } from "./CustomizeDashboard";
import { deriveOwnerPriorityActions, deriveOwnerInsights } from "@/lib/intelligence/deriveActions";
import { ownerOnboardingSteps } from "@/lib/intelligence/checklists";
import { OWNER_WIDGETS } from "@/lib/dashboard/ownerWidgets";
import { mergePreferences, type ResolvedWidget } from "@/lib/dashboard/widgetRegistry";
import { loadPreferences } from "@/lib/dashboard/preferences";
import { track } from "@/lib/analytics";
import { CalendlyCta } from "@/components/onboarding/CalendlyCta";

export function OwnerDashboard() {
  const [data, setData] = useState<OwnerDashboardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [widgets, setWidgets] = useState<ResolvedWidget[]>(() =>
    mergePreferences(OWNER_WIDGETS, []),
  );
  const onboardingTracked = useRef(false);

  // Load saved preferences on mount (after hydration)
  useEffect(() => {
    const saved = loadPreferences("owner");
    if (saved.length > 0) {
      setWidgets(mergePreferences(OWNER_WIDGETS, saved));
    }
  }, []);

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
        />
        <OwnerEmptyState stage={data.setupStage} />
        {/* Calendly CTA for new users */}
        <CalendlyCta />
      </section>
    );
  }

  const vm: OwnerDashboardViewModel = toOwnerDashboardViewModel(data);
  const priorityActions = deriveOwnerPriorityActions(data);
  const insights = deriveOwnerInsights(data);
  const onboardingSteps = ownerOnboardingSteps(data);

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
          <WidgetErrorBoundary name={w.definition.title}>
            <Component vm={vmProp} />
          </WidgetErrorBoundary>
          <WidgetErrorBoundary name={next.definition.title}>
            <NextComponent vm={nextVmProp} />
          </WidgetErrorBoundary>
        </div>,
      );
      idx += 2;
    } else {
      widgetElements.push(
        <WidgetErrorBoundary key={w.definition.id} name={w.definition.title}>
          <Component vm={vmProp} />
        </WidgetErrorBoundary>,
      );
      idx += 1;
    }
  }

  return (
    <section aria-labelledby="owner-heading" className="space-y-6">
      {/* Page Header with Customize button */}
      <PageHeader
        title={vm.header.title}
        description={vm.header.subtitle}
        actions={
          <Button
            variant="secondary"
            size="sm"
            icon={<Settings2 size={14} />}
            onClick={() => setCustomizeOpen(true)}
          >
            Customize
          </Button>
        }
      />

      {/* Priority Actions (fixed) */}
      <WidgetErrorBoundary name="Priority Actions">
        <PriorityActions actions={priorityActions} />
      </WidgetErrorBoundary>

      {/* Registry-driven configurable widgets */}
      {widgetElements}

      {/* Recommended Actions (fixed) */}
      <WidgetErrorBoundary name="Recommended Actions">
        <RecommendedActions insights={insights} />
      </WidgetErrorBoundary>

      {/* Onboarding Checklist (fixed) */}
      <WidgetErrorBoundary name="Onboarding Checklist">
        <WorkflowChecklist
          title="Getting started"
          steps={onboardingSteps}
          dismissKey="lb-owner-onboarding-dismissed"
        />
      </WidgetErrorBoundary>

      {/* Calendly CTA — shown after onboarding completion */}
      <CalendlyCta
        title="You're all set! Want a walkthrough?"
        description="Book a free call with our team to explore advanced features."
      />

      {/* Customization modal */}
      <CustomizeDashboard
        open={customizeOpen}
        onClose={() => setCustomizeOpen(false)}
        role="owner"
        widgets={widgets}
        onSave={setWidgets}
      />
    </section>
  );
}
