/**
 * Workflow Checklist derivation — pure functions.
 *
 * Returns ChecklistStep[] computed from live dashboard/entity data.
 */

import type { ChecklistStep } from "@/components/ui/WorkflowChecklist";
import type { OwnerDashboardData } from "@/services/dashboard/types";

/* ═══════════════════════════════════════════
   Owner Onboarding
   ═══════════════════════════════════════════ */

export function ownerOnboardingSteps(data: OwnerDashboardData): ChecklistStep[] {
  const hasProperty = data.kpis.totalProperties.value > 0 && data.kpis.totalUnits.value > 0;
  const hasTenant = data.setupStage === "active" || data.setupStage === "no-payments";
  const hasRent = data.setupStage === "active";

  return [
    {
      key: "property-basics",
      label: "Add your property and units",
      done: hasProperty,
      href: "/app/properties",
      ctaLabel: "Add Property",
    },
    {
      key: "add-tenant",
      label: "Add a tenant (or skip for now)",
      done: hasTenant,
      href: "/app/tenants",
      ctaLabel: "Add Tenant",
    },
    {
      key: "set-rent",
      label: "Set your rent amount",
      done: hasRent,
      href: "/app/payments",
      ctaLabel: "Set Rent",
    },
  ];
}

/* ═══════════════════════════════════════════
   Maintenance Resolution
   ═══════════════════════════════════════════ */

export function maintenanceResolutionSteps(
  status: string,
  hasAssignee: boolean,
): ChecklistStep[] {
  const statusOrder = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
  const currentIdx = statusOrder.indexOf(status);

  return [
    {
      key: "reported",
      label: "Request submitted",
      done: true,
    },
    {
      key: "assigned",
      label: "Assigned to vendor or staff",
      done: hasAssignee,
      href: "/app/maintenance",
      ctaLabel: "Assign",
    },
    {
      key: "in-progress",
      label: "Work in progress",
      done: currentIdx >= 1,
    },
    {
      key: "resolved",
      label: "Resolved and verified",
      done: currentIdx >= 2,
    },
    {
      key: "closed",
      label: "Closed",
      done: currentIdx >= 3,
    },
  ];
}
