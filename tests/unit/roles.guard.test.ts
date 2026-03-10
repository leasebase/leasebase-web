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

  test("unknown role returns null (fail closed)", () => {
    expect(mapUserRoleToPersona("UNKNOWN_ROLE")).toBe(null);
  });

  test("null/undefined returns null (fail closed)", () => {
    expect(mapUserRoleToPersona(null)).toBe(null);
    expect(mapUserRoleToPersona(undefined)).toBe(null);
  });
});
