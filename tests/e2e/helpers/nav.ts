import { expect, type Page, type Locator } from "@playwright/test";

/** The desktop sidebar <nav> element. */
export function sidebar(page: Page): Locator {
  return page.locator('nav[aria-label="Primary navigation"]').first();
}

/** Assert that a sidebar link with the given label is visible. */
export async function expectNavItem(page: Page, label: string): Promise<void> {
  await expect(sidebar(page).getByText(label, { exact: true })).toBeVisible();
}

/** Assert that a sidebar link with the given label is NOT visible. */
export async function expectNoNavItem(page: Page, label: string): Promise<void> {
  await expect(sidebar(page).getByText(label, { exact: true })).not.toBeVisible();
}

/** Navigate to a page via sidebar link. */
export async function clickNavItem(page: Page, label: string): Promise<void> {
  await sidebar(page).getByText(label, { exact: true }).click();
}

/** Wait until the main content area finishes the loading skeleton. */
export async function waitForContent(page: Page): Promise<void> {
  // The layout shows an animate-pulse skeleton when isLoading is true.
  // Wait for that to disappear, meaning auth resolved and content rendered.
  await page.locator("#main-content .animate-pulse").waitFor({ state: "hidden", timeout: 10_000 }).catch(() => {
    // If there's no skeleton at all, that's fine — content loaded immediately
  });
}

/**
 * Navigate via sidebar and wait for URL to match the expected path.
 */
export async function navigateTo(page: Page, label: string, expectedPath: string): Promise<void> {
  await clickNavItem(page, label);
  await page.waitForURL(new RegExp(expectedPath.replace(/\//g, "\\/")), { timeout: 10_000 });
  await waitForContent(page);
}

/** Assert page heading text is visible (PageHeader component renders h1/h2). */
export async function expectPageHeading(page: Page, text: string): Promise<void> {
  await expect(page.getByRole("heading", { name: text })).toBeVisible({ timeout: 10_000 });
}
