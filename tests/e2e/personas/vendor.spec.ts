import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/login";
import { waitForContent, expectPageHeading } from "../helpers/nav";

/**
 * Vendor Persona — Scaffolded E2E Tests
 *
 * The vendor persona is NOT yet implemented in the app.
 * Vendor pages (/app/vendor, /app/vendor/[id]) show "Coming soon" placeholders.
 * No vendor user is currently seeded in the database.
 *
 * These tests are scaffolded for when the vendor persona is built out.
 * The only runnable test validates that the vendor dashboard placeholder renders.
 *
 * TODO: When vendor persona is implemented, add:
 * - Vendor login and dashboard
 * - Assigned work orders list
 * - Work order detail with status updates
 * - Comment thread on work orders
 * - Invoice upload flow
 * - Vendor-specific nav items validation
 */

test.describe("Vendor persona (scaffolded)", () => {
  /**
   * Validates that the vendor dashboard route exists and renders a placeholder.
   * Since no vendor user is seeded, we log in as PM and navigate directly.
   */
  test("vendor dashboard route renders Coming soon placeholder", async ({ page }) => {
    // Use a PM user since no vendor is seeded, then navigate directly
    await loginAs(page, "pmStaff");
    await page.goto("/app/vendor");
    await waitForContent(page);
    await expectPageHeading(page, "Vendor Dashboard");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  test("vendor work order detail route renders Coming soon placeholder", async ({ page }) => {
    await loginAs(page, "pmStaff");
    await page.goto("/app/vendor/some-id");
    await waitForContent(page);
    await expectPageHeading(page, "Work Order Detail");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Scaffolded tests — skip until vendor persona is implemented ──

  test.skip("vendor login lands on vendor dashboard", async () => {
    // TODO: Implement when vendor user is seeded and vendor persona routing exists
  });

  test.skip("vendor sees assigned work orders list", async () => {
    // TODO: Implement when GET /api/vendor/work-orders is live
  });

  test.skip("vendor can view work order detail", async () => {
    // TODO: Implement when vendor detail page is built
  });

  test.skip("vendor can update work order status", async () => {
    // TODO: Implement when PATCH /api/vendor/work-orders/:id/status is live
  });

  test.skip("vendor can add comments to work order", async () => {
    // TODO: Implement when vendor comment flow is built
  });

  test.skip("vendor can upload invoice", async () => {
    // TODO: Implement when invoice upload flow is built
  });
});
