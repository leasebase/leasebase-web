import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function POST(_req: NextRequest) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set("lb_role", "", { httpOnly: true, expires: new Date(0), path: "/" });
  res.cookies.set("lb_session", "", { httpOnly: true, expires: new Date(0), path: "/" });
  return res;
}
