import { getPortalUrlForRole } from "@/lib/hostname";
import { mapUserRoleToPersona } from "@/lib/auth/roles";

beforeEach(() => {
  delete process.env.NEXT_PUBLIC_APP_DOMAIN;
});

describe("Post-login redirect — getPortalUrlForRole", () => {
  test("OWNER redirects to owner portal", () => {
    expect(getPortalUrlForRole("OWNER")).toBe("https://owner.leasebase.co/app");
  });

  test("ORG_ADMIN redirects to manager portal", () => {
    expect(getPortalUrlForRole("ORG_ADMIN")).toBe("https://manager.leasebase.co/app");
  });

  test("PM_STAFF redirects to manager portal", () => {
    expect(getPortalUrlForRole("PM_STAFF")).toBe("https://manager.leasebase.co/app");
  });

  test("TENANT redirects to tenant portal", () => {
    expect(getPortalUrlForRole("TENANT")).toBe("https://tenant.leasebase.co/app");
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
