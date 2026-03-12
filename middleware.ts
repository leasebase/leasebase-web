import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — single-origin routing for app.dev.leasebase.ai.
 *
 * Responsibilities:
 *   1. Old-domain 301 redirects (*.leasebase.co → app.{env}.leasebase.ai)
 *      Gated by ENABLE_OLD_DOMAIN_REDIRECTS env var.
 *   2. Root path (/) → 307 redirect to /auth/login
 *   3. Pass-through for all other paths
 */

const OLD_DOMAIN = process.env.OLD_DOMAIN || "leasebase.co";
const NEW_APP_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || "https://app.dev.leasebase.ai";
const ENABLE_OLD_DOMAIN_REDIRECTS =
  process.env.ENABLE_OLD_DOMAIN_REDIRECTS === "true" ||
  process.env.ENABLE_OLD_DOMAIN_REDIRECTS === "1";

export function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const { pathname, search } = request.nextUrl;

  // ── Old-domain → new-domain 301 redirect ────────────────────────────────
  // Matches *.leasebase.co and leasebase.co, preserving path and query.
  if (ENABLE_OLD_DOMAIN_REDIRECTS && hostname.endsWith(OLD_DOMAIN)) {
    const target = `${NEW_APP_ORIGIN}${pathname}${search}`;
    return NextResponse.redirect(target, 301);
  }

  // ── Root path → sign in ────────────────────────────────────────────────
  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url, 307);
  }

  return NextResponse.next();
}

export const config = {
  // Match root plus auth/app/invite paths — skip static assets and API routes.
  matcher: ["/", "/auth/:path*", "/app/:path*", "/invite/:path*", "/owner/:path*", "/tenant/:path*"],
};
