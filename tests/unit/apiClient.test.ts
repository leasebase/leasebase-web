/**
 * Tests for src/lib/api/client.ts — apiRequest
 *
 * Covers:
 * - 401 without logoutOn401 does NOT clear auth state (throws ApiAuthError)
 * - 401 with logoutOn401=true clears auth state
 * - 403 throws but does NOT trigger logout (user stays authenticated)
 * - 200 returns parsed JSON body
 * - Non-auth error (e.g. 500) throws with backend message
 * - Anonymous requests skip auth headers
 */

import { apiRequest, ApiAuthError } from "@/lib/api/client";
import { authStore } from "@/lib/auth/store";

jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

beforeEach(() => {
  authStore.setState({
    mode: "cognito",
    accessToken: "test-access-token",
    idToken: "test-id-token",
    expiresAt: Date.now() + 60_000,
    status: "authenticated",
    user: {
      id: "u1",
      orgId: "o1",
      email: "a@b.co",
      name: "Alice",
      role: "TENANT",
      persona: "tenant",
    },
  });
  jest.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  401 — default: does NOT clear auth state                            */
/* ------------------------------------------------------------------ */

describe("apiRequest 401 handling (default — no logout)", () => {
  test("401 throws ApiAuthError but does NOT clear auth state", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () =>
        JSON.stringify({ error: { message: "Token expired" } }),
    });

    await expect(
      apiRequest({ path: "/api/notifications/unread-count" })
    ).rejects.toThrow("Token expired");

    // Auth state must remain intact — background 401 must NOT kill session
    const state = authStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("test-access-token");
    expect(state.user?.email).toBe("a@b.co");
  });

  test("401 throws an ApiAuthError instance with path", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () =>
        JSON.stringify({ error: { message: "Token expired" } }),
    });

    try {
      await apiRequest({ path: "api/tenants/me" });
      throw new Error("should not reach");
    } catch (err) {
      expect(err).toBeInstanceOf(ApiAuthError);
      expect((err as ApiAuthError).status).toBe(401);
      expect((err as ApiAuthError).path).toBe("api/tenants/me");
    }
  });

  test("401 with non-JSON body throws generic ApiAuthError", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => "not json",
    });

    await expect(
      apiRequest({ path: "/api/properties" })
    ).rejects.toThrow("Unauthorized");

    // Still no logout
    expect(authStore.getState().status).toBe("authenticated");
  });
});

/* ------------------------------------------------------------------ */
/*  401 + logoutOn401 — session-critical: DOES clear auth state         */
/* ------------------------------------------------------------------ */

describe("apiRequest 401 with logoutOn401=true", () => {
  test("401 with logoutOn401 calls logout and throws", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () =>
        JSON.stringify({ error: { message: "Token expired" } }),
    });

    await expect(
      apiRequest({ path: "/api/auth/me", logoutOn401: true })
    ).rejects.toThrow("Token expired");

    // Auth state should be fully cleared
    const state = authStore.getState();
    expect(state.status).toBe("unauthenticated");
    expect(state.accessToken).toBeUndefined();
    expect(state.user).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  403 — does NOT trigger logout                                      */
/* ------------------------------------------------------------------ */

describe("apiRequest 403 handling", () => {
  test("403 throws but does NOT clear auth state", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 403,
      ok: false,
      text: async () =>
        JSON.stringify({ message: "You do not have access to this resource" }),
    });

    await expect(
      apiRequest({ path: "/api/admin/settings" })
    ).rejects.toThrow("You do not have access to this resource");

    // Auth state should remain intact
    const state = authStore.getState();
    expect(state.status).toBe("authenticated");
    expect(state.accessToken).toBe("test-access-token");
    expect(state.idToken).toBe("test-id-token");
    expect(state.user?.email).toBe("a@b.co");
  });
});

/* ------------------------------------------------------------------ */
/*  200 — success                                                      */
/* ------------------------------------------------------------------ */

describe("apiRequest success", () => {
  test("200 returns parsed JSON", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({ items: [1, 2, 3] }),
    });

    const result = await apiRequest({ path: "/api/properties" });
    expect(result).toEqual({ items: [1, 2, 3] });
  });

  test("200 with empty body returns undefined", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => "",
    });

    const result = await apiRequest({ path: "/api/properties/1", method: "DELETE" });
    expect(result).toBeUndefined();
  });
});

/* ------------------------------------------------------------------ */
/*  Non-auth errors (e.g. 500)                                         */
/* ------------------------------------------------------------------ */

describe("apiRequest generic errors", () => {
  test("500 throws with backend message, does not clear auth", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 500,
      ok: false,
      text: async () =>
        JSON.stringify({ message: "Internal server error" }),
    });

    await expect(
      apiRequest({ path: "/api/properties" })
    ).rejects.toThrow("Internal server error");

    // Auth state untouched
    expect(authStore.getState().status).toBe("authenticated");
  });
});

/* ------------------------------------------------------------------ */
/*  Auth headers                                                       */
/* ------------------------------------------------------------------ */

describe("apiRequest auth headers", () => {
  test("attaches access token as Bearer for cognito mode", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({}),
    });

    await apiRequest({ path: "/api/properties" });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = options.headers as Headers;
    // Access token carries custom:role via the Pre-Token Generation V2 Lambda.
    // Standard OAuth pattern: use access token for API auth.
    expect(headers.get("Authorization")).toBe("Bearer test-access-token");
  });

  test("anonymous request skips auth headers", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () => JSON.stringify({}),
    });

    await apiRequest({ path: "/api/public/health", anonymous: true });

    const [, options] = (global.fetch as jest.Mock).mock.calls[0];
    const headers = options.headers as Headers;
    expect(headers.get("Authorization")).toBeNull();
  });
});
