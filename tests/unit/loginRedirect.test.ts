import { getPortalUrlForRole } from "@/lib/hostname";
import { mapUserRoleToPersona } from "@/lib/auth/roles";

describe("Post-login redirect — getPortalUrlForRole (same-origin paths)", () => {
  test("OWNER → /owner", () => {
    expect(getPortalUrlForRole("OWNER")).toBe("/owner");
  });

  test("ORG_ADMIN → /owner (PM users route to owner dashboard)", () => {
    expect(getPortalUrlForRole("ORG_ADMIN")).toBe("/owner");
  });

  test("PM_STAFF → /owner", () => {
    expect(getPortalUrlForRole("PM_STAFF")).toBe("/owner");
  });

  test("TENANT → /tenant", () => {
    expect(getPortalUrlForRole("TENANT")).toBe("/tenant");
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
  test("ORG_ADMIN → propertyManager", () => {
    expect(mapUserRoleToPersona("ORG_ADMIN")).toBe("propertyManager");
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
