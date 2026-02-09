import { test, expect } from "@playwright/test";

test.describe("Smoke tests with dev mock auth", () => {
  test("PM can log in and load dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="orgId"]', "org-test");
    await page.fill('input[name="email"]', "pm@test.com");
    await page.selectOption('select', { value: "ORG_ADMIN" });
    await page.click('button[type="submit"]');
    await page.waitForURL("/pm");
    await expect(page.locator("text=Management dashboard")).toBeVisible();
  });

  test("PM can navigate to properties", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="orgId"]', "org-test");
    await page.fill('input[name="email"]', "pm@test.com");
    await page.selectOption('select', { value: "ORG_ADMIN" });
    await page.click('button[type="submit"]');
    await page.waitForURL("/pm");
    await page.click('a[href="/pm/properties"]');
    await expect(page.locator("text=Properties")).toBeVisible();
  });

  test("Tenant can log in and load dashboard", async ({ page }) => {
    await page.goto("/auth/login");
    await page.fill('input[name="orgId"]', "org-test");
    await page.fill('input[name="email"]', "tenant@test.com");
    await page.selectOption('select', { value: "TENANT" });
    await page.click('button[type="submit"]');
    await page.waitForURL("/tenant");
    await expect(page.locator("text=Tenant dashboard")).toBeVisible();
  });
});
