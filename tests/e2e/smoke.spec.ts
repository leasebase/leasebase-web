import { test, expect } from "@playwright/test";

/**
 * E2E smoke tests for the current route structure.
 * These require the dev server running with NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true.
 */
test.describe("Smoke tests with dev bypass auth", () => {
  test("PM can log in via dev bypass and see portfolio dashboard", async ({ page }) => {
    await page.goto("/auth/login");

    // Fill dev bypass fields
    await page.fill('#dev-email', 'pm@test.com');
    await page.fill('#dev-org', 'org-test');
    await page.selectOption('#dev-role', 'ORG_ADMIN');
    await page.click('text=Sign in with dev bypass');

    // Should land on /app
    await page.waitForURL('/app', { timeout: 10000 });
    await expect(page.locator('text=Portfolio overview')).toBeVisible();
  });

  test("Tenant can log in via dev bypass and see tenant dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('#dev-email', 'tenant@test.com');
    await page.fill('#dev-org', 'org-test');
    await page.selectOption('#dev-role', 'TENANT');
    await page.click('text=Sign in with dev bypass');

    await page.waitForURL('/app', { timeout: 10000 });
    await expect(page.locator('text=Tenant dashboard')).toBeVisible();
  });

  test("Sidebar navigation renders for PM", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('#dev-email', 'pm@test.com');
    await page.fill('#dev-org', 'org-test');
    await page.selectOption('#dev-role', 'ORG_ADMIN');
    await page.click('text=Sign in with dev bypass');
    await page.waitForURL('/app', { timeout: 10000 });

    // Check sidebar links
    await expect(page.locator('nav[aria-label="Primary navigation"] >> text=Properties')).toBeVisible();
    await expect(page.locator('nav[aria-label="Primary navigation"] >> text=Maintenance')).toBeVisible();
  });
});
