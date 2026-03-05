import { globSync } from "glob";
import { readFileSync } from "node:fs";
import { relative } from "node:path";
import { repoPath } from "./utils.js";

/* ── Types ────────────────────────────────────────────────────── */

export interface RouteInfo {
  /** URL route path, e.g. "/auth/login" */
  route: string;
  /** Relative file path from repo root, e.g. "app/auth/login/page.tsx" */
  filePath: string;
  /** true if the page contains a redirect() call */
  isRedirect: boolean;
  /** The redirect target, if any */
  redirectTarget?: string;
  /** Components imported/used in the page */
  components: string[];
  /** API endpoints referenced (fetch / apiRequest paths) */
  apiCalls: string[];
  /** router.push / Link href targets found in this page */
  navigationTargets: string[];
  /** Whether the page uses useRequireAuth (requires login) */
  requiresAuth: boolean;
  /** Raw source content (not exported, used internally) */
  _source: string;
}

/* ── Extraction ───────────────────────────────────────────────── */

/**
 * Convert a filesystem path like `app/auth/login/page.tsx`
 * to a URL route like `/auth/login`.
 */
function filePathToRoute(filePath: string): string {
  const stripped = filePath
    .replace(/^app\//, "")
    .replace(/\/page\.tsx$/, "")
    .replace(/\/page\.ts$/, "")
    .replace(/^page\.tsx$/, "")
    .replace(/^page\.ts$/, "");
  return "/" + stripped;
}

function extractComponents(source: string): string[] {
  const components: string[] = [];
  // Match import { Foo, Bar } from "..." and import Foo from "..."
  const importRe = /import\s+(?:\{([^}]+)\}|(\w+))\s+from\s+["']([^"']+)["']/g;
  let match: RegExpExecArray | null;
  while ((match = importRe.exec(source)) !== null) {
    const from = match[3];
    // Skip non-component imports (hooks, utils, etc.)
    if (from.includes("/ui/") || from.includes("/components/") || from.includes("/dashboards/")) {
      if (match[1]) {
        components.push(...match[1].split(",").map((s) => s.trim()).filter(Boolean));
      }
      if (match[2]) {
        components.push(match[2].trim());
      }
    }
  }
  return [...new Set(components)];
}

function extractApiCalls(source: string): string[] {
  const calls: string[] = [];
  // Match fetch(`${base}/auth/login` ...) patterns
  const fetchRe = /fetch\(\s*`\$\{[^}]+\}\/([^`"']+)`/g;
  let match: RegExpExecArray | null;
  while ((match = fetchRe.exec(source)) !== null) {
    calls.push("/" + match[1]);
  }
  // Match apiRequest({ path: "..." })
  const apiReqRe = /path:\s*["']([^"']+)["']/g;
  while ((match = apiReqRe.exec(source)) !== null) {
    const p = match[1].startsWith("/") ? match[1] : "/" + match[1];
    calls.push(p);
  }
  return [...new Set(calls)];
}

function extractNavigationTargets(source: string): string[] {
  const targets: string[] = [];
  // router.push("...") / router.replace("...")
  const routerRe = /router\.(push|replace)\(\s*["'`]([^"'`]+)["'`]/g;
  let match: RegExpExecArray | null;
  while ((match = routerRe.exec(source)) !== null) {
    targets.push(match[2]);
  }
  // <Link href="..." or href={"/..."}
  const linkRe = /href=["'{]?\s*["'`]([^"'`]+)["'`]/g;
  while ((match = linkRe.exec(source)) !== null) {
    targets.push(match[1]);
  }
  return [...new Set(targets)].filter((t) => t.startsWith("/"));
}

function extractRedirect(source: string): { isRedirect: boolean; target?: string } {
  const redirectRe = /redirect\(\s*["']([^"']+)["']\s*\)/;
  const match = redirectRe.exec(source);
  if (match) {
    return { isRedirect: true, target: match[1] };
  }
  return { isRedirect: false };
}

/* ── Public API ───────────────────────────────────────────────── */

export function extractRoutes(): RouteInfo[] {
  const appDir = repoPath("app");
  const pageFiles = globSync("**/page.{tsx,ts}", { cwd: appDir });

  return pageFiles.map((file) => {
    const fullPath = repoPath("app", file);
    const source = readFileSync(fullPath, "utf-8");
    const relPath = "app/" + file;
    const route = filePathToRoute(relPath);
    const { isRedirect, target } = extractRedirect(source);

    return {
      route: route || "/",
      filePath: relPath,
      isRedirect,
      redirectTarget: target,
      components: extractComponents(source),
      apiCalls: extractApiCalls(source),
      navigationTargets: extractNavigationTargets(source),
      requiresAuth: source.includes("useRequireAuth"),
      _source: source,
    };
  });
}
