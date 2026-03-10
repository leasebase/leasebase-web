import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { mapUserRoleToPersona, Persona } from "@/lib/auth/roles";
import { getApiBaseUrl } from "@/lib/apiBase";
import { devLog } from "@/lib/debug";

export type AuthMode = "cognito" | "devBypass";

export interface CurrentUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  persona: Persona | null;
}

export interface DevBypassSession {
  email: string;
  role: string;
  orgId: string;
}

export type AuthStatus = "idle" | "initializing" | "authenticated" | "unauthenticated";

interface AuthState {
  mode: AuthMode | null;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  /** Epoch millis when the Cognito access token expires. */
  expiresAt?: number;
  user?: CurrentUser;
  devBypass?: DevBypassSession;
  status: AuthStatus;

  /**
   * Bootstrap auth from persisted storage in a single call.
   *
   * 1. Rehydrates zustand from localStorage.
   * 2. If no token or token expired → sets unauthenticated.
   * 3. If token looks valid → calls `/api/auth/me`.
   *    - 200 → authenticated.
   *    - 401 → silently clears tokens, sets unauthenticated.
   *    - Network error → sets unauthenticated (no error banner).
   *
   * Returns without throwing.  Callers never need try/catch.
   */
  bootstrapSession: () => Promise<void>;
  /**
   * Authenticate with email + password.
   * Throws on failure so the caller can display inline login errors.
   */
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginDevBypass: (session: DevBypassSession) => Promise<void>;
  /**
   * Fetch the current user profile from `/api/auth/me`.
   *
   * @param context - `"bootstrap"` silently clears on 401.
   *                  `"login"` re-throws so the caller can show a login error.
   */
  loadMe: (context?: "bootstrap" | "login") => Promise<void>;
  logout: (reason?: "manual" | "unauthorized") => void;
}

interface PersistedAuthState {
  mode: AuthMode | null;
  accessToken?: string;
  idToken?: string;
  refreshToken?: string;
  expiresAt?: number;
  devBypass?: DevBypassSession;
  user?: CurrentUser;
}

/** Sentinel so `bootstrapSession` only runs once per page-load. */
let bootstrapPromise: Promise<void> | null = null;

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      mode: null,
      status: "idle",

      bootstrapSession: async () => {
        // Deduplicate: if bootstrap is already in-flight, return the same promise.
        if (bootstrapPromise) return bootstrapPromise;

        bootstrapPromise = (async () => {
          try {
            // Step 1 — rehydrate persisted state from localStorage.
            authStore.persist.rehydrate();

            const { accessToken, expiresAt, mode, devBypass, user } = get();

            // Dev-bypass mode — already has user from previous session.
            if (mode === "devBypass" && devBypass) {
              set({ status: "initializing" });
              await get().loadMe("bootstrap");
              return;
            }

            // No token at all → unauthenticated, no /me call.
            if (!accessToken) {
              devLog("auth", "bootstrap: no token, unauthenticated");
              set({ status: "unauthenticated", mode: null, user: undefined });
              return;
            }

            // Token expired locally → clear and bail.
            if (expiresAt && expiresAt <= Date.now()) {
              devLog("auth", "bootstrap: token expired locally, clearing");
              set({
                status: "unauthenticated",
                mode: null,
                user: undefined,
                accessToken: undefined,
                idToken: undefined,
                refreshToken: undefined,
                expiresAt: undefined,
              });
              return;
            }

            // Token looks fresh — validate with /me.
            // If user is already hydrated from localStorage, optimistically mark
            // authenticated then verify in the background.
            set({ status: user ? "authenticated" : "initializing" });
            await get().loadMe("bootstrap");
          } catch {
            // bootstrapSession must never throw.
            devLog("auth", "bootstrap: unexpected error, treating as unauthenticated");
          }
        })();

        return bootstrapPromise;
      },

      loginWithPassword: async (email, password) => {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        }).then(async (r) => {
          const text = await r.text();
          let body: any = {};
          try {
            body = text ? JSON.parse(text) : {};
          } catch {
            body = {};
          }
          if (!r.ok) {
            // Surface backend message for login errors (e.g. "Invalid email or password")
            const err = new Error(body?.error?.message || body?.message || "Login failed");
            // Propagate structured code (e.g. "USER_NOT_CONFIRMED") so callers
            // can branch on it without brittle string matching.
            if (body?.code) (err as any).code = body.code;
            throw err;
          }
          return body as { accessToken: string; idToken: string; refreshToken?: string; expiresIn: number };
        });

        const now = Date.now();
        const expiresIn = typeof res.expiresIn === "number" && Number.isFinite(res.expiresIn) ? res.expiresIn : 3600;
        const expiresAt = now + expiresIn * 1000;

        set({
          mode: "cognito",
          accessToken: res.accessToken,
          idToken: res.idToken,
          refreshToken: res.refreshToken,
          expiresAt,
          status: "initializing",
          devBypass: undefined,
        });

        // Login /me call should throw so the login page can show the error.
        await get().loadMe("login");
      },

      loginDevBypass: async (session: DevBypassSession) => {
        set({
          mode: "devBypass",
          devBypass: session,
          accessToken: undefined,
          idToken: undefined,
          refreshToken: undefined,
          expiresAt: undefined,
          status: "initializing",
        });

        await get().loadMe("login");
      },

      loadMe: async (context = "bootstrap") => {
        try {
          const base = getApiBaseUrl();
          const response = await fetch(`${base}/api/auth/me`, {
            headers: (() => {
              const headers = new Headers();
              const { mode, accessToken, devBypass } = get();
              if (mode === "cognito" && accessToken) {
                headers.set("Authorization", `Bearer ${accessToken}`);
              }
              if (mode === "devBypass" && devBypass) {
                headers.set("x-dev-user-email", devBypass.email);
                headers.set("x-dev-user-role", devBypass.role);
                headers.set("x-dev-org-id", devBypass.orgId);
              }
              return headers;
            })(),
          });

          // /me 401/403 → session is invalid. Unlike apiRequest (where 403
          // means "no permission"), a 403 from /me means the account is
          // disabled or the session is revoked, so we clear auth state.
          if (response.status === 401 || response.status === 403) {
            devLog("auth", `loadMe ${response.status}: clearing tokens (context=${context})`);
            set({
              mode: null,
              accessToken: undefined,
              idToken: undefined,
              refreshToken: undefined,
              expiresAt: undefined,
              devBypass: undefined,
              user: undefined,
              status: "unauthenticated",
            });
            // In login context, surface a message so the caller can show it.
            if (context === "login") {
              throw new Error("Unable to load your profile. Please try logging in again.");
            }
            // In bootstrap context, do NOT throw — silent clear.
            return;
          }

          const text = await response.text();
          let body: any = {};
          try {
            body = text ? JSON.parse(text) : {};
          } catch {
            body = {};
          }

          if (!response.ok) {
            // Non-401 server error.
            throw new Error(body?.error?.message || body?.message || "Unable to load session");
          }

          const me = body as { id: string; orgId: string; email: string; name: string; role: string };
          const persona = mapUserRoleToPersona(me.role as any);
          const user: CurrentUser = { ...me, persona };
          set({ user, status: "authenticated" });
        } catch (error) {
          const currentStatus = get().status;
          // Only clear state if we haven't already (e.g. from the 401 handler above).
          if (currentStatus !== "unauthenticated") {
            set({
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
          // Only re-throw in login context so login page can show the error.
          // In bootstrap context, swallow the error — the user just sees the
          // login page without a scary error message.
          if (context === "login") {
            throw error;
          }
          devLog("auth", "loadMe bootstrap error (swallowed):", error);
        }
      },

      logout: (_reason?: "manual" | "unauthorized") => {
        // Reset the bootstrap sentinel so a fresh login can re-bootstrap.
        bootstrapPromise = null;
        set({
          mode: null,
          accessToken: undefined,
          idToken: undefined,
          refreshToken: undefined,
          expiresAt: undefined,
          devBypass: undefined,
          user: undefined,
          status: "unauthenticated",
        });
      },
    }),
    {
      name: "lb_auth_v1",
      storage: createJSONStorage(() =>
        typeof window !== "undefined" ? localStorage : (undefined as any)
      ),
      skipHydration: true,
      partialize: (state): PersistedAuthState => ({
        mode: state.mode,
        accessToken: state.accessToken,
        idToken: state.idToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        devBypass: state.devBypass,
        user: state.user,
      }),
    }
  )
);
