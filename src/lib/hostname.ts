/**
 * Hostname and URL utilities for the leasebase.ai domain model.
 *
 * Post-migration, all auth and dashboard pages are served from a single origin
 * (app.dev.leasebase.ai in DEV, app.leasebase.ai in PROD). Persona subdomains
 * are eliminated — role routing is purely path-based (/owner, /tenant).
 *
 * Vanity subdomains (signin.*, signup.*) are handled by ALB 302 redirects
 * and never reach this code.
 */

/**
 * Return the base app domain from the environment.
 * Default: "leasebase.ai".
 */
export function getBaseAppDomain(): string {
  if (typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_DOMAIN) {
    return process.env.NEXT_PUBLIC_APP_DOMAIN;
  }
  return "leasebase.ai";
}

/**
 * Map a backend role string to the correct same-origin dashboard path.
 *
 * Returns `null` if the role is unknown — callers must handle this as a
 * fail-closed condition (do NOT default to tenant).
 */
export function getPortalUrlForRole(role: string | null | undefined): string | null {
  const normalized = (role ?? "").toUpperCase();

  switch (normalized) {
    case "OWNER":
      return "/owner";
    case "ORG_ADMIN":
    case "PM_STAFF":
      return "/owner"; // PM users route to owner dashboard
    case "TENANT":
      return "/tenant";
    default:
      return null;
  }
}

/**
 * Return the sign-in URL — always same-origin.
 */
export function getSignInUrl(): string {
  return "/auth/login";
}

/**
 * Build a sign-in page URL with optional query parameters.
 *
 * Always same-origin: `/auth/login?message=...`
 */
export function buildSignInRedirect(params?: Record<string, string>): string {
  const qs =
    params && Object.keys(params).length > 0
      ? `?${new URLSearchParams(params).toString()}`
      : "";
  return `/auth/login${qs}`;
}

/**
 * Navigate the browser to the sign-in page.
 * Always same-origin, so always uses router.push.
 */
export function navigateToSignIn(
  url: string,
  router?: { push: (url: string) => void },
): void {
  if (router) {
    router.push(url);
  }
}

/**
 * Return the signup URL — always same-origin.
 */
export function getSignUpUrl(): string {
  return "/auth/register";
}
