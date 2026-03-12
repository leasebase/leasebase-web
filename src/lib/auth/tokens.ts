/**
 * Centralized token helpers.
 *
 * All token reads/writes/clears go through these functions so there is a
 * single choke-point for future changes (e.g. migrating to httpOnly cookies
 * or adding refresh-token rotation).
 *
 * Internally they delegate to the zustand `authStore` which persists to
 * localStorage via the `persist` middleware.  This module does NOT access
 * localStorage directly.
 *
 * ## Refresh-token support (not yet implemented)
 *
 * When the backend adds a `/api/auth/refresh` endpoint:
 * 1. Add `refreshAccessToken()` here that calls the endpoint, stores the
 *    new access token via `setTokens()`, and returns it.
 * 2. Update `apiRequest` to call `refreshAccessToken()` on 401 before
 *    giving up (see the `// REFRESH-HOOK` comment in `api/client.ts`).
 * 3. Gate concurrent refresh attempts with a module-level promise to avoid
 *    thundering-herd when multiple requests 401 simultaneously.
 */

import { authStore } from "./store";

/* ─── Read ─────────────────────────────────────────────────────── */

/** Return the current Cognito access token, or `undefined` if absent. */
export function getAccessToken(): string | undefined {
  return authStore.getState().accessToken;
}

/**
 * Return the current Cognito ID token, or `undefined` if absent.
 *
 * The ID token carries custom attributes (`custom:role`, `custom:orgId`) that
 * are required by the backend `requireAuth` middleware.  Cognito access tokens
 * do NOT carry custom attributes, so the ID token is used as the Bearer token
 * for authenticated API requests.
 *
 * When the Pre-Token Generation Lambda is deployed (future), the access token
 * will carry these claims and this function will no longer be needed for API
 * auth — at that point the app should switch back to `getAccessToken()`.
 */
export function getIdToken(): string | undefined {
  return authStore.getState().idToken;
}

/** Return the current Cognito refresh token, or `undefined` if absent.
 *  Reserved for future refresh-token rotation support. */
export function getRefreshToken(): string | undefined {
  return authStore.getState().refreshToken;
}

/** `true` when an access token exists (does NOT verify expiry). */
export function hasAccessToken(): boolean {
  return !!authStore.getState().accessToken;
}

/**
 * `true` when the stored access token has not yet expired according to the
 * locally recorded `expiresAt` timestamp.  Returns `false` when there is no
 * token at all.
 */
export function isAccessTokenFresh(): boolean {
  const { accessToken, expiresAt } = authStore.getState();
  if (!accessToken || !expiresAt) return false;
  return expiresAt > Date.now();
}

/* ─── Write ────────────────────────────────────────────────────── */

/**
 * Persist a fresh set of Cognito tokens returned by login or a future
 * refresh endpoint.
 */
export function setTokens(tokens: {
  accessToken: string;
  idToken?: string;
  refreshToken?: string;
  expiresIn: number;
}): void {
  const now = Date.now();
  const expiresIn =
    typeof tokens.expiresIn === "number" && Number.isFinite(tokens.expiresIn)
      ? tokens.expiresIn
      : 3600;

  authStore.setState({
    mode: "cognito",
    accessToken: tokens.accessToken,
    idToken: tokens.idToken,
    refreshToken: tokens.refreshToken,
    expiresAt: now + expiresIn * 1000,
    devBypass: undefined,
  });
}

/* ─── Clear ────────────────────────────────────────────────────── */

/** Remove access + id tokens but preserve the refresh token.
 *  Reserved for future refresh-token rotation support. */
export function clearAccessToken(): void {
  authStore.setState({
    accessToken: undefined,
    idToken: undefined,
    expiresAt: undefined,
  });
}

/** Remove all auth tokens and dev-bypass state.  Full sign-out. */
export function clearAuthTokens(): void {
  authStore.setState({
    mode: null,
    accessToken: undefined,
    idToken: undefined,
    refreshToken: undefined,
    expiresAt: undefined,
    devBypass: undefined,
    user: undefined,
    status: "unauthenticated",
  });
}
