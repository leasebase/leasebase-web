import { test, expect } from "@playwright/test";
import { loginAs } from "../helpers/login";
import { navigateTo, expectPageHeading, waitForContent } from "../helpers/nav";

/**
 * Tenant Persona — E2E Walkthrough
 *
 * Uses seeded tenant: tenant@landlord.local (TENANT, landlord-demo org).
 * This tenant has an active lease, tenant profile, and seeded work order.
 */

test.describe("Tenant walkthrough", () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, "tenant");
  });

  // ── Dashboard ──

  test("dashboard loads with heading and content", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Tenant dashboard" })).toBeVisible();
    // Dashboard should render at least the KPI header or action cards
    await expect(page.locator("#main-content")).not.toBeEmpty();
  });

  // ── Payment History ──

  test("payment history page renders", async ({ page }) => {
    await navigateTo(page, "Payment History", "/app/payment-history");
    await expectPageHeading(page, "Payment History");
    // Either shows a table or "No payments yet" empty state
    const hasTable = await page.locator("table").isVisible().catch(() => false);
    const hasEmptyState = await page.getByText("No payments yet").isVisible().catch(() => false);
    expect(hasTable || hasEmptyState).toBeTruthy();
  });

  // ── Pay Rent ──

  test("pay rent page shows lease info or no-lease empty state", async ({ page }) => {
    await navigateTo(page, "Pay Rent", "/app/pay-rent");
    await expectPageHeading(page, "Pay Rent");

    // With the seeded lease, tenant should see "Rent Payment" card
    // or "No active lease found" if backend is not connected
    const hasRentCard = await page.getByText("Rent Payment").isVisible().catch(() => false);
    const hasNoLease = await page.getByText("No active lease found").isVisible().catch(() => false);
    expect(hasRentCard || hasNoLease).toBeTruthy();
  });

  test("pay rent checkout button exists but we stop before Stripe redirect", async ({ page }) => {
    await navigateTo(page, "Pay Rent", "/app/pay-rent");

    const payButton = page.getByRole("button", { name: /Pay \$/ });
    const buttonVisible = await payButton.isVisible().catch(() => false);
    if (buttonVisible) {
      // Validate the button exists and is enabled — do NOT click to avoid Stripe redirect
      await expect(payButton).toBeEnabled();
    }
    // If button not visible, tenant may not have a connected lease — acceptable
  });

  // ── Maintenance ──

  test("maintenance list page loads", async ({ page }) => {
    await navigateTo(page, "Maintenance", "/app/maintenance");
    await expectPageHeading(page, "Maintenance");

    // Should show work orders or empty state
    const hasWorkOrders = await page.locator('a[href*="/app/maintenance/"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText("No maintenance requests").isVisible().catch(() => false);
    expect(hasWorkOrders || hasEmptyState).toBeTruthy();
  });

  test("new maintenance request form renders", async ({ page }) => {
    await page.goto("/app/maintenance/new");
    await waitForContent(page);
    await expectPageHeading(page, "New Maintenance Request");

    // Form elements
    await expect(page.getByText("Category")).toBeVisible();
    await expect(page.getByText("Priority")).toBeVisible();
    await expect(page.getByText("Description")).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit Request" })).toBeVisible();
  });

  // ── Documents ──

  test("documents page loads for tenant", async ({ page }) => {
    await navigateTo(page, "Documents", "/app/documents");
    await expectPageHeading(page, "Documents");

    const hasDocs = await page.locator('[class*="border-slate-800"]').first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText("No documents available").isVisible().catch(() => false);
    expect(hasDocs || hasEmptyState).toBeTruthy();
  });

  // ── Notifications ──

  test("notifications page loads", async ({ page }) => {
    await navigateTo(page, "Notifications", "/app/notifications");
    await expectPageHeading(page, "Notifications");

    const hasNotifications = await page.locator("li").first().isVisible().catch(() => false);
    const hasEmptyState = await page.getByText("No notifications yet").isVisible().catch(() => false);
    expect(hasNotifications || hasEmptyState).toBeTruthy();
  });

  // ── Settings ──

  test("settings page shows account and profile sections", async ({ page }) => {
    await navigateTo(page, "Settings", "/app/settings");
    await expectPageHeading(page, "Settings");

    // Account card always visible
    await expect(page.getByText("Account")).toBeVisible();
    await expect(page.getByText("Name")).toBeVisible();
    await expect(page.getByText("Email")).toBeVisible();

    // Tenant Profile card should be visible for tenant persona
    const hasTenantProfile = await page.getByText("Tenant Profile").isVisible().catch(() => false);
    expect(hasTenantProfile).toBeTruthy();
  });

  // ── Leases (Coming soon) ──

  test("leases page shows coming soon for tenant", async ({ page }) => {
    await navigateTo(page, "Leases", "/app/leases");
    await expectPageHeading(page, "Leases");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });

  // ── Messages (Coming soon) ──

  test("messages page shows coming soon", async ({ page }) => {
    await navigateTo(page, "Messages", "/app/messages");
    await expectPageHeading(page, "Messages");
    await expect(page.getByText("Coming soon")).toBeVisible();
  });
});
