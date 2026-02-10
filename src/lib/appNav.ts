import type { Persona } from "@/lib/auth/roles";

export interface AppNavItem {
  path: string;
  label: string;
  icon?: string; // simple string key for now
  personas: Persona[];
  isFuture?: boolean;
}

export const appNavItems: AppNavItem[] = [
  { path: "/app", label: "Dashboard", icon: "dashboard", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/properties", label: "Properties", icon: "properties", personas: ["propertyManager", "owner"] },
  { path: "/app/units", label: "Units", icon: "units", personas: ["propertyManager"] },
  { path: "/app/leases", label: "Leases", icon: "leases", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/tenants", label: "Tenants", icon: "tenants", personas: ["propertyManager"] },
  { path: "/app/payments", label: "Payments", icon: "payments", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/maintenance", label: "Maintenance", icon: "maintenance", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/messages", label: "Messages", icon: "messages", personas: ["propertyManager", "owner", "tenant"] },
  { path: "/app/reports", label: "Reports", icon: "reports", personas: ["propertyManager", "owner"] },
  { path: "/app/settings", label: "Settings", icon: "settings", personas: ["propertyManager", "owner", "tenant"] },
  // Future placeholders (routes will exist but nav is hidden until we surface them):
  { path: "/app/showings", label: "Showings", icon: "showings", personas: ["agent"], isFuture: true },
  { path: "/app/vendor", label: "Vendor", icon: "vendor", personas: ["vendor"], isFuture: true },
];

export function filterNavForPersona(persona: Persona | undefined | null): AppNavItem[] {
  if (!persona) return [];
  return appNavItems.filter((item) => !item.isFuture && item.personas.includes(persona));
}
