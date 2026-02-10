import { getApiBaseUrl } from "@/lib/apiBase";
import { authStore } from "@/lib/auth/store";

export interface ApiRequestOptions extends RequestInit {
  /** Relative API path like "auth/me" or "/auth/me". */
  path: string;
  /** When true, do not automatically attach auth headers. */
  anonymous?: boolean;
}

export async function apiRequest<T = any>({ path, anonymous, ...init }: ApiRequestOptions): Promise<T> {
  const base = getApiBaseUrl();
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const url = `${base}/${cleanPath}`;

  const headers = new Headers(init.headers || {});

  if (!anonymous) {
    const state = authStore.getState();

    if (state.mode === "cognito" && state.accessToken) {
      headers.set("Authorization", `Bearer ${state.accessToken}`);
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

  if (response.status === 401 || response.status === 403) {
    authStore.getState().logout("unauthorized");
    throw new Error("Unauthorized");
  }

  const text = await response.text();
  if (!text) {
    // @ts-expect-error allow void
    return undefined as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    // Non-JSON response
    // @ts-expect-error caller must handle
    return text as T;
  }
}
