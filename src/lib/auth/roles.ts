import type { NextRequest } from "next/server";
import type { UserRole } from "@/lib/config";

export const PM_ROLES: UserRole[] = ["ORG_ADMIN", "PM_STAFF", "OWNER"];
export const TENANT_ROLES: UserRole[] = ["TENANT"];

export type ProtectedArea = "pm" | "tenant";

export function getRoleFromCookies(req: NextRequest): UserRole | null {
  const role = req.cookies.get("lb_role")?.value as UserRole | undefined;
  return role ?? null;
}

export function canAccessArea(role: UserRole | null, area: ProtectedArea): boolean {
  if (!role) return false;
  if (area === "pm") return PM_ROLES.includes(role);
  if (area === "tenant") return TENANT_ROLES.includes(role);
  return false;
}

export function getAreaForPath(pathname: string): ProtectedArea | null {
  if (pathname.startsWith("/pm")) return "pm";
  if (pathname.startsWith("/tenant")) return "tenant";
  return null;
}
