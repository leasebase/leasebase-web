import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/login";
import { sidebar, expectNavItem, expectNoNavItem } from "../helpers/nav";

/**
 * Auth + Persona Routing Smoke Tests
 *
 * Validates that:
 * - Unauthenticated users are redirected to login
 * - Each persona lands on the correct dashboard
 * - Sidebar navigation shows only persona-appropriate items
 *
 * These tests fully supersede the original smoke.spec.ts coverage.
 */

test.describe("Auth guard", () => {
  test("unauthenticated user is redirected to /auth/login", async ({ page }) => {
    await page.goto("/app");
    await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("/auth/login");
  });

  test("unauthenticated deep link preserves ?next param", async ({ page }) => {
    await page.goto("/app/maintenance");
    await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
    expect(page.url()).toContain("next=");
  });
});

test.describe("Persona dashboard routing", () => {
  test("TENANT lands on tenant dashboard", async ({ page }) => {
    await loginAs(page, "tenant");
    await expect(page.getByRole("heading", { name: "Tenant dashboard" })).toBeVisible();
  });

  test("PM_STAFF lands on PM portfolio dashboard", async ({ page }) => {
    await loginAs(page, "pmStaff");
    await expect(page.getByRole("heading", { name: "Portfolio overview" })).toBeVisible();
  });

  test("ORG_ADMIN lands on PM portfolio dashboard", async ({ page }) => {
    await loginAs(page, "pmAdmin");
    await expect(page.getByRole("heading", { name: "Portfolio overview" })).toBeVisible();
  });

  test("OWNER lands on owner dashboard", async ({ page }) => {
    await loginAs(page, "owner");
    await expect(page.getByRole("heading", { name: "Owner dashboard" })).toBeVisible();
  });
});

test.describe("Sidebar navigation per persona", () => {
  test("tenant sees tenant nav items only", async ({ page }) => {
    await loginAs(page, "tenant");

    // Tenant should see
    await expectNavItem(page, "Dashboard");
    await expectNavItem(page, "Pay Rent");
    await expectNavItem(page, "Payment History");
    await expectNavItem(page, "Maintenance");
    await expectNavItem(page, "Documents");
    await expectNavItem(page, "Settings");

    // Tenant should NOT see
    await expectNoNavItem(page, "Properties");
    await expectNoNavItem(page, "Units");
    await expectNoNavItem(page, "Tenants");
    await expectNoNavItem(page, "Payments");
    await expectNoNavItem(page, "Rent Roll");
  });

  test("PM sees PM nav items", async ({ page }) => {
    await loginAs(page, "pmStaff");

    await expectNavItem(page, "Dashboard");
    await expectNavItem(page, "Properties");
    await expectNavItem(page, "Units");
    await expectNavItem(page, "Tenants");
    await expectNavItem(page, "Payments");
    await expectNavItem(page, "Maintenance");
    await expectNavItem(page, "Documents");

    // PM should NOT see tenant-only items
    await expectNoNavItem(page, "Pay Rent");
    await expectNoNavItem(page, "Payment History");
  });

  test("owner sees owner nav items", async ({ page }) => {
    await loginAs(page, "owner");

    await expectNavItem(page, "Dashboard");
    await expectNavItem(page, "Properties");
    await expectNavItem(page, "Payments");
    await expectNavItem(page, "Maintenance");
    await expectNavItem(page, "Documents");
    await expectNavItem(page, "Reports");

    // Owner should NOT see
    await expectNoNavItem(page, "Units");
    await expectNoNavItem(page, "Tenants");
    await expectNoNavItem(page, "Pay Rent");
    await expectNoNavItem(page, "Payment History");
    await expectNoNavItem(page, "Rent Roll");
  });
});
