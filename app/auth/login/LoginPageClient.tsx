"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/lib/auth/store";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getPortalUrlForRole, getSignUpUrl } from "@/lib/hostname";
import { startGoogleAuth } from "@/lib/auth/oauth";
import { track } from "@/lib/analytics";
import { devLog } from "@/lib/debug";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";

type LoginPageClientProps = {
  next?: string;
  registered?: string;
  registrationMessage?: string;
};

export default function LoginPageClient({
  next = "/app",
  registered,
  registrationMessage,
}: LoginPageClientProps) {
  const router = useRouter();
  const { user, status } = authStore();
  // `loginError` is ONLY set by the login-submit handler — never by bootstrap.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [devEmail, setDevEmail] = useState("");
  const [devRole, setDevRole] = useState("OWNER");
  const [devOrgId, setDevOrgId] = useState("dev-org-1");

  const devBypassEnabled =
    process.env.NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH === "true" ||
    process.env.NEXT_PUBLIC_DEV_ONLY_MOCK_AUTH === "1";

  // Bootstrap: check if user already has a valid session.
  // Uses bootstrapSession() which never throws and silently clears stale tokens.
  useEffect(() => {
    devLog("login", "bootstrapping session");
    authStore.getState().bootstrapSession();
  }, []);

  // If already authenticated (or becomes authenticated after bootstrap), redirect
  // to the correct role-based dashboard path.
  useEffect(() => {
    devLog("login", "auth status =", status, "user =", user?.email ?? "(none)");
    if (status === "authenticated" && user) {
      const portalUrl = getPortalUrlForRole(user.role);
      devLog("login", "redirecting to", portalUrl || next);
      router.replace(portalUrl || next);
    }
  }, [status, user, next, router]);

  // Track whether the backend returned USER_NOT_CONFIRMED so we can show
  // contextual actions (confirm email / resend code).
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  // Track whether the backend returned a password-reset-required state.
  const [needsPasswordReset, setNeedsPasswordReset] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setUnconfirmedEmail(null);
    setNeedsPasswordReset(false);
    try {
      await authStore.getState().loginWithPassword(email, password);
      // After login, determine the correct dashboard based on the user's role.
      const loggedInUser = authStore.getState().user;
      const portalUrl = loggedInUser ? getPortalUrlForRole(loggedInUser.role) : null;
      router.replace(portalUrl || next);
    } catch (err: any) {
      const msg = err.message || "Login failed";
      // Detect USER_NOT_CONFIRMED via the structured code from the backend response.
      if (err.code === "USER_NOT_CONFIRMED") {
        setUnconfirmedEmail(email);
      }
      if (err.code === "NEW_PASSWORD_REQUIRED" || err.code === "PASSWORD_RESET_REQUIRED") {
        setNeedsPasswordReset(true);
      }
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };


  const handleDevBypass = async () => {
    setLoading(true);
    setLoginError(null);
    try {
      const emailToUse = devEmail || email || "owner@example.com";
      await authStore.getState().loginDevBypass({
        email: emailToUse,
        role: devRole,
        orgId: devOrgId || "dev-org-1",
      });
      router.replace(next || "/app");
    } catch (err: any) {
      setLoginError(err.message || "Dev bypass login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-6">
          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500">
              Sign in with your email or continue with a connected identity
              provider.
            </p>
          </div>

          {/* Success banner (registration, email confirmed, password reset, etc.) */}
          {registrationMessage && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              {decodeURIComponent(registrationMessage)}
            </div>
          )}

          {/* Error banner */}
          {loginError && (
            <div className="rounded-lg border border-danger/30 bg-danger-50/5 px-4 py-3 text-sm text-danger" role="alert">
              <p>{loginError}</p>
              {unconfirmedEmail && (
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/auth/confirm-email?email=${encodeURIComponent(unconfirmedEmail)}`,
                      )
                    }
                    className="text-xs font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Confirm email
                  </button>
                  <span className="text-xs text-danger/50">|</span>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await fetch(
                          `${getApiBaseUrl()}/api/auth/resend-confirmation`,
                          {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ email: unconfirmedEmail }),
                          },
                        );
                        setLoginError(
                          "A new confirmation code has been sent to your email.",
                        );
                        setUnconfirmedEmail(null);
                      } catch {
                        // best-effort
                      }
                    }}
                    className="text-xs font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Resend confirmation code
                  </button>
                </div>
              )}
              {needsPasswordReset && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`,
                      )
                    }
                    className="text-xs font-medium text-brand-600 hover:text-brand-500 underline"
                  >
                    Reset password now
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Login form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <div>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <div className="mt-1 text-right">
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/auth/forgot-password${email ? `?email=${encodeURIComponent(email)}` : ""}`,
                    )
                  }
                  className="text-xs font-medium text-brand-600 hover:text-brand-500 transition-colors"
                >
                  Forgot password?
                </button>
              </div>
            </div>
            <Button
              type="submit"
              loading={loading}
              className="w-full"
              size="lg"
            >
              Sign in
            </Button>
          </form>

          {/* Social login */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => startGoogleAuth(next)}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Continue with Google
          </button>

          {/* Dev bypass */}
          {devBypassEnabled && (
            <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                Developer bypass (local/dev only)
              </p>
              <p className="text-xs text-slate-500">
                When the backend is running with DEV_AUTH_BYPASS enabled, you can
                sign in without Cognito by choosing a role.
              </p>
              <div className="space-y-3">
                <Input
                  label="Dev email"
                  id="dev-email"
                  type="email"
                  value={devEmail}
                  onChange={(e) => setDevEmail(e.target.value)}
                  placeholder="owner@example.com"
                />
                <Input
                  label="Dev org ID"
                  id="dev-org"
                  type="text"
                  value={devOrgId}
                  onChange={(e) => setDevOrgId(e.target.value)}
                  placeholder="dev-org-1"
                />
                <Select
                  label="Role"
                  id="dev-role"
                  value={devRole}
                  onChange={(e) => setDevRole(e.target.value)}
                >
                  <option value="OWNER">Owner</option>
                  <option value="TENANT">Tenant</option>
                </Select>
              </div>
              <Button
                type="button"
                variant="secondary"
                onClick={handleDevBypass}
                loading={loading}
                className="w-full border-brand-300 text-brand-700"
                size="sm"
              >
                Sign in with dev bypass
              </Button>
            </div>
          )}

          {/* Footer link */}
          <p className="text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <a
              href={getSignUpUrl()}
              className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
            >
              Sign up
            </a>
          </p>

          {/* Legal links */}
          <p className="text-center text-xs text-slate-400">
            <a href="https://leasebase.ai/terms-of-service/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">Terms</a>
            {" · "}
            <a href="https://leasebase.ai/privacy-policy/" target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">Privacy</a>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}
