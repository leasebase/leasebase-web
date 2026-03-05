import { NextResponse } from "next/server";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

export function GET() {
  const h = headers();
  return NextResponse.json({
    status: "ok",
    debug: {
      host: h.get("host"),
      "x-forwarded-host": h.get("x-forwarded-host"),
      "x-forwarded-proto": h.get("x-forwarded-proto"),
      "x-forwarded-for": h.get("x-forwarded-for"),
      "x-forwarded-port": h.get("x-forwarded-port"),
    },
  });
}
