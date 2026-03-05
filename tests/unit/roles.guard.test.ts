import { mapUserRoleToPersona } from "@/lib/auth/roles";

describe("mapUserRoleToPersona", () => {
  test("ORG_ADMIN maps to propertyManager", () => {
    expect(mapUserRoleToPersona("ORG_ADMIN")).toBe("propertyManager");
  });

  test("PM_STAFF maps to propertyManager", () => {
    expect(mapUserRoleToPersona("PM_STAFF")).toBe("propertyManager");
  });

  test("OWNER maps to owner", () => {
    expect(mapUserRoleToPersona("OWNER")).toBe("owner");
  });

  test("TENANT maps to tenant", () => {
    expect(mapUserRoleToPersona("TENANT")).toBe("tenant");
  });

  test("unknown role defaults to tenant", () => {
    expect(mapUserRoleToPersona("UNKNOWN_ROLE")).toBe("tenant");
  });

  test("null/undefined defaults to tenant", () => {
    expect(mapUserRoleToPersona(null)).toBe("tenant");
    expect(mapUserRoleToPersona(undefined)).toBe("tenant");
  });
});
