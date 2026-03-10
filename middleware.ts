import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — hostname-aware routing for persona portals.
 *
 * Subdomain mapping:
 *   signup.<domain>  → serves /auth/register
 *   login.<domain>   → serves /portal (portal selector)
 *   owner.<domain>   → persona portal (redirect / → /app)
 *   manager.<domain> → persona portal (redirect / → /app)
 *   tenant.<domain>  → persona portal (redirect / → /app)
 *   localhost / generic dev → legacy behavior (/ → /auth/login)
 *
 * Uses NEXT_PUBLIC_APP_DOMAIN env var (default: "leasebase.co").
 */

const baseDomain = process.env.NEXT_PUBLIC_APP_DOMAIN || "leasebase.co";

function getSubdomain(host: string): string | null {
  const bare = host.replace(/:\d+$/, "");
  // Generic localhost without subdomain — skip
  if (bare === "localhost" || bare === "127.0.0.1") return null;
  if (!bare.endsWith(baseDomain)) return null;
  const prefix = bare.slice(0, bare.length - baseDomain.length).replace(/\.$/, "");
  return prefix || null;
}

function noCache(res: NextResponse): NextResponse {
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const subdomain = getSubdomain(host);
  const { pathname } = request.nextUrl;

  // ── Signup subdomain ─────────────────────────────────────────────────
  if (subdomain === "signup") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/register";
      return noCache(NextResponse.rewrite(url));
    }
    // Allow /auth/register, /auth/verify-email, and all Next internals
    return NextResponse.next();
  }

  // ── Login / portal-selector subdomain ────────────────────────────────
  if (subdomain === "login") {
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/portal";
      return noCache(NextResponse.rewrite(url));
    }
    // Allow /portal, /auth/login, and other auth pages
    return NextResponse.next();
  }

  // ── Persona portals (owner, manager, tenant) ────────────────────────
  if (subdomain === "owner" || subdomain === "manager" || subdomain === "tenant") {
    // Root → redirect to /app
    if (pathname === "/") {
      const url = request.nextUrl.clone();
      url.pathname = "/app";
      return noCache(NextResponse.redirect(url, 307));
    }
    // Block signup on persona portals — redirect to signup subdomain
    if (pathname === "/auth/register") {
      const protocol = request.nextUrl.protocol;
      const port = baseDomain === "localhost" ? `:${request.nextUrl.port}` : "";
      return noCache(
        NextResponse.redirect(
          new URL(`${protocol}//signup.${baseDomain}${port}/auth/register`),
          307,
        ),
      );
    }
    return NextResponse.next();
  }

  // ── Generic local dev (localhost without subdomain) ─────────────────
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return noCache(NextResponse.redirect(url, 307));
  }

  return NextResponse.next();
}

export const config = {
  // Match root plus auth/portal paths — skip static assets and API routes.
  matcher: ["/", "/auth/:path*", "/portal", "/app/:path*", "/invite/:path*"],
};
