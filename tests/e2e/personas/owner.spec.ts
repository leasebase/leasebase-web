import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/login";
import { navigateTo, expectPageHeading, waitForContent } from "../helpers/nav";

/**
 * Owner / ORG_ADMIN Persona — E2E Walkthrough
 *
 * Uses seeded owner: owner@pm.local (OWNER, pm-demo org).
 *
 * Current state of owner pages (verified from source):
 * - Dashboard: OwnerDashboard — live (fetches /api/dashboard/owner)
 * - Properties: "Coming soon" fallback (no owner-specific view, PM view is persona-gated)
 * - Leases: "Coming soon"
 * - Payments: "Coming soon" fallback (PM view is persona-gated)
 * - Maintenance: "Coming soon" fallback (tenant view is persona-gated, PM view is persona-gated)
 * - Documents: "Coming soon" fallback (tenant view is persona-gated, PM view is persona-gated)
 * - Messages: "Coming soon"
 * - Notifications: Live (shared across all personas)
 * - Reports: "Coming soon"
 * - Settings: Shows Account card, but no Tenant Profile section
 */

test.describe("Owner walkthrough", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "owner");
  });

  // ── Dashboard ──

  test("dashboard loads with owner heading", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Owner dashboard" })).toBeVisible();
    await expect(page.locator("#main-content")).not.toBeEmpty();
  });

  // ── Properties (Coming soon for owner — PM view is persona-gated) ──

  test("properties page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Properties", "/app/properties");
    await expectPageHeading(page, "Properties");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Leases ──

  test("leases page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Leases", "/app/leases");
    await expectPageHeading(page, "Leases");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Payments (Coming soon for owner) ──

  test("payments page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Payments", "/app/payments");
    await expectPageHeading(page, "Payments");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Maintenance (Coming soon for owner) ──

  test("maintenance page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Maintenance", "/app/maintenance");
    await expectPageHeading(page, "Maintenance");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Documents (Coming soon for owner) ──

  test("documents page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Documents", "/app/documents");
    await expectPageHeading(page, "Documents");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Messages ──

  test("messages page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Messages", "/app/messages");
    await expectPageHeading(page, "Messages");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Notifications (Live — shared) ──

  test("notifications page loads for owner", async ({ page }) => {
    await navigateTo(page, "Notifications", "/app/notifications");
    await expectPageHeading(page, "Notifications");

    const hasNotifications = await page.locator("li").first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText("No notifications yet").isVisible().catch(() => false);
    expect(hasNotifications || hasEmptyState).toBeTruthy();
  });

  // ── Reports ──

  test("reports page shows coming soon for owner", async ({ page }) => {
    await navigateTo(page, "Reports", "/app/reports");
    await expectPageHeading(page, "Reports");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Settings ──

  test("settings page shows account info without tenant profile section", async ({ page }) => {
    await navigateTo(page, "Settings", "/app/settings");
    await expectPageHeading(page, "Settings");

    await expect(page.getByText("Account")).toBeVisible();
    await expect(page.getByText("Name")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();

    // Owner should NOT have the "Tenant Profile" section
    const hasTenantProfile = await page.getByText("Tenant Profile").isVisible().catch(() => false);
    expect(hasTenantProfile).toBeFalsy();
  });
});
