import { test as base, type Page } from "@playwright/test";
import { loginAs } from "../helpers/login";
import type { PersonaKey } from "../helpers/config";

/**
 * Extended test fixture that provides pre-authenticated pages.
 *
 * Usage:
 *   import { test } from "../fixtures/auth.fixture";
 *   test("my test", async ({ tenantPage }) => { ... });
 */
export const test = base.extend<{
  tenantPage: Page;
  pmStaffPage: Page;
  pmAdminPage: Page;
  ownerPage: Page;
  /** Login as any persona dynamically. */
  loginAsPersona: (page: Page, persona: PersonaKey) => Promise<void>;
}>({
  tenantPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "tenant");
    await use(page);
    await context.close();
  },

  pmStaffPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "pmStaff");
    await use(page);
    await context.close();
  },

  pmAdminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "pmAdmin");
    await use(page);
    await context.close();
  },

  ownerPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAs(page, "owner");
    await use(page);
    await context.close();
  },

  loginAsPersona: async ({}, use) => {
    await use(async (page: Page, persona: PersonaKey) => {
      await loginAs(page, persona);
    });
  },
});

export { expect } from "@playwright/test";
