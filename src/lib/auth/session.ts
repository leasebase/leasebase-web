import type { UserRole } from "@/lib/config";

export interface Session {
  role: UserRole;
  orgId: string;
  email: string;
  isMock: boolean;
}

export function buildMockSessionCookie(session: Session): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");
  return payload;
}

export function parseMockSessionCookie(value: string | undefined | null): Session | null {
  if (!value) return null;
  try {
    const json = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(json) as Session;
    if (!parsed.role || !parsed.orgId || !parsed.email) return null;
    return parsed;
  } catch {
    return null;
  }
}
