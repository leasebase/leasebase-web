import { buildMockSessionCookie, parseMockSessionCookie } from "@/lib/auth/session";

describe("mock session cookie", () => {
  test("round-trips session", () => {
    const cookie = buildMockSessionCookie({
      role: "ORG_ADMIN",
      orgId: "org-1",
      email: "admin@example.com",
      isMock: true
    });
    const parsed = parseMockSessionCookie(cookie);
    expect(parsed).not.toBeNull();
    expect(parsed?.role).toBe("ORG_ADMIN");
    expect(parsed?.orgId).toBe("org-1");
    expect(parsed?.email).toBe("admin@example.com");
    expect(parsed?.isMock).toBe(true);
  });
});
