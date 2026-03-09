/**
 * E2E persona configuration.
 *
 * Defaults match the seeded data from prisma/seed.ts.
 * Override with E2E_* environment variables.
 */

export interface PersonaCredentials {
  email: string;
  orgId: string;
  role: string;
}

export type PersonaKey =
  | "tenant"
  | "pmStaff"
  | "pmAdmin"
  | "orgAdmin"
  | "owner"
  | "pmEmpty"
  | "vendor";

const env = (key: string, fallback: string): string =>
  process.env[key] || fallback;

export const personas: Record<PersonaKey, PersonaCredentials> = {
  tenant: {
    email: env("E2E_TENANT_EMAIL", "tenant@landlord.local"),
    orgId: env("E2E_TENANT_ORG", "landlord-demo"),
    role: env("E2E_TENANT_ROLE", "TENANT"),
  },
  pmStaff: {
    email: env("E2E_PM_EMAIL", "alice@pm.local"),
    orgId: env("E2E_PM_ORG", "pm-demo"),
    role: env("E2E_PM_ROLE", "PM_STAFF"),
  },
  pmAdmin: {
    email: env("E2E_PM_ADMIN_EMAIL", "admin@pm.local"),
    orgId: env("E2E_PM_ADMIN_ORG", "pm-demo"),
    role: env("E2E_PM_ADMIN_ROLE", "ORG_ADMIN"),
  },
  orgAdmin: {
    email: env("E2E_ADMIN_EMAIL", "admin@landlord.local"),
    orgId: env("E2E_ADMIN_ORG", "landlord-demo"),
    role: env("E2E_ADMIN_ROLE", "ORG_ADMIN"),
  },
  owner: {
    email: env("E2E_OWNER_EMAIL", "owner@pm.local"),
    orgId: env("E2E_OWNER_ORG", "pm-demo"),
    role: env("E2E_OWNER_ROLE", "OWNER"),
  },
  pmEmpty: {
    email: env("E2E_PM_EMPTY_EMAIL", "carol@pm.local"),
    orgId: env("E2E_PM_EMPTY_ORG", "pm-demo"),
    role: env("E2E_PM_EMPTY_ROLE", "PM_STAFF"),
  },
  vendor: {
    email: env("E2E_VENDOR_EMAIL", "vendor@test.local"),
    orgId: env("E2E_VENDOR_ORG", "pm-demo"),
    role: env("E2E_VENDOR_ROLE", "VENDOR"),
  },
};
