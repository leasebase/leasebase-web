import type { Page } from "@playwright/test";
import type { PersonaKey } from "./config";
import { personas } from "./config";

/**
 * Log in via the dev bypass mechanism on the login page.
 *
 * Prerequisites:
 * - The app must be running with NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH=true
 * - The backend must be running with DEV_AUTH_BYPASS enabled
 *
 * After login, waits for navigation to /app.
 */
export async function loginAs(page: Page, persona: PersonaKey): Promise<void> {
  const creds = personas[persona];

  await page.goto("/auth/login");

  // Fill dev bypass fields
  await page.fill("#dev-email", creds.email);
  await page.fill("#dev-org", creds.orgId);
  await page.selectOption("#dev-role", creds.role);

  // Click the dev bypass sign-in button
  await page.click('button:has-text("Sign in with dev bypass")');

  // Wait for redirect to /app
  await page.waitForURL(/\/app/, { timeout: 15_000 });
}

/**
 * Log out by clicking the Sign out button in the header.
 */
export async function logout(page: Page): Promise<void> {
  await page.click('button[aria-label="Sign out"]');
  await page.waitForURL(/\/auth\/login/, { timeout: 10_000 });
}
