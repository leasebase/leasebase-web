import { mapUserRoleToPersona } from "@/lib/auth/roles";

// This test originally referenced a session cookie module that was removed.
// Replaced with auth store persona-mapping validation.
describe("auth persona mapping", () => {
  test("round-trips role to persona for known roles", () => {
    const cases = [
      ["ORG_ADMIN", "propertyManager"],
      ["PM_STAFF", "propertyManager"],
      ["OWNER", "owner"],
      ["TENANT", "tenant"],
    ];
    for (const [role, expected] of cases) {
      expect(mapUserRoleToPersona(role as any)).toBe(expected);
    }
  });
});
