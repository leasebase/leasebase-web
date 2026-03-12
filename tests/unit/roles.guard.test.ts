import { mapUserRoleToPersona } from "@/lib/auth/roles";

describe("mapUserRoleToPersona", () => {
  test("ORG_ADMIN → null (legacy role removed in Phase 2)", () => {
    expect(mapUserRoleToPersona("ORG_ADMIN")).toBe(null);
  });

  test("PM_STAFF → null (legacy role removed in Phase 2)", () => {
    expect(mapUserRoleToPersona("PM_STAFF")).toBe(null);
  });

  test("OWNER maps to owner", () => {
    expect(mapUserRoleToPersona("OWNER")).toBe("owner");
  });

  test("TENANT maps to tenant", () => {
    expect(mapUserRoleToPersona("TENANT")).toBe("tenant");
  });

  test("unknown role returns null (fail closed)", () => {
    expect(mapUserRoleToPersona("UNKNOWN_ROLE")).toBe(null);
  });

  test("null/undefined returns null (fail closed)", () => {
    expect(mapUserRoleToPersona(null)).toBe(null);
    expect(mapUserRoleToPersona(undefined)).toBe(null);
  });
});
