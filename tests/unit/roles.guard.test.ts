import { canAccessArea, getAreaForPath, PM_ROLES, TENANT_ROLES } from "@/lib/auth/roles";

describe("role guards", () => {
  test("maps paths to areas", () => {
    expect(getAreaForPath("/pm")).toBe("pm");
    expect(getAreaForPath("/pm/leases")).toBe("pm");
    expect(getAreaForPath("/tenant")).toBe("tenant");
    expect(getAreaForPath("/foo")).toBeNull();
  });

  test("pm roles can access pm area", () => {
    for (const r of PM_ROLES) {
      expect(canAccessArea(r, "pm")).toBe(true);
    }
  });

  test("tenant role cannot access pm area", () => {
    for (const r of TENANT_ROLES) {
      expect(canAccessArea(r, "pm")).toBe(false);
    }
  });
});
