import { getApiBaseUrl } from "@/lib/apiBase";
import { authStore } from "@/lib/auth/store";
import { getAccessToken } from "@/lib/auth/tokens";

export interface ApiRequestOptions extends RequestInit {
  /** Relative API path like "api/auth/me" or "/api/auth/me". */
  path: string;
  /** When true, do not automatically attach auth headers. */
  anonymous?: boolean;
}

/**
 * Centralized API client for authenticated requests.
 *
 * - Automatically attaches the bearer token (or dev-bypass headers).
 * - On 401, clears auth state and throws.
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
export async function apiRequest<T = any>({ path, anonymous, ...init }: ApiRequestOptions): Promise<T> {
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
  }

  const response = await fetch(url, {
    ...init,
    headers,
  });

  if (response.status === 401) {
    // REFRESH-HOOK: Before clearing, attempt token refresh here.
    // const refreshed = await refreshAccessToken();
    // if (refreshed) { /* retry original request once */ }

    authStore.getState().logout("unauthorized");

    // Parse error body for a better message.
    const text = await response.text().catch(() => "");
    let message = "Unauthorized";
    try {
      const body = text ? JSON.parse(text) : {};
      message = body?.error?.message || body?.message || message;
    } catch { /* non-JSON */ }
    throw new Error(message);
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
