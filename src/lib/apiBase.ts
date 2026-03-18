/**
 * Return the base URL for the Leasebase API.
 *
 * The value comes from the NEXT_PUBLIC_API_BASE_URL environment variable which
 * Next.js inlines into the client bundle at build time.  In production this is
 * typically `https://api.dev.leasebase.ai`; locally it defaults to
 * `http://localhost:4000` (set in .env.local).
 *
 * If the env var is not set at all the function returns "" (empty string),
 * which results in same-origin relative fetches — a safe fallback during early
 * bootstrapping but not recommended for production.
 */
export function getApiBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_API_BASE_URL || "";
  // Strip trailing slash so callers can append "/path" cleanly.
  return base.endsWith("/") ? base.slice(0, -1) : base;
}
