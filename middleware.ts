import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — single-origin routing for app.dev.leasebase.ai.
 *
 * Responsibilities:
 *   1. Root path (/) → 307 redirect to /auth/login
 *   2. Pass-through for all other paths
 *
 * Old-domain 301 redirects (*.leasebase.co → *.leasebase.ai) are deployed
 * as a separate controlled step after new-domain validation passes.
 * See PR 2b / ENABLE_OLD_DOMAIN_REDIRECTS.
 */

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

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
