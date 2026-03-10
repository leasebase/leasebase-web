import type { Persona } from "@/lib/auth/roles";

export interface AppNavItem {
  path: string;
  label: string;
  icon?: string; // simple string key for now
  personas: Persona[];
  isFuture?: boolean;
  /** Sidebar group this item belongs to. */
  group?: NavGroupKey;
}

/** Logical sidebar sections. */
export type NavGroupKey = "overview" | "portfolio" | "operations" | "intelligence" | "system";

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
  system:        "System",
};

export const appNavItems: AppNavItem[] = [
  // ── Overview ──
  { path: "/app", label: "Dashboard", icon: "dashboard", personas: ["propertyManager", "owner", "tenant", "vendor"], group: "overview" },
  { path: "/app/notifications", label: "Notifications", icon: "notifications", personas: ["propertyManager", "owner", "tenant", "vendor"], group: "overview" },
  { path: "/app/messages", label: "Messages", icon: "messages", personas: ["propertyManager", "owner", "tenant"], group: "overview" },

  // ── Portfolio ──
  { path: "/app/properties", label: "Properties", icon: "properties", personas: ["propertyManager", "owner"], group: "portfolio" },
  { path: "/app/units", label: "Units", icon: "units", personas: ["propertyManager"], group: "portfolio" },
  { path: "/app/tenants", label: "Tenants", icon: "tenants", personas: ["propertyManager"], group: "portfolio" },
  { path: "/app/leases", label: "Leases", icon: "leases", personas: ["propertyManager", "owner", "tenant"], group: "portfolio" },

  // ── Operations ──
  { path: "/app/payments", label: "Payments", icon: "payments", personas: ["propertyManager", "owner"], group: "operations" },
  { path: "/app/pay-rent", label: "Pay Rent", icon: "pay-rent", personas: ["tenant"], group: "operations" },
  { path: "/app/payment-history", label: "Payment History", icon: "payment-history", personas: ["tenant"], group: "operations" },
  { path: "/app/maintenance", label: "Maintenance", icon: "maintenance", personas: ["propertyManager", "owner", "tenant"], group: "operations" },
  { path: "/app/documents", label: "Documents", icon: "documents", personas: ["propertyManager", "owner", "tenant"], group: "operations" },

  // ── Intelligence ──
  { path: "/app/reports", label: "Reports", icon: "reports", personas: ["propertyManager", "owner"], group: "intelligence" },
  { path: "/app/rent-roll", label: "Rent Roll", icon: "rent-roll", personas: ["propertyManager"], group: "intelligence" },

  // ── System ──
  { path: "/app/vendor", label: "Vendors", icon: "vendor", personas: ["vendor", "propertyManager"], group: "system" },
  { path: "/app/settings", label: "Settings", icon: "settings", personas: ["propertyManager", "owner", "tenant"], group: "system" },

  // Future placeholders:
  { path: "/app/showings", label: "Showings", icon: "showings", personas: ["agent"], isFuture: true, group: "operations" },
];

export function filterNavForPersona(persona: Persona | undefined | null): AppNavItem[] {
  if (!persona) return [];
  return appNavItems.filter((item) => !item.isFuture && item.personas.includes(persona));
}

/**
 * Returns nav items grouped by section, filtered for the given persona.
 * Empty groups are omitted.
 */
export function groupNavForPersona(persona: Persona | undefined | null): NavGroup[] {
  const flat = filterNavForPersona(persona);
  const order: NavGroupKey[] = ["overview", "portfolio", "operations", "intelligence", "system"];

  return order
    .map((key) => ({
      key,
      label: groupMeta[key],
      items: flat.filter((item) => item.group === key),
    }))
    .filter((g) => g.items.length > 0);
}
