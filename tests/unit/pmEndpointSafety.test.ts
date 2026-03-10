/**
 * PM Endpoint Safety Tests
 *
 * These tests verify that PM service code ONLY calls /api/pm/* endpoints.
 * They must fail if any PM adapter calls org-wide endpoints like
 * /api/properties, /api/leases, /api/tenants, etc.
 *
 * GUARDRAIL: These tests are additive and must not be removed.
 */

import { assertPMPath, PM_ALLOWED_PATH_PREFIX } from "@/services/pm/permissions";

describe("PM endpoint safety", () => {
  describe("assertPMPath", () => {
    test("allows api/pm/dashboard", () => {
      expect(() => assertPMPath("api/pm/dashboard")).not.toThrow();
    });

    test("allows api/pm/properties", () => {
      expect(() => assertPMPath("api/pm/properties")).not.toThrow();
    });

    test("allows api/pm/properties/abc123", () => {
      expect(() => assertPMPath("api/pm/properties/abc123")).not.toThrow();
    });

    test("allows /api/pm/maintenance (leading slash)", () => {
      expect(() => assertPMPath("/api/pm/maintenance")).not.toThrow();
    });

    test("allows api/pm/payments", () => {
      expect(() => assertPMPath("api/pm/payments")).not.toThrow();
    });

    test("allows api/pm/tenants", () => {
      expect(() => assertPMPath("api/pm/tenants")).not.toThrow();
    });

    test("allows api/pm/documents", () => {
      expect(() => assertPMPath("api/pm/documents")).not.toThrow();
    });

    // ── Phase 2: detail + nested paths ──

    test("allows api/pm/units/abc", () => {
      expect(() => assertPMPath("api/pm/units/abc")).not.toThrow();
    });

    test("allows api/pm/tenants/abc", () => {
      expect(() => assertPMPath("api/pm/tenants/abc")).not.toThrow();
    });

    test("allows api/pm/maintenance/abc/status", () => {
      expect(() => assertPMPath("api/pm/maintenance/abc/status")).not.toThrow();
    });

    test("allows api/pm/maintenance/abc/comments", () => {
      expect(() => assertPMPath("api/pm/maintenance/abc/comments")).not.toThrow();
    });

    test("allows api/pm/payments/abc", () => {
      expect(() => assertPMPath("api/pm/payments/abc")).not.toThrow();
    });

    test("allows api/pm/documents/abc", () => {
      expect(() => assertPMPath("api/pm/documents/abc")).not.toThrow();
    });

    // ── MUST REJECT org-wide endpoints ──

    test("rejects api/properties", () => {
      expect(() => assertPMPath("api/properties")).toThrow("PM safety violation");
    });

    test("rejects /api/properties", () => {
      expect(() => assertPMPath("/api/properties")).toThrow("PM safety violation");
    });

    test("rejects api/leases", () => {
      expect(() => assertPMPath("api/leases")).toThrow("PM safety violation");
    });

    test("rejects api/tenants", () => {
      expect(() => assertPMPath("api/tenants")).toThrow("PM safety violation");
    });

    test("rejects api/maintenance", () => {
      expect(() => assertPMPath("api/maintenance")).toThrow("PM safety violation");
    });

    test("rejects api/payments", () => {
      expect(() => assertPMPath("api/payments")).toThrow("PM safety violation");
    });

    test("rejects api/payments/ledger", () => {
      expect(() => assertPMPath("api/payments/ledger")).toThrow("PM safety violation");
    });

    test("rejects api/documents", () => {
      expect(() => assertPMPath("api/documents")).toThrow("PM safety violation");
    });

    test("rejects api/auth/me", () => {
      expect(() => assertPMPath("api/auth/me")).toThrow("PM safety violation");
    });

    test("rejects empty string", () => {
      expect(() => assertPMPath("")).toThrow("PM safety violation");
    });

    test("rejects api/pm without trailing slash (not a valid endpoint path)", () => {
      // "api/pm" alone is not "api/pm/" prefix — edge case
      expect(() => assertPMPath("api/pm")).toThrow("PM safety violation");
    });
  });

  describe("PM_ALLOWED_PATH_PREFIX constant", () => {
    test("is api/pm/", () => {
      expect(PM_ALLOWED_PATH_PREFIX).toBe("api/pm/");
    });
  });
});

/**
 * Static analysis: verify the PM service module only imports from
 * allowed sources (no direct import of org-wide service modules).
 */
describe("PM service module imports", () => {
  test("pmDashboardService only imports from pm/ and lib/", () => {
    const fs = require("fs");
    const path = require("path");
    const serviceFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/services/pm/pmDashboardService.ts"),
      "utf-8",
    );

    expect(serviceFile).not.toContain("from \"@/services/dashboard/ownerDashboardService\"");
    expect(serviceFile).not.toContain("from \"@/services/tenant/");
    expect(serviceFile).not.toMatch(/["']api\/properties["']/);
    expect(serviceFile).not.toMatch(/["']api\/leases["']/);
    expect(serviceFile).not.toMatch(/["']api\/tenants["']/);
    expect(serviceFile).not.toMatch(/["']api\/maintenance["']/);
    expect(serviceFile).not.toMatch(/["']api\/payments["']/);
    expect(serviceFile).not.toMatch(/["']api\/documents["']/);
  });

  test("pmApiService only imports from pm/ and lib/", () => {
    const fs = require("fs");
    const path = require("path");
    const serviceFile = fs.readFileSync(
      path.resolve(__dirname, "../../src/services/pm/pmApiService.ts"),
      "utf-8",
    );

    expect(serviceFile).not.toContain("from \"@/services/dashboard/");
    expect(serviceFile).not.toContain("from \"@/services/tenant/");
    expect(serviceFile).not.toMatch(/["']api\/properties["']/);
    expect(serviceFile).not.toMatch(/["']api\/leases["']/);
    expect(serviceFile).not.toMatch(/["']api\/tenants["']/);
    expect(serviceFile).not.toMatch(/["']api\/maintenance["']/);
    expect(serviceFile).not.toMatch(/["']api\/payments["']/);
    expect(serviceFile).not.toMatch(/["']api\/documents["']/);
  });
});
