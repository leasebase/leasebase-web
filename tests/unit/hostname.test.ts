import {
  resolvePersonaFromHostname,
  getPortalUrlForRole,
  getPortalOrigin,
  getBaseAppDomain,
} from "@/lib/hostname";

// Default env: leasebase.co
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_APP_DOMAIN;
});

describe("getBaseAppDomain", () => {
  test("returns leasebase.co by default", () => {
    expect(getBaseAppDomain()).toBe("leasebase.co");
  });

  test("returns env override when set", () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "localhost";
    expect(getBaseAppDomain()).toBe("localhost");
  });
});

describe("resolvePersonaFromHostname — production domains", () => {
  test("signup.leasebase.co → SIGNUP", () => {
    expect(resolvePersonaFromHostname("signup.leasebase.co")).toBe("SIGNUP");
  });

  test("login.leasebase.co → PORTAL_SELECTOR", () => {
    expect(resolvePersonaFromHostname("login.leasebase.co")).toBe("PORTAL_SELECTOR");
  });

  test("owner.leasebase.co → OWNER", () => {
    expect(resolvePersonaFromHostname("owner.leasebase.co")).toBe("OWNER");
  });

  test("manager.leasebase.co → PROPERTY_MANAGER", () => {
    expect(resolvePersonaFromHostname("manager.leasebase.co")).toBe("PROPERTY_MANAGER");
  });

  test("tenant.leasebase.co → TENANT", () => {
    expect(resolvePersonaFromHostname("tenant.leasebase.co")).toBe("TENANT");
  });

  test("dev.leasebase.co (bare domain, no known prefix) → null", () => {
    expect(resolvePersonaFromHostname("dev.leasebase.co")).toBe(null);
  });

  test("leasebase.co (root domain) → null", () => {
    expect(resolvePersonaFromHostname("leasebase.co")).toBe(null);
  });

  test("unrelated domain → null", () => {
    expect(resolvePersonaFromHostname("example.com")).toBe(null);
  });
});

describe("resolvePersonaFromHostname — localhost", () => {
  test("localhost → null (no gating)", () => {
    expect(resolvePersonaFromHostname("localhost")).toBe(null);
  });

  test("localhost:3000 → null", () => {
    expect(resolvePersonaFromHostname("localhost:3000")).toBe(null);
  });

  test("127.0.0.1 → null", () => {
    expect(resolvePersonaFromHostname("127.0.0.1")).toBe(null);
  });

  test("127.0.0.1:3000 → null", () => {
    expect(resolvePersonaFromHostname("127.0.0.1:3000")).toBe(null);
  });
});

describe("resolvePersonaFromHostname — *.localhost subdomain testing", () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "localhost";
  });

  test("signup.localhost → SIGNUP", () => {
    expect(resolvePersonaFromHostname("signup.localhost")).toBe("SIGNUP");
  });

  test("signup.localhost:3000 → SIGNUP (port stripped)", () => {
    expect(resolvePersonaFromHostname("signup.localhost:3000")).toBe("SIGNUP");
  });

  test("owner.localhost → OWNER", () => {
    expect(resolvePersonaFromHostname("owner.localhost")).toBe("OWNER");
  });

  test("manager.localhost → PROPERTY_MANAGER", () => {
    expect(resolvePersonaFromHostname("manager.localhost")).toBe("PROPERTY_MANAGER");
  });

  test("tenant.localhost → TENANT", () => {
    expect(resolvePersonaFromHostname("tenant.localhost")).toBe("TENANT");
  });

  test("login.localhost → PORTAL_SELECTOR", () => {
    expect(resolvePersonaFromHostname("login.localhost")).toBe("PORTAL_SELECTOR");
  });
});

describe("getPortalOrigin", () => {
  test("owner portal (production)", () => {
    expect(getPortalOrigin("owner")).toBe("https://owner.leasebase.co");
  });

  test("signup portal (production)", () => {
    expect(getPortalOrigin("signup")).toBe("https://signup.leasebase.co");
  });

  test("localhost portal", () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "localhost";
    expect(getPortalOrigin("owner")).toBe("http://owner.localhost:3000");
  });
});

describe("getPortalUrlForRole", () => {
  test("OWNER → owner portal /app", () => {
    expect(getPortalUrlForRole("OWNER")).toBe("https://owner.leasebase.co/app");
  });

  test("ORG_ADMIN → manager portal /app", () => {
    expect(getPortalUrlForRole("ORG_ADMIN")).toBe("https://manager.leasebase.co/app");
  });

  test("PM_STAFF → manager portal /app", () => {
    expect(getPortalUrlForRole("PM_STAFF")).toBe("https://manager.leasebase.co/app");
  });

  test("TENANT → tenant portal /app", () => {
    expect(getPortalUrlForRole("TENANT")).toBe("https://tenant.leasebase.co/app");
  });

  test("unknown role → null (fail closed)", () => {
    expect(getPortalUrlForRole("UNKNOWN_ROLE")).toBe(null);
  });

  test("null role → null (fail closed)", () => {
    expect(getPortalUrlForRole(null)).toBe(null);
  });

  test("undefined role → null (fail closed)", () => {
    expect(getPortalUrlForRole(undefined)).toBe(null);
  });

  test("empty string → null (fail closed)", () => {
    expect(getPortalUrlForRole("")).toBe(null);
  });
});
