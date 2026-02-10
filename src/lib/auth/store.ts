import create from "zustand";
import { persist } from "zustand/middleware";
import { mapUserRoleToPersona, Persona } from "@/lib/auth/roles";
import { getApiBaseUrl } from "@/lib/apiBase";

export type AuthMode = "cognito" | "devBypass";

export interface CurrentUser {
  id: string;
  orgId: string;
  email: string;
  name: string;
  role: string;
  persona: Persona;
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
  initializeFromStorage: () => void;
  loginWithPassword: (email: string, password: string) => Promise<void>;
  loginDevBypass: (session: DevBypassSession) => Promise<void>;
  loadMe: () => Promise<void>;
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

export const authStore = create<AuthState>()(
  persist(
    (set, get) => ({
      mode: null,
      status: "idle",

      initializeFromStorage: () => {
        const { expiresAt, accessToken } = get();
        if (!accessToken || !expiresAt) {
          set({ status: "unauthenticated", mode: null, user: undefined });
          return;
        }
        const now = Date.now();
        if (expiresAt <= now) {
          set({ status: "unauthenticated", mode: null, user: undefined, accessToken: undefined, idToken: undefined, refreshToken: undefined });
          return;
        }
        // We have a non-expired token; mark as unauthenticated-but-with-session so
        // loadMe can complete the picture.
        set((state) => ({ status: state.user ? "authenticated" : "initializing" }));
      },

      loginWithPassword: async (email, password) => {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/auth/login`, {
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
            throw new Error(body?.message || "Login failed");
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

        await get().loadMe();
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

        await get().loadMe();
      },

      loadMe: async () => {
        try {
          const base = getApiBaseUrl();
          const me = await fetch(`${base}/auth/me`, {
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
          }).then(async (r) => {
            const text = await r.text();
            let body: any = {};
            try {
              body = text ? JSON.parse(text) : {};
            } catch {
              body = {};
            }
            if (!r.ok) {
              throw new Error(body?.message || "Unable to load session");
            }
            return body as { id: string; orgId: string; email: string; name: string; role: string };
          });
          const persona = mapUserRoleToPersona(me.role as any);
          const user: CurrentUser = { ...me, persona };
          set({ user, status: "authenticated" });
        } catch (error) {
          // If we fail to load /auth/me, treat as logged out.
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
          throw error;
        }
      },

      logout: () => {
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
