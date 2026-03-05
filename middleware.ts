import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Redirect the bare root to the login page.
 *
 * The root page (app/page.tsx) is stubbornly treated as static by the
 * Next.js 14.2.5 build inside Docker despite force-dynamic + headers().
 * Middleware runs before routing, so it side-steps the Full Route Cache
 * entirely.  /auth/login correctly builds as dynamic (ƒ).
 */
export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/") {
    // Use nextUrl (which respects x-forwarded-host / x-forwarded-proto)
    // instead of request.url (which reflects the internal proxy address).
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    const res = NextResponse.redirect(url);
    res.headers.set("cache-control", "no-store, max-age=0");
    return res;
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
