/**
 * Hostname detection and portal URL utilities.
 *
 * Single source of truth for all subdomain ↔ persona mapping logic.
 * Used by middleware, login redirect, wrong-portal guard, and UI links.
 */

export type HostnameContext =
  | "SIGNUP"
  | "PORTAL_SELECTOR"
  | "OWNER"
  | "PROPERTY_MANAGER"
  | "TENANT";

/** Portal identifiers for URL generation. */
export type PortalId = "signup" | "login" | "owner" | "manager" | "tenant";

// Subdomain prefix → context mapping
const SUBDOMAIN_MAP: Record<string, HostnameContext> = {
  signup: "SIGNUP",
  login: "PORTAL_SELECTOR",
  owner: "OWNER",
  manager: "PROPERTY_MANAGER",
  tenant: "TENANT",
};

// Context → subdomain prefix (reverse of SUBDOMAIN_MAP for portal contexts)
const CONTEXT_TO_SUBDOMAIN: Partial<Record<HostnameContext, string>> = {
  SIGNUP: "signup",
  PORTAL_SELECTOR: "login",
  OWNER: "owner",
  PROPERTY_MANAGER: "manager",
  TENANT: "tenant",
};

/**
 * Return the base app domain from the environment.
 * Default: "leasebase.co". For local subdomain testing: "localhost".
 */
export function getBaseAppDomain(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_DOMAIN) {
    return process.env.NEXT_PUBLIC_APP_DOMAIN;
  }
  return "leasebase.co";
}

/**
 * Determine whether a hostname is a generic local dev hostname
 * (no subdomain routing should be enforced).
 */
function isGenericLocalhost(hostname: string): boolean {
  const bare = hostname.replace(/:\d+$/, "");
  return bare === "localhost" || bare === "127.0.0.1";
}

/**
 * Resolve the persona context from a hostname.
 *
 * Returns `null` for generic localhost (no subdomain enforcement) or
 * unrecognised hostnames. Uses the NEXT_PUBLIC_APP_DOMAIN env var to
 * support both production (`leasebase.co`) and local subdomain testing
 * (`localhost`).
 */
export function resolvePersonaFromHostname(
  hostname: string,
): HostnameContext | null {
  // Strip port if present
  const bare = hostname.replace(/:\d+$/, "");

  // Generic localhost without subdomain — no gating
  if (isGenericLocalhost(hostname)) {
    return null;
  }

  const baseDomain = getBaseAppDomain();

  // Hostname must end with the base domain
  if (!bare.endsWith(baseDomain)) {
    return null;
  }

  // Extract subdomain prefix: "signup.leasebase.co" → "signup"
  const prefix = bare.slice(0, bare.length - baseDomain.length).replace(/\.$/, "");

  if (!prefix) {
    return null;
  }

  return SUBDOMAIN_MAP[prefix] ?? null;
}

/**
 * Build the full origin URL for a given portal.
 *
 * Examples:
 *   getPortalOrigin("owner")   → "https://owner.leasebase.co"
 *   getPortalOrigin("signup")  → "https://signup.leasebase.co"
 *   (localhost)                → "http://signup.localhost:3000"
 */
export function getPortalOrigin(portal: PortalId): string {
  const baseDomain = getBaseAppDomain();
  const isLocalhost = baseDomain === "localhost";
  const protocol = isLocalhost ? "http" : "https";
  const port = isLocalhost ? ":3000" : "";
  return `${protocol}://${portal}.${baseDomain}${port}`;
}

/**
 * Map a backend role string to the correct portal URL (with /app path).
 *
 * Returns `null` if the role is unknown — callers must handle this as a
 * fail-closed condition (do NOT default to tenant).
 */
export function getPortalUrlForRole(role: string | null | undefined): string | null {
  const normalized = (role ?? "").toUpperCase();

  switch (normalized) {
    case "OWNER":
      return `${getPortalOrigin("owner")}/app`;
    case "ORG_ADMIN":
    case "PM_STAFF":
      return `${getPortalOrigin("manager")}/app`;
    case "TENANT":
      return `${getPortalOrigin("tenant")}/app`;
    default:
      return null;
  }
}

/**
 * Return the sign-in URL.
 *
 * - Generic localhost → `/auth/login` (same-origin, no subdomains).
 * - Persona portals (owner / manager / tenant) → `/auth/login`
 *   (same-origin so that localStorage auth tokens persist after login).
 * - Everything else (login portal, signup, unknown) → login subdomain.
 */
export function getSignInUrl(): string {
  if (typeof window !== "undefined") {
    // Generic localhost — no subdomain routing.
    if (isGenericLocalhost(window.location.hostname)) {
      return "/auth/login";
    }

    // Persona portals: keep login on the same origin so localStorage
    // tokens written during login are visible to the dashboard.
    const ctx = resolvePersonaFromHostname(window.location.hostname);
    if (ctx === "OWNER" || ctx === "PROPERTY_MANAGER" || ctx === "TENANT") {
      return "/auth/login";
    }
  }
  return getPortalOrigin("login");
}

/**
 * Return the signup URL — either the signup subdomain or the local
 * `/auth/register` fallback for generic localhost dev.
 */
export function getSignUpUrl(): string {
  if (typeof window !== "undefined" && isGenericLocalhost(window.location.hostname)) {
    return "/auth/register";
  }
  return getPortalOrigin("signup");
}
