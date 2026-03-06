/**
 * Tests for auth bootstrap lifecycle:
 * - bootstrap with no token
 * - bootstrap with expired token
 * - bootstrap with valid token + /me 200
 * - bootstrap with valid token + /me 401 (silent clear, no throw)
 * - login 401 maps to thrown error (inline credentials error)
 * - token helpers
 */

import {
  getAccessToken,
  hasAccessToken,
  isAccessTokenFresh,
  clearAuthTokens,
  setTokens,
} from "@/lib/auth/tokens";
import { authStore } from "@/lib/auth/store";

// Minimal mock for getApiBaseUrl
jest.mock("@/lib/apiBase", () => ({
  getApiBaseUrl: () => "http://localhost:4000",
}));

// Reset store between tests
beforeEach(() => {
  // Fully reset the zustand store to idle + empty.
  authStore.setState({
    mode: null,
    accessToken: undefined,
    idToken: undefined,
    refreshToken: undefined,
    expiresAt: undefined,
    devBypass: undefined,
    user: undefined,
    status: "idle",
  });
  jest.restoreAllMocks();
});

/* ------------------------------------------------------------------ */
/*  Token helpers                                                      */
/* ------------------------------------------------------------------ */

describe("token helpers", () => {
  test("getAccessToken returns undefined when store is empty", () => {
    expect(getAccessToken()).toBeUndefined();
  });

  test("hasAccessToken returns false when store is empty", () => {
    expect(hasAccessToken()).toBe(false);
  });

  test("setTokens + getAccessToken round-trips", () => {
    setTokens({ accessToken: "tok123", expiresIn: 3600 });
    expect(getAccessToken()).toBe("tok123");
    expect(hasAccessToken()).toBe(true);
  });

  test("isAccessTokenFresh returns true for non-expired token", () => {
    setTokens({ accessToken: "tok", expiresIn: 3600 });
    expect(isAccessTokenFresh()).toBe(true);
  });

  test("isAccessTokenFresh returns false for expired token", () => {
    authStore.setState({
      accessToken: "tok",
      expiresAt: Date.now() - 1000,
    });
    expect(isAccessTokenFresh()).toBe(false);
  });

  test("clearAuthTokens removes all tokens", () => {
    setTokens({ accessToken: "tok", expiresIn: 3600 });
    clearAuthTokens();
    expect(getAccessToken()).toBeUndefined();
    expect(authStore.getState().status).toBe("unauthenticated");
  });
});

/* ------------------------------------------------------------------ */
/*  loadMe context behavior                                            */
/* ------------------------------------------------------------------ */

describe("loadMe", () => {
  test("loadMe('bootstrap') with 401 silently clears — does NOT throw", async () => {
    authStore.setState({
      mode: "cognito",
      accessToken: "stale-token",
      expiresAt: Date.now() + 60_000,
      status: "initializing",
    });

    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => JSON.stringify({ error: { message: "Invalid or expired token" } }),
    });

    // Should NOT throw
    await authStore.getState().loadMe("bootstrap");

    expect(authStore.getState().status).toBe("unauthenticated");
    expect(authStore.getState().accessToken).toBeUndefined();
  });

  test("loadMe('login') with 401 THROWS so login page can display error", async () => {
    authStore.setState({
      mode: "cognito",
      accessToken: "bad-token",
      expiresAt: Date.now() + 60_000,
      status: "initializing",
    });

    global.fetch = jest.fn().mockResolvedValue({
      status: 401,
      ok: false,
      text: async () => JSON.stringify({ error: { message: "Invalid or expired token" } }),
    });

    await expect(authStore.getState().loadMe("login")).rejects.toThrow();
    expect(authStore.getState().status).toBe("unauthenticated");
  });

  test("loadMe with 200 sets authenticated + user", async () => {
    authStore.setState({
      mode: "cognito",
      accessToken: "good-token",
      expiresAt: Date.now() + 60_000,
      status: "initializing",
    });

    global.fetch = jest.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: async () =>
        JSON.stringify({
          id: "u1",
          orgId: "o1",
          email: "a@b.co",
          name: "Alice",
          role: "TENANT",
        }),
    });

    await authStore.getState().loadMe("bootstrap");

    expect(authStore.getState().status).toBe("authenticated");
    expect(authStore.getState().user?.email).toBe("a@b.co");
  });

  test("loadMe('bootstrap') with network error does not throw", async () => {
    authStore.setState({
      mode: "cognito",
      accessToken: "tok",
      expiresAt: Date.now() + 60_000,
      status: "initializing",
    });

    global.fetch = jest.fn().mockRejectedValue(new Error("Network failure"));

    // Should NOT throw
    await authStore.getState().loadMe("bootstrap");

    expect(authStore.getState().status).toBe("unauthenticated");
  });
});

/* ------------------------------------------------------------------ */
/*  loginWithPassword                                                  */
/* ------------------------------------------------------------------ */

describe("loginWithPassword", () => {
  test("401 from /login throws with backend message", async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 401,
      text: async () =>
        JSON.stringify({
          error: { code: "UNAUTHORIZED", message: "Invalid email or password" },
        }),
    });

    await expect(
      authStore.getState().loginWithPassword("a@b.co", "wrong")
    ).rejects.toThrow("Invalid email or password");
  });
});
