import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Middleware — minimal redirect only.
 *
 * What it does:
 *   Redirects the bare root ("/") to /auth/login so the user always
 *   lands on a visible page.
 *
 * Why nextUrl.clone():
 *   Next.js already resolves the correct protocol, host and port into
 *   request.nextUrl (respects x-forwarded-proto/host from ALB/CloudFront
 *   in production, and uses http://localhost:PORT in local dev).  Cloning
 *   and patching the pathname is the simplest correct approach.
 *
 * Everything else (auth, session bootstrap) happens client-side.
 */
export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth/login";

  const res = NextResponse.redirect(url, 307);
  res.headers.set("cache-control", "no-store, max-age=0");
  return res;
}

export const config = {
  // Only match the bare root — nothing else runs through middleware.
  matcher: "/",
};
