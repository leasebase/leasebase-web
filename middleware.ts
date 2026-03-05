import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect the bare root to the login page.
 *
 * Traffic path: CloudFront → public web ALB → ECS (this container).
 * CloudFront forwards the real Host header (dev.leasebase.co) via the
 * custom origin request policy.  We read the Host header explicitly
 * because request.nextUrl reflects the internal HOSTNAME (0.0.0.0).
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    const host = request.headers.get("host") || request.nextUrl.host;
    const redirectUrl = new URL(`https://${host}/auth/login`);

    const res = NextResponse.redirect(redirectUrl);
    res.headers.set("cache-control", "no-store, max-age=0");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
