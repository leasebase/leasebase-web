import { getApiBaseUrl } from "@/lib/apiBase";
import { authStore } from "@/lib/auth/store";
import { getAccessToken } from "@/lib/auth/tokens";

/**
 * Structured error thrown on HTTP 401 responses.
 *
 * By default, `apiRequest` does NOT clear auth state on 401 — background
 * or non-critical requests (e.g. notification unread-count) must never
 * destroy the user's session.  Only callers that opt in via
 * `logoutOn401: true` trigger a full logout.
 *
 * Callers can inspect `error.status === 401` to decide locally.
 */
export class ApiAuthError extends Error {
  readonly status = 401 as const;
  readonly path: string;

  constructor(message: string, path: string) {
    super(message);
    this.name = "ApiAuthError";
    this.path = path;
  }
}

export interface ApiRequestOptions extends RequestInit {
  /** Relative API path like "api/auth/me" or "/api/auth/me". */
  path: string;
  /** When true, do not automatically attach auth headers. */
  anonymous?: boolean;
  /**
   * When true, a 401 response will call `logout("unauthorized")` before
   * throwing.  Defaults to **false** — only session-critical callers
   * (e.g. `/api/auth/me`) should set this.
   *
   * Background / non-critical endpoints (notifications, dashboards, etc.)
   * must NEVER set this to true because a transient 401 from one endpoint
   * should not destroy the entire session.
   */
  logoutOn401?: boolean;
}

/**
 * Centralized API client for authenticated requests.
 *
 * - Automatically attaches the Cognito **access token** as the bearer token
 *   (or dev-bypass headers).  A Pre-Token Generation V2 Lambda injects
 *   `custom:role` into access tokens, so they satisfy the backend
 *   `requireAuth` middleware (standard OAuth pattern).
 * - On 401, throws an `ApiAuthError` without clearing auth state by default.
 *   Pass `logoutOn401: true` for session-critical endpoints.
 * - Does NOT force a redirect — callers decide how to react.
 *
 * ## Refresh-token support (REFRESH-HOOK)
 *
 * When the backend adds `/api/auth/refresh`:
 * 1. On 401, before clearing state, attempt `refreshAccessToken()` from
 *    `@/lib/auth/tokens`.
 * 2. If refresh succeeds, retry the original request once with the new token.
 * 3. If refresh also fails, then clear state and throw.
 */
export async function apiRequest<T = any>({ path, anonymous, logoutOn401, ...init }: ApiRequestOptions): Promise<T> {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${base}/${cleanPath}`;

  const headers = new Headers(init.headers || {});

  if (!anonymous) {
    const state = authStore.getState();
    const token = getAccessToken();

    if (state.mode === "cognito" && token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    if (state.mode === "devBypass" && state.devBypass) {
      headers.set("x-dev-user-email", state.devBypass.email);
      headers.set("x-dev-user-role", state.devBypass.role);
      headers.set("x-dev-org-id", state.devBypass.orgId);
    }

    // Multi-lease org context switching: send X-Org-Context header
    // when the selected org differs from the user's primary org.
    if (state.selectedOrgId && state.user && state.selectedOrgId !== state.user.orgId) {
      headers.set("X-Org-Context", state.selectedOrgId);
    }
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // REFRESH-HOOK: Before clearing, attempt token refresh here.
    // const refreshed = await refreshAccessToken();
    // if (refreshed) { /* retry original request once */ }

    // Only session-critical callers opt in to clearing auth state.
    // Background requests (notifications, dashboards) must NOT destroy
    // the session on transient 401s.
    if (logoutOn401) {
      authStore.getState().logout("unauthorized");
    }

    // Parse error body for a better message.
    const text = await response.text().catch(() => "");
    let message = "Unauthorized";
    try {
      const body = text ? JSON.parse(text) : {};
      message = body?.error?.message || body?.message || message;
    } catch { /* non-JSON */ }
    throw new ApiAuthError(message, path);
  }

  if (response.status === 403) {
    // 403 = authenticated but not authorized. Do NOT clear auth state.
    const text = await response.text().catch(() => "");
    let message = "Forbidden";
    try {
      const body = text ? JSON.parse(text) : {};
      message = body?.error?.message || body?.message || message;
    } catch { /* non-JSON */ }
    throw new Error(message);
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    let message = `Request failed (${response.status})`;
    try {
      const body = text ? JSON.parse(text) : {};
      message = body?.error?.message || body?.message || message;
    } catch { /* non-JSON */ }
    throw new Error(message);
  }

  const text = await response.text();
  if (!text) {
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
