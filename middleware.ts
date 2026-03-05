import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect the bare root to the login page.
 *
 * Traffic path: CloudFront → public web ALB → ECS (this container).
 * CloudFront forwards the real Host header (dev.leasebase.co) via a
 * custom origin request policy, so request.nextUrl has the correct host.
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    // Ensure the redirect uses https (x-forwarded-proto may be "http"
    // because CloudFront → ALB is HTTP-only).
    url.protocol = "https";

    const res = NextResponse.redirect(url);
    res.headers.set("cache-control", "no-store, max-age=0");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
