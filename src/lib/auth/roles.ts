export type Persona = "propertyManager" | "owner" | "tenant" | "agent" | "vendor";

// Backend roles as strings; we don't import the enum to avoid coupling.
export type BackendUserRole =
  | "ORG_ADMIN"
  | "PM_STAFF"
  | "OWNER"
  | "TENANT"
  | (string & {});

export function mapUserRoleToPersona(role: BackendUserRole | null | undefined): Persona {
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

  // Default to tenant for unknown/future roles so they at least get a
  // reasonable dashboard without exposing privileged PM/Owner features.
  return "tenant";
}
