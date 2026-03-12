import fs from "fs";
import path from "path";
import { getPortalUrlForRole } from "@/lib/hostname";

/**
 * Regression guard: every path returned by getPortalUrlForRole() MUST
 * correspond to a real Next.js page in the app/ directory.
 *
 * This prevents future mismatches where the redirect helper points users
 * to a route that doesn't exist (the /owner and /tenant 404 regression).
 */

const APP_DIR = path.resolve(__dirname, "../../app");

/** Map a URL path to possible Next.js file-system locations. */
function routeExists(urlPath: string): boolean {
  // Strip leading slash
  const segments = urlPath.replace(/^\//, "");

  // Direct route: app/<segments>/page.tsx
  const directPage = path.join(APP_DIR, segments, "page.tsx");
  if (fs.existsSync(directPage)) return true;

  // Route group: app/(<group>)/<segments>/page.tsx — check all groups
  const entries = fs.readdirSync(APP_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory() && entry.name.startsWith("(")) {
      const groupPage = path.join(APP_DIR, entry.name, segments, "page.tsx");
      if (fs.existsSync(groupPage)) return true;
    }
  }

  return false;
}

const ALL_ROLES = ["OWNER", "TENANT"];

describe("Route existence — getPortalUrlForRole targets must be real pages", () => {
  for (const role of ALL_ROLES) {
    test(`${role} redirect target exists as a Next.js page`, () => {
      const target = getPortalUrlForRole(role);
      expect(target).not.toBeNull();
      expect(routeExists(target!)).toBe(true);
    });
  }
});
