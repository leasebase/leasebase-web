import {
  resolvePersonaFromHostname,
  getPortalUrlForRole,
  getPortalOrigin,
  getBaseAppDomain,
  getSignInUrl,
  buildSignInRedirect,
  navigateToSignIn,
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

describe("getSignInUrl", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    // Restore real window after each test.
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  function setHostname(hostname: string) {
    Object.defineProperty(globalThis, "window", {
      value: { location: { hostname } },
      writable: true,
    });
  }

  test("owner portal → same-origin /auth/login", () => {
    setHostname("owner.leasebase.co");
    expect(getSignInUrl()).toBe("/auth/login");
  });

  test("manager portal → same-origin /auth/login", () => {
    setHostname("manager.leasebase.co");
    expect(getSignInUrl()).toBe("/auth/login");
  });

  test("tenant portal → same-origin /auth/login", () => {
    setHostname("tenant.leasebase.co");
    expect(getSignInUrl()).toBe("/auth/login");
  });

  test("login portal → login subdomain URL", () => {
    setHostname("login.leasebase.co");
    expect(getSignInUrl()).toBe("https://login.leasebase.co");
  });

  test("signup portal → login subdomain URL", () => {
    setHostname("signup.leasebase.co");
    expect(getSignInUrl()).toBe("https://login.leasebase.co");
  });

  test("generic localhost → same-origin /auth/login", () => {
    setHostname("localhost");
    expect(getSignInUrl()).toBe("/auth/login");
  });

  test("127.0.0.1 → same-origin /auth/login", () => {
    setHostname("127.0.0.1");
    expect(getSignInUrl()).toBe("/auth/login");
  });

  test("unknown hostname → login subdomain URL", () => {
    setHostname("example.com");
    expect(getSignInUrl()).toBe("https://login.leasebase.co");
  });

  test("dev subdomain portals → same-origin /auth/login", () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "dev.leasebase.co";
    setHostname("owner.dev.leasebase.co");
    expect(getSignInUrl()).toBe("/auth/login");
  });

  test("localhost subdomain portals → same-origin /auth/login", () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "localhost";
    setHostname("tenant.localhost");
    expect(getSignInUrl()).toBe("/auth/login");
  });
});

describe("buildSignInRedirect", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  function setHostname(hostname: string) {
    Object.defineProperty(globalThis, "window", {
      value: { location: { hostname } },
      writable: true,
    });
  }

  test("signup portal → cross-origin login page with message", () => {
    setHostname("signup.leasebase.co");
    expect(buildSignInRedirect({ message: "Email confirmed" })).toBe(
      "https://login.leasebase.co/auth/login?message=Email+confirmed",
    );
  });

  test("signup portal → cross-origin login page without params", () => {
    setHostname("signup.leasebase.co");
    expect(buildSignInRedirect()).toBe(
      "https://login.leasebase.co/auth/login",
    );
  });

  test("persona portal → same-origin /auth/login with message", () => {
    setHostname("owner.leasebase.co");
    expect(buildSignInRedirect({ message: "Password reset successful" })).toBe(
      "/auth/login?message=Password+reset+successful",
    );
  });

  test("localhost → same-origin /auth/login with message", () => {
    setHostname("localhost");
    expect(buildSignInRedirect({ message: "Email confirmed" })).toBe(
      "/auth/login?message=Email+confirmed",
    );
  });

  test("empty params object → no query string", () => {
    setHostname("localhost");
    expect(buildSignInRedirect({})).toBe("/auth/login");
  });
});

describe("navigateToSignIn", () => {
  const originalWindow = globalThis.window;

  afterEach(() => {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      writable: true,
    });
  });

  test("cross-origin URL → sets window.location.href", () => {
    const mockLocation = { href: "" };
    Object.defineProperty(globalThis, "window", {
      value: { location: mockLocation },
      writable: true,
    });

    navigateToSignIn("https://login.leasebase.co/auth/login?message=test");
    expect(mockLocation.href).toBe(
      "https://login.leasebase.co/auth/login?message=test",
    );
  });

  test("same-origin URL → calls router.push", () => {
    const push = jest.fn();
    navigateToSignIn("/auth/login?message=test", { push });
    expect(push).toHaveBeenCalledWith("/auth/login?message=test");
  });
});
