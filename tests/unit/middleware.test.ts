/**
 * @jest-environment node
 */
import { NextRequest } from "next/server";

// Dynamically import middleware after setting env vars
async function loadMiddleware() {
  // Clear module cache to pick up env changes
  jest.resetModules();
  const mod = await import("../../middleware");
  return mod.middleware;
}

function makeRequest(url: string, host?: string): NextRequest {
  const req = new NextRequest(new URL(url));
  if (host) {
    req.headers.set("host", host);
  }
  return req;
}

describe("middleware — old-domain redirects", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("301 redirects *.leasebase.co to new domain when enabled", async () => {
    process.env.ENABLE_OLD_DOMAIN_REDIRECTS = "true";
    process.env.OLD_DOMAIN = "leasebase.co";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.dev.leasebase.ai";
    const middleware = await loadMiddleware();

    const req = makeRequest("https://app.dev.leasebase.co/owner/dashboard?tab=leases", "app.dev.leasebase.co");
    const res = middleware(req);

    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(
      "https://app.dev.leasebase.ai/owner/dashboard?tab=leases"
    );
  });

  it("preserves path and query on old-domain redirect", async () => {
    process.env.ENABLE_OLD_DOMAIN_REDIRECTS = "true";
    process.env.OLD_DOMAIN = "leasebase.co";
    process.env.NEXT_PUBLIC_APP_URL = "https://app.dev.leasebase.ai";
    const middleware = await loadMiddleware();

    const req = makeRequest("https://dev.leasebase.co/invite/accept?token=abc123", "dev.leasebase.co");
    const res = middleware(req);

    expect(res.status).toBe(301);
    expect(res.headers.get("location")).toBe(
      "https://app.dev.leasebase.ai/invite/accept?token=abc123"
    );
  });

  it("does NOT redirect old domain when feature flag is off", async () => {
    process.env.ENABLE_OLD_DOMAIN_REDIRECTS = "false";
    process.env.OLD_DOMAIN = "leasebase.co";
    const middleware = await loadMiddleware();

    const req = makeRequest("https://app.dev.leasebase.co/auth/login", "app.dev.leasebase.co");
    const res = middleware(req);

    // Should not be a redirect (either next() or root redirect)
    expect(res.status).not.toBe(301);
  });

  it("does NOT redirect new domain requests", async () => {
    process.env.ENABLE_OLD_DOMAIN_REDIRECTS = "true";
    process.env.OLD_DOMAIN = "leasebase.co";
    const middleware = await loadMiddleware();

    const req = makeRequest("https://app.dev.leasebase.ai/auth/login", "app.dev.leasebase.ai");
    const res = middleware(req);

    expect(res.status).not.toBe(301);
  });

  it("307 redirects root path to /auth/login on new domain", async () => {
    process.env.ENABLE_OLD_DOMAIN_REDIRECTS = "false";
    const middleware = await loadMiddleware();

    const req = makeRequest("https://app.dev.leasebase.ai/", "app.dev.leasebase.ai");
    const res = middleware(req);

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/login");
  });
});
