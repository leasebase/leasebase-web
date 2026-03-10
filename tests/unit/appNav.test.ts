import { filterNavForPersona, appNavItems } from "@/lib/appNav";

describe("filterNavForPersona", () => {
  test("returns empty array for null persona", () => {
    expect(filterNavForPersona(null)).toEqual([]);
  });

  test("returns empty array for undefined persona", () => {
    expect(filterNavForPersona(undefined)).toEqual([]);
  });

  test("PM sees properties, units, tenants", () => {
    const items = filterNavForPersona("propertyManager");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Properties");
    expect(labels).toContain("Units");
    expect(labels).toContain("Tenants");
  });

  test("tenant does not see Units or Tenants", () => {
    const items = filterNavForPersona("tenant");
    const labels = items.map((i) => i.label);
    expect(labels).not.toContain("Units");
    expect(labels).not.toContain("Tenants");
  });

  test("owner sees Properties and Tenants but not Units", () => {
    const items = filterNavForPersona("owner");
    const labels = items.map((i) => i.label);
    expect(labels).toContain("Properties");
    expect(labels).toContain("Tenants");
    expect(labels).not.toContain("Units");
  });

  test("future items are excluded", () => {
    const items = filterNavForPersona("propertyManager");
    const future = items.filter((i) => i.isFuture);
    expect(future).toHaveLength(0);
  });

  test("all nav items have a path starting with /app", () => {
    for (const item of appNavItems) {
      expect(item.path).toMatch(/^\/app/);
    }
  });
});
