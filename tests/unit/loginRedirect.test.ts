import { getPortalUrlForRole } from "@/lib/hostname";
import { mapUserRoleToPersona } from "@/lib/auth/roles";

describe("Post-login redirect — getPortalUrlForRole (unified /app dashboard)", () => {
  test("OWNER → /app", () => {
    expect(getPortalUrlForRole("OWNER")).toBe("/app");
  });

  test("TENANT → /app", () => {
    expect(getPortalUrlForRole("TENANT")).toBe("/app");
  });

  test("unknown role returns null (fail closed)", () => {
    expect(getPortalUrlForRole("SUPER_ADMIN")).toBe(null);
  });

  test("empty role returns null (fail closed)", () => {
    expect(getPortalUrlForRole("")).toBe(null);
  });

  test("null role returns null (fail closed)", () => {
    expect(getPortalUrlForRole(null)).toBe(null);
  });
});

describe("Fail-closed role mapping — mapUserRoleToPersona", () => {
  test("OWNER → owner", () => {
    expect(mapUserRoleToPersona("OWNER")).toBe("owner");
  });

  test("TENANT → tenant", () => {
    expect(mapUserRoleToPersona("TENANT")).toBe("tenant");
  });

  test("unknown role → null (no default to tenant)", () => {
    expect(mapUserRoleToPersona("UNKNOWN")).toBe(null);
  });

  test("null → null (no default to tenant)", () => {
    expect(mapUserRoleToPersona(null)).toBe(null);
  });

  test("undefined → null (no default to tenant)", () => {
    expect(mapUserRoleToPersona(undefined)).toBe(null);
  });

  test("empty string → null", () => {
    expect(mapUserRoleToPersona("" as any)).toBe(null);
  });
});
