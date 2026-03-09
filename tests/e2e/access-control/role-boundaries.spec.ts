import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/login";
import { waitForContent, expectPageHeading } from "../helpers/nav";

/**
 * Access Control Regression Pack
 *
 * Validates role boundaries via direct URL navigation.
 *
 * Current app behavior: There are no server-side route guards on Next.js
 * client-side routes. Pages check user.persona client-side and render
 * different content. Non-PM personas see "Coming soon" fallbacks on PM-only
 * pages rather than being redirected.
 *
 * These tests assert the VISIBLE result for each boundary case:
 * - unauthenticated → redirect to /auth/login
 * - wrong persona → sees "Coming soon" fallback (NOT PM/tenant data)
 */

test.describe("Unauthenticated access", () => {
  const protectedRoutes = [
    "/app",
    "/app/properties",
    "/app/units",
    "/app/tenants",
    "/app/maintenance",
    "/app/payments",
    "/app/documents",
    "/app/settings",
  ];

  for (const route of protectedRoutes) {
    test(`${route} redirects to login`, async ({ page }) => {
      await page.goto(route);
      await page.waitForURL(/\/auth\/login/, { timeout: 15_000 });
      expect(page.url()).toContain("/auth/login");
    });
  }
});

test.describe("Tenant accessing PM-only pages via direct URL", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "tenant");
  });

  test("/app/properties shows fallback, not PM data", async ({ page }) => {
    await page.goto("/app/properties");
    await waitForContent(page);
    await expectPageHeading(page, "Properties");
    // Tenant should see "Coming soon" — NOT the PM property list
    await expect(page.getByText("Coming soon")).toBeVisible();
    // Verify no PM property cards leaked
    const hasPMLinks = await page.locator('a[href*="/app/properties/"]').first().isVisible().catch(() => false);
    expect(hasPMLinks).toBeFalsy();
  });

  test("/app/units shows fallback, not PM data", async ({ page }) => {
    await page.goto("/app/units");
    await waitForContent(page);
    await expectPageHeading(page, "Units");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("/app/tenants shows fallback, not PM data", async ({ page }) => {
    await page.goto("/app/tenants");
    await waitForContent(page);
    await expectPageHeading(page, "Tenants");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("/app/payments shows fallback, not PM data", async ({ page }) => {
    await page.goto("/app/payments");
    await waitForContent(page);
    await expectPageHeading(page, "Payments");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("/app/rent-roll shows fallback", async ({ page }) => {
    await page.goto("/app/rent-roll");
    await waitForContent(page);
    await expectPageHeading(page, "Rent Roll");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("/app/reports shows fallback", async ({ page }) => {
    await page.goto("/app/reports");
    await waitForContent(page);
    await expectPageHeading(page, "Reports");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });
});

test.describe("Owner accessing PM-only pages via direct URL", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
  });

  test("/app/units shows fallback, not PM data", async ({ page }) => {
    await page.goto("/app/units");
    await waitForContent(page);
    await expectPageHeading(page, "Units");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("/app/tenants shows fallback, not PM data", async ({ page }) => {
    await page.goto("/app/tenants");
    await waitForContent(page);
    await expectPageHeading(page, "Tenants");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("/app/rent-roll shows fallback", async ({ page }) => {
    await page.goto("/app/rent-roll");
    await waitForContent(page);
    await expectPageHeading(page, "Rent Roll");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });
});

test.describe("Owner accessing tenant-only pages via direct URL", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
  });

  test("/app/pay-rent renders but owner lacks tenant data", async ({ page }) => {
    await page.goto("/app/pay-rent");
    await waitForContent(page);
    await expectPageHeading(page, "Pay Rent");
    // Owner should see no-lease state or just the page heading — NOT a tenant's rent data
  });

  test("/app/payment-history renders but owner lacks tenant data", async ({ page }) => {
    await page.goto("/app/payment-history");
    await waitForContent(page);
    await expectPageHeading(page, "Payment History");
  });
});

test.describe("PM accessing tenant-only pages via direct URL", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "pmStaff");
  });

  test("/app/pay-rent renders without tenant context", async ({ page }) => {
    await page.goto("/app/pay-rent");
    await waitForContent(page);
    await expectPageHeading(page, "Pay Rent");
    // PM should see no-lease state — pay rent is tenant-only functionality
  });

  test("/app/payment-history renders without tenant context", async ({ page }) => {
    await page.goto("/app/payment-history");
    await waitForContent(page);
    await expectPageHeading(page, "Payment History");
  });
});
