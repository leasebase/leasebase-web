/**
 * Supported personas — Owner and Tenant only.
 * Property Manager, Agent, and Vendor have been removed from the product model.
 */
export type Persona = "owner" | "tenant";

// Backend roles as strings; we don't import the enum to avoid coupling.
export type BackendUserRole =
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

  if (normalized === "OWNER") {
    return "owner";
  }
  if (normalized === "TENANT") {
    return "tenant";
  }

  // Fail closed: unknown or missing role produces null.
  return null;
}
