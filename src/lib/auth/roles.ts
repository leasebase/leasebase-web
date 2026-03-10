export type Persona = "propertyManager" | "owner" | "tenant" | "agent" | "vendor";

// Backend roles as strings; we don't import the enum to avoid coupling.
export type BackendUserRole =
  | "ORG_ADMIN"
  | "PM_STAFF"
  | "OWNER"
  | "TENANT"
  | (string & {});

/**
 * Map a backend role to a frontend persona.
 *
 * Returns `null` for unknown/missing roles — callers MUST handle this as a
 * fail-closed condition. Never defaults to tenant.
 */
export function mapUserRoleToPersona(role: BackendUserRole | null | undefined): Persona | null {
  const normalized = (role || "").toUpperCase();

  if (normalized === "ORG_ADMIN" || normalized === "PM_STAFF") {
    return "propertyManager";
  }
  if (normalized === "OWNER") {
    return "owner";
  }
  if (normalized === "TENANT") {
    return "tenant";
  }

  // Fail closed: unknown or missing role produces null.
  return null;
}
