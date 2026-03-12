import { mapUserRoleToPersona } from "@/lib/auth/roles";

// This test originally referenced a session cookie module that was removed.
// Replaced with auth store persona-mapping validation.
describe("auth persona mapping", () => {
  test("maps active roles to persona", () => {
    expect(mapUserRoleToPersona("OWNER")).toBe("owner");
    expect(mapUserRoleToPersona("TENANT")).toBe("tenant");
  });

  test("legacy roles return null (fail closed, removed in Phase 2)", () => {
    expect(mapUserRoleToPersona("ORG_ADMIN")).toBe(null);
    expect(mapUserRoleToPersona("PM_STAFF")).toBe(null);
  });
});
