import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessArea, getAreaForPath, getRoleFromCookies } from "@/lib/auth/roles";

const LOGIN_PATH = "/auth/login";
const ACCESS_DENIED_PATH = "/auth/access-denied";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip next internals and public assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/health") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const area = getAreaForPath(pathname);
  if (!area) {
    return NextResponse.next();
  }

  const role = getRoleFromCookies(req);

  if (!role) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = LOGIN_PATH;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (!canAccessArea(role, area)) {
    const deniedUrl = req.nextUrl.clone();
    deniedUrl.pathname = ACCESS_DENIED_PATH;
    deniedUrl.searchParams.set("reason", area === "pm" ? "pm-only" : "tenant-only");
    return NextResponse.redirect(deniedUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/(pm/:path*|tenant/:path*)"]
};
