import {
  getPortalUrlForRole,
  getBaseAppDomain,
  getSignInUrl,
  getSignUpUrl,
  buildSignInRedirect,
  navigateToSignIn,
} from "@/lib/hostname";

// Default env: leasebase.ai
beforeEach(() => {
  delete process.env.NEXT_PUBLIC_APP_DOMAIN;
});

describe("getBaseAppDomain", () => {
  test("returns leasebase.ai by default", () => {
    expect(getBaseAppDomain()).toBe("leasebase.ai");
  });

  test("returns env override when set", () => {
    process.env.NEXT_PUBLIC_APP_DOMAIN = "custom.domain";
    expect(getBaseAppDomain()).toBe("custom.domain");
  });
});

describe("getPortalUrlForRole — same-origin paths", () => {
  test("OWNER → /owner", () => {
    expect(getPortalUrlForRole("OWNER")).toBe("/owner");
  });

  test("ORG_ADMIN → /owner", () => {
    expect(getPortalUrlForRole("ORG_ADMIN")).toBe("/owner");
  });

  test("PM_STAFF → /owner", () => {
    expect(getPortalUrlForRole("PM_STAFF")).toBe("/owner");
  });

  test("TENANT → /tenant", () => {
    expect(getPortalUrlForRole("TENANT")).toBe("/tenant");
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

  test("case-insensitive: owner → /owner", () => {
    expect(getPortalUrlForRole("owner")).toBe("/owner");
  });

  test("case-insensitive: tenant → /tenant", () => {
    expect(getPortalUrlForRole("tenant")).toBe("/tenant");
  });
});

describe("getSignInUrl", () => {
  test("always returns /auth/login", () => {
    expect(getSignInUrl()).toBe("/auth/login");
  });
});

describe("getSignUpUrl", () => {
  test("always returns /auth/register", () => {
    expect(getSignUpUrl()).toBe("/auth/register");
  });
});

describe("buildSignInRedirect", () => {
  test("with message param → /auth/login?message=...", () => {
    expect(buildSignInRedirect({ message: "Email confirmed" })).toBe(
      "/auth/login?message=Email+confirmed",
    );
  });

  test("without params → /auth/login", () => {
    expect(buildSignInRedirect()).toBe("/auth/login");
  });

  test("empty params object → /auth/login (no query string)", () => {
    expect(buildSignInRedirect({})).toBe("/auth/login");
  });

  test("multiple params → combined query string", () => {
    expect(buildSignInRedirect({ message: "Password reset", next: "/owner" })).toBe(
      "/auth/login?message=Password+reset&next=%2Fowner",
    );
  });
});

describe("navigateToSignIn", () => {
  test("calls router.push with the url", () => {
    const push = jest.fn();
    navigateToSignIn("/auth/login?message=test", { push });
    expect(push).toHaveBeenCalledWith("/auth/login?message=test");
  });

  test("does nothing without a router", () => {
    // Should not throw
    navigateToSignIn("/auth/login");
  });
});
