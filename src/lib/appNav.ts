import type { Persona } from "@/lib/auth/roles";

export interface AppNavItem {
  path: string;
  label: string;
  icon?: string; // simple string key for now
  personas: Persona[];
  isFuture?: boolean;
}

export const appNavItems: AppNavItem[] = [
  { path: "/app", label: "Dashboard", icon: "dashboard", personas: ["propertyManager", "owner", "tenant", "vendor"] },
  { path: "/app/properties", label: "Properties", icon: "properties", personas: ["propertyManager", "owner"] },
  { path: "/app/units", label: "Units", icon: "units", personas: ["propertyManager"] },
  { path: "/app/leases", label: "Leases", icon: "leases", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/tenants", label: "Tenants", icon: "tenants", personas: ["propertyManager"] },
  { path: "/app/rent-roll", label: "Rent Roll", icon: "rent-roll", personas: ["propertyManager"] },
  { path: "/app/payments", label: "Payments", icon: "payments", personas: ["propertyManager", "owner"] },
  { path: "/app/pay-rent", label: "Pay Rent", icon: "pay-rent", personas: ["tenant"] },
  { path: "/app/payment-history", label: "Payment History", icon: "payment-history", personas: ["tenant"] },
  { path: "/app/maintenance", label: "Maintenance", icon: "maintenance", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/documents", label: "Documents", icon: "documents", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/messages", label: "Messages", icon: "messages", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/notifications", label: "Notifications", icon: "notifications", personas: ["propertyManager", "owner", "tenant", "vendor"] },
  { path: "/app/reports", label: "Reports", icon: "reports", personas: ["propertyManager", "owner"] },
  { path: "/app/vendor", label: "Work Orders", icon: "vendor", personas: ["vendor"] },
  { path: "/app/settings", label: "Settings", icon: "settings", personas: ["propertyManager", "owner", "tenant"] },
  // Future placeholders:
  { path: "/app/showings", label: "Showings", icon: "showings", personas: ["agent"], isFuture: true },
];

export function filterNavForPersona(persona: Persona | undefined | null): AppNavItem[] {
  if (!persona) return [];
  return appNavItems.filter((item) => !item.isFuture && item.personas.includes(persona));
}
