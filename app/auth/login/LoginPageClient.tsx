"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { authStore } from "@/lib/auth/store";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getPortalUrlForRole, getSignUpUrl } from "@/lib/hostname";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError(null);
    setUnconfirmedEmail(null);
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
      setLoginError(msg);
    } finally {
      setLoading(false);
    }
  };

  const startOidcLogin = () => {
    setLoginError("Social login is not configured for this environment.");
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

          <Button
            type="button"
            variant="secondary"
            onClick={startOidcLogin}
            className="w-full"
          >
            Social login (coming soon)
          </Button>

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
        </div>
      </AuthCard>
    </AuthShell>
  );
}
