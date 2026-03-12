import { getPortalUrlForRole } from "@/lib/hostname";
import { mapUserRoleToPersona } from "@/lib/auth/roles";

describe("Post-login redirect — getPortalUrlForRole (unified /app dashboard)", () => {
  test("OWNER → /app", () => {
    expect(getPortalUrlForRole("OWNER")).toBe("/app");
  });

  test("ORG_ADMIN → null (legacy role, fail closed post Phase 2)", () => {
    expect(getPortalUrlForRole("ORG_ADMIN")).toBe(null);
  });

  test("PM_STAFF → null (legacy role, fail closed post Phase 2)", () => {
    expect(getPortalUrlForRole("PM_STAFF")).toBe(null);
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
  test("ORG_ADMIN → null (legacy role removed in Phase 2)", () => {
    expect(mapUserRoleToPersona("ORG_ADMIN")).toBe(null);
  });

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
