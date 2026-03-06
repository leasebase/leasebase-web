import { readRepoFile } from "./utils.js";
import type { RouteInfo } from "./extractRoutes.js";

/* ── Types ────────────────────────────────────────────────────── */

export interface PermissionEntry {
  route: string;
  label: string;
  personas: string[];
  isFuture: boolean;
}

export interface PermissionsMatrix {
  personas: string[];
  entries: PermissionEntry[];
}

/* ── AST-based extraction from appNav.ts ──────────────────────── */

function extractNavPermissions(): PermissionEntry[] {
  const navSource = readRepoFile("src", "lib", "appNav.ts");
  if (!navSource) return [];

  const entries: PermissionEntry[] = [];

  // Regex-based extraction (more resilient than full AST for simple array literals)
  const itemRe = /\{\s*path:\s*"([^"]+)",\s*label:\s*"([^"]+)"[^}]*personas:\s*\[([^\]]+)\][^}]*(?:isFuture:\s*(true|false))?[^}]*\}/g;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(navSource)) !== null) {
    const personas = match[3]
      .split(",")
      .map((s) => s.trim().replace(/["']/g, ""))
      .filter(Boolean);
    entries.push({
      route: match[1],
      label: match[2],
      personas,
      isFuture: match[4] === "true",
    });
  }

  return entries;
}

/* ── Extract all persona types from roles.ts ─────────────────── */

function extractPersonas(): string[] {
  const rolesSource = readRepoFile("src", "lib", "auth", "roles.ts");
  if (!rolesSource) return ["propertyManager", "owner", "tenant"];

  const typeRe = /type\s+Persona\s*=\s*([^;]+)/;
  const match = typeRe.exec(rolesSource);
  if (!match) return ["propertyManager", "owner", "tenant"];

  return match[1]
    .split("|")
    .map((s) => s.trim().replace(/["']/g, ""))
    .filter(Boolean);
}

/* ── Public API ───────────────────────────────────────────────── */

export function extractPermissions(routes: RouteInfo[]): PermissionsMatrix {
  const personas = extractPersonas();
  const navEntries = extractNavPermissions();

  // Add auth routes (public routes)
  const authRoutes = routes.filter((r) => r.route.startsWith("/auth/") || r.route === "/login");
  for (const route of authRoutes) {
    if (!navEntries.some((e) => e.route === route.route)) {
      navEntries.push({
        route: route.route,
        label: route.route
          .split("/")
          .pop()!
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()),
        personas: ["public"],
        isFuture: false,
      });
    }
  }

  // Add any routes found in the codebase but not in nav
  for (const route of routes) {
    if (!navEntries.some((e) => e.route === route.route) && !route.isRedirect) {
      navEntries.push({
        route: route.route,
        label: route.route
          .split("/")
          .filter(Boolean)
          .pop()?.replace(/-/g, " ")
          .replace(/\b\w/g, (c) => c.toUpperCase()) || "Home",
        personas: route.requiresAuth ? ["authenticated"] : ["public"],
        isFuture: false,
      });
    }
  }

  return {
    personas: ["public", ...personas],
    entries: navEntries.sort((a, b) => a.route.localeCompare(b.route)),
  };
}
