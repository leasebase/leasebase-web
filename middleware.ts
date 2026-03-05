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
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: "/",
};
