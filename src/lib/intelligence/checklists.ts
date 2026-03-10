/**
 * Workflow Checklist derivation — pure functions.
 *
 * Returns ChecklistStep[] computed from live dashboard/entity data.
 */

import type { ChecklistStep } from "@/components/ui/WorkflowChecklist";
import type { OwnerDashboardData } from "@/services/dashboard/types";
import type {
  PMDashboardData,
  PMPropertyRow,
  PMUnitRow,
} from "@/services/pm/types";

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
      done: hasLeases, // leases imply tenants exist
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
   Property Setup (PM-facing)
   ═══════════════════════════════════════════ */

export function propertySetupSteps(
  _property: PMPropertyRow,
  units: PMUnitRow[],
  hasLeases: boolean,
  hasTenants: boolean,
  hasDocuments: boolean,
): ChecklistStep[] {
  const hasUnits = units.length > 0;
  const hasRentConfigured = units.some((u) => u.rent_amount > 0);

  return [
    {
      key: "property-created",
      label: "Property created",
      done: true, // always true — we're viewing the property
    },
    {
      key: "units-added",
      label: "Units added",
      done: hasUnits,
      href: "/app/units",
      ctaLabel: "Add Units",
    },
    {
      key: "rent-configured",
      label: "Rent amounts configured",
      done: hasRentConfigured,
      href: "/app/units",
      ctaLabel: "Set Rent",
    },
    {
      key: "tenants-invited",
      label: "Tenants invited",
      done: hasTenants,
      href: "/app/tenants",
      ctaLabel: "Invite Tenants",
    },
    {
      key: "lease-created",
      label: "Lease agreement created",
      done: hasLeases,
      href: "/app/leases",
      ctaLabel: "Create Lease",
    },
    {
      key: "documents-uploaded",
      label: "Documents uploaded",
      done: hasDocuments,
      href: "/app/documents",
      ctaLabel: "Upload",
    },
  ];
}

/* ═══════════════════════════════════════════
   PM Portfolio Onboarding
   ═══════════════════════════════════════════ */

export function pmOnboardingSteps(data: PMDashboardData): ChecklistStep[] {
  const hasProperties = data.properties.length > 0;
  const hasUnits = data.units.length > 0;
  const hasLeases = data.leases.some((l) => l.status === "ACTIVE");
  const hasTenants = data.tenants.length > 0;

  return [
    {
      key: "assigned",
      label: "Get assigned to properties",
      done: hasProperties,
      href: "/app/properties",
      ctaLabel: "View Properties",
    },
    {
      key: "setup-units",
      label: "Set up units for your properties",
      done: hasUnits,
      href: "/app/units",
      ctaLabel: "Add Units",
    },
    {
      key: "invite-tenants",
      label: "Invite tenants",
      done: hasTenants,
      href: "/app/tenants",
      ctaLabel: "Invite",
    },
    {
      key: "create-leases",
      label: "Create leases for your tenants",
      done: hasLeases,
      href: "/app/leases",
      ctaLabel: "Create Lease",
    },
    {
      key: "setup-payments",
      label: "Enable payment collection",
      done: data.recentPayments.length > 0,
      href: "/app/payments",
      ctaLabel: "Set Up",
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
