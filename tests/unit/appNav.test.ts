import { filterNavForPersona, groupNavForPersona, appNavItems } from "@/lib/appNav";

describe("filterNavForPersona", () => {
  test("returns empty array for null persona", () => {
    expect(filterNavForPersona(null)).toEqual([]);
  });

  test("returns empty array for undefined persona", () => {
    expect(filterNavForPersona(undefined)).toEqual([]);
  });

  test("owner sees core product sections", () => {
    const items = filterNavForPersona("owner");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    expect(labels).toContain("Properties");
    expect(labels).toContain("Tenants");
    expect(labels).toContain("Leases");
    expect(labels).toContain("Maintenance");
    expect(labels).toContain("Documents");
    expect(labels).toContain("Payments");
    expect(labels).toContain("Reports");
  });

  test("tenant does not see owner-only sections", () => {
    const items = filterNavForPersona("tenant");
    const labels = items.map((i) => i.label);
    expect(labels).not.toContain("Properties");
    expect(labels).not.toContain("Tenants");
    expect(labels).not.toContain("Payments");
    expect(labels).not.toContain("Reports");
  });

  test("tenant sees their own sections", () => {
    const items = filterNavForPersona("tenant");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Dashboard");
    // Tenants see "My Lease" (not "Leases") at the same /app/leases route
    expect(labels).toContain("My Lease");
    expect(labels).not.toContain("Leases");
    expect(labels).toContain("Maintenance");
    expect(labels).toContain("Documents");
  });

  test("tenant 'My Lease' nav item points to /app/leases", () => {
    const items = filterNavForPersona("tenant");
    const myLease = items.find((i) => i.label === "My Lease");
    expect(myLease).toBeDefined();
    expect(myLease!.path).toBe("/app/leases");
  });

  test("Notifications is NOT in the left nav (belongs in header)", () => {
    for (const persona of ["owner", "tenant"] as const) {
      const labels = filterNavForPersona(persona).map((i) => i.label);
      expect(labels).not.toContain("Notifications");
    }
  });

  test("Messages is NOT in the left nav (belongs in header)", () => {
    for (const persona of ["owner", "tenant"] as const) {
      const labels = filterNavForPersona(persona).map((i) => i.label);
      expect(labels).not.toContain("Messages");
    }
  });

  test("Settings is NOT in the left nav (belongs in user dropdown)", () => {
    for (const persona of ["owner", "tenant"] as const) {
      const labels = filterNavForPersona(persona).map((i) => i.label);
      expect(labels).not.toContain("Settings");
    }
  });

  test("future items are excluded", () => {
    for (const persona of ["owner", "tenant"] as const) {
      const items = filterNavForPersona(persona);
      expect(items.filter((i) => i.isFuture)).toHaveLength(0);
    }
  });

  test("all nav items have a path starting with /app", () => {
    for (const item of appNavItems) {
      expect(item.path).toMatch(/^\/app/);
    }
  });
});

describe("groupNavForPersona", () => {
  test("owner has no empty groups", () => {
    const groups = groupNavForPersona("owner");
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  test("system group is not present (Settings moved to header)", () => {
    for (const persona of ["owner", "tenant"] as const) {
      const groups = groupNavForPersona(persona);
      // Cast to string[] because "system" was removed from NavGroupKey;
      // this asserts the old key never appears at runtime either.
      const keys = groups.map((g) => g.key as string);
      expect(keys).not.toContain("system");
    }
  });

  test("overview group contains only Dashboard", () => {
    for (const persona of ["owner", "tenant"] as const) {
      const groups = groupNavForPersona(persona);
      const overview = groups.find((g) => g.key === "overview");
      expect(overview).toBeDefined();
      expect(overview!.items.map((i) => i.label)).toEqual(["Dashboard"]);
    }
  });
});
