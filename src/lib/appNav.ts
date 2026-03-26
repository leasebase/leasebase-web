import type { Persona } from "@/lib/auth/roles";

export interface AppNavItem {
  path: string;
  label: string;
  icon?: string; // simple string key for now
  personas: Persona[];
  isFuture?: boolean;
  /** Hide from navigation without removing the route. */
  hidden?: boolean;
  /** Sidebar group this item belongs to. */
  group?: NavGroupKey;
}

/** Logical sidebar sections. */
export type NavGroupKey = "overview" | "portfolio" | "operations" | "intelligence";

export interface NavGroup {
  key: NavGroupKey;
  label: string;
  items: AppNavItem[];
}

const groupMeta: Record<NavGroupKey, string> = {
  overview:      "Overview",
  portfolio:     "Portfolio",
  operations:    "Operations",
  intelligence:  "Intelligence",
};

export const appNavItems: AppNavItem[] = [
  // ── Overview ──
  { path: "/app", label: "Dashboard", icon: "dashboard", personas: ["owner", "tenant"], group: "overview" },

  // ── Portfolio ──
  { path: "/app/properties", label: "Properties", icon: "properties", personas: ["owner"], group: "portfolio" },
  { path: "/app/tenants", label: "Tenants", icon: "tenants", personas: ["owner"], group: "portfolio" },
  { path: "/app/leases", label: "Leases", icon: "leases", personas: ["owner"], group: "portfolio" },

  // ── Operations ──
  { path: "/app/payments", label: "Payments", icon: "payments", personas: ["owner"], group: "operations" },
  // Tenant nav items — consolidated per UIUX Figma design
  { path: "/app/pay-rent", label: "Rent & Payments", icon: "payments", personas: ["tenant"], group: "operations" },
  { path: "/app/payment-methods", label: "Payment Methods", icon: "payment-methods", personas: ["tenant"], group: "operations", hidden: true },
  { path: "/app/payment-history", label: "Payment History", icon: "payment-history", personas: ["tenant"], group: "operations", hidden: true },
  { path: "/app/maintenance", label: "Maintenance", icon: "maintenance", personas: ["owner", "tenant"], group: "operations" },
  { path: "/app/leases", label: "Lease Details", icon: "leases", personas: ["tenant"], group: "operations" },
  { path: "/app/documents", label: "Documents", icon: "documents", personas: ["owner", "tenant"], group: "operations" },
  { path: "/app/notifications", label: "Notifications", icon: "notifications", personas: ["tenant"], group: "operations" },

  // ── Intelligence (hidden until product is ready for owners) ──
  { path: "/app/reports", label: "Reports", icon: "reports", personas: ["owner"], group: "intelligence", hidden: true },
  { path: "/app/admin/growth", label: "Growth", icon: "growth", personas: ["owner"], group: "intelligence", hidden: true },

  // ── Settings ──
  { path: "/app/settings", label: "Settings", icon: "settings", personas: ["owner", "tenant"], group: "operations" },
];

export function filterNavForPersona(persona: Persona | undefined | null): AppNavItem[] {
  if (!persona) return [];
  return appNavItems.filter((item) => !item.isFuture && !item.hidden && item.personas.includes(persona));
}

/**
 * Returns nav items grouped by section, filtered for the given persona.
 * Empty groups are omitted.
 */
export function groupNavForPersona(persona: Persona | undefined | null): NavGroup[] {
  const flat = filterNavForPersona(persona);
  const order: NavGroupKey[] = ["overview", "portfolio", "operations", "intelligence"];

  return order
    .map((key) => ({
      key,
      label: groupMeta[key],
      items: flat.filter((item) => item.group === key),
    }))
    .filter((g) => g.items.length > 0);
}
