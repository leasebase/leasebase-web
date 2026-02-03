import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getAppConfig } from "@/lib/config";
import { buildMockSessionCookie } from "@/lib/auth/session";
import type { UserRole } from "@/lib/config";

export async function POST(req: NextRequest) {
  const config = getAppConfig();
  if (!config.devMockAuth) {
    return NextResponse.json({ error: "DEV mock auth is disabled" }, { status: 403 });
  }

  const body = (await req.json()) as {
    role: UserRole;
    orgId: string;
    email: string;
  };

  if (!body.role || !body.orgId || !body.email) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const sessionCookie = buildMockSessionCookie({
    role: body.role,
    orgId: body.orgId,
    email: body.email,
    isMock: true
  });

  const res = NextResponse.json({ ok: true });
  res.cookies.set("lb_role", body.role, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });
  res.cookies.set("lb_session", sessionCookie, {
    httpOnly: true,
    sameSite: "lax",
    path: "/"
  });

  return res;
}
