import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  // Basic health endpoint for load balancers and uptime checks.
  return NextResponse.json({ status: "ok" });
}
