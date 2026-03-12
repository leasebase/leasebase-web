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
  const hasProperties = data.kpis.totalProperties.value > 0;
  const hasUnits = data.kpis.totalUnits.value > 0;
  const hasLeases = data.setupStage === "active" || data.setupStage === "no-payments";
  const hasPayments = data.setupStage === "active";

  return [
    {
      key: "add-property",
      label: "Add your first property",
      done: hasProperties,
      href: "/app/properties",
      ctaLabel: "Add Property",
    },
    {
      key: "add-units",
      label: "Create units for your property",
      done: hasUnits,
      href: "/app/units",
      ctaLabel: "Add Units",
    },
    {
      key: "create-lease",
      label: "Set up a lease agreement",
      done: hasLeases,
      href: "/app/leases",
      ctaLabel: "Create Lease",
    },
    {
      key: "invite-tenants",
      label: "Invite tenants to the platform",
      // Proxy: OWNER can't call /api/tenants — inferred from active lease existence.
      // Will show as done if any lease exists, even without a confirmed tenant invite.
      done: hasLeases,
      href: "/app/tenants",
      ctaLabel: "Invite Tenants",
    },
    {
      key: "record-payment",
      label: "Record or receive your first payment",
      done: hasPayments,
      href: "/app/payments",
      ctaLabel: "Record Payment",
    },
    {
      key: "upload-docs",
      label: "Upload property documents",
      done: data.documentCount > 0,
      href: "/app/documents",
      ctaLabel: "Upload",
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
