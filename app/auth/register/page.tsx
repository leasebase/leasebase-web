"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getSignInUrl, buildSignInRedirect, navigateToSignIn } from "@/lib/hostname";
import { validatePassword, isPasswordComplexityError } from "@/lib/validation/password";
import { getOwnerSignupDocs, buildLegalAcceptancePayload, LEGAL_DOCUMENTS } from "@/lib/legal";
import { track } from "@/lib/analytics";
import { startGoogleAuth } from "@/lib/auth/oauth";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const OWNER_LEGAL_DOCS = getOwnerSignupDocs();

// Only OWNER signup is publicly available.
export type UserType = "OWNER";

/** Fixed user type for MVP — no persona selection step. */
const MVP_USER_TYPE: UserType = "OWNER";
const MVP_USER_TYPE_LABEL = "Landlord / Owner";

/* ------------------------------------------------------------------ */
/*  Field-level error state                                            */
/* ------------------------------------------------------------------ */
interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

function RegisterContent() {
  const router = useRouter();
  // MVP: skip persona selection — always Owner.
  const [userType] = useState<UserType>(MVP_USER_TYPE);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [confirmDirty, setConfirmDirty] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Track signup page view once on mount.
  useEffect(() => { track("signup_started"); }, []);

  // Live password validation — recomputed on every keystroke.
  const pwResult = useMemo(() => validatePassword(password), [password]);

  // Derived: confirm mismatch (only surface after user has touched the field).
  const confirmMismatch = confirmDirty && confirmPassword.length > 0 && password !== confirmPassword;

  // Derived: form is submittable.
  const formValid =
    !!userType &&
    email.length > 0 &&
    firstName.length > 0 &&
    lastName.length > 0 &&
    pwResult.valid &&
    password === confirmPassword &&
    agreedToTerms;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError(null);
    setFieldErrors({});

    if (!userType) {
      setError("Please select a user type");
      return;
    }

    // Client-side password validation — block submit, don't call API.
    if (!pwResult.valid) {
      setFieldErrors({ password: "Password does not meet the requirements." });
      return;
    }

    if (password !== confirmPassword) {
      setFieldErrors({ confirmPassword: "Passwords do not match." });
      return;
    }

    setLoading(true);
    track("signup_method_selected", { method: "password" });

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          firstName,
          lastName,
          userType,
          legalAcceptance: buildLegalAcceptancePayload(OWNER_LEGAL_DOCS),
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "Registration failed";
        let code = "";
        try {
          const body = JSON.parse(text);
          code = body.code || "";
          message = body.message || body.error?.message || message;
        } catch {
          // Non-JSON response (likely HTML error page)
        }

        // Map password-specific backend errors to the password field.
        if (isPasswordComplexityError(message)) {
          setFieldErrors({ password: "Password does not meet the requirements." });
          return;
        }

        // Use structured error codes to show the right user-facing message.
        if (code === "DUPLICATE_EMAIL") {
          throw new Error("An account with this email already exists. Please sign in instead.");
        }
        if (code === "BOOTSTRAP_FAILED" || res.status >= 500) {
          throw new Error("Registration failed due to a server error. Please try again in a moment.");
        }

        throw new Error(message);
      }

      let data: any = {};
      try {
        data = await res.json();
      } catch {
        // If the backend returns 2xx with no JSON body, still treat as success.
      }

      const message = encodeURIComponent(
        data.message ||
          "Registration successful. Please check your email for a Leasebase verification code.",
      );

      track("signup_completed");

      if (data.userConfirmed) {
        const redirectUrl = buildSignInRedirect({ registered: "true", message: decodeURIComponent(message) });
        navigateToSignIn(redirectUrl, router);
      } else {
        router.push(`/auth/confirm-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // MVP: single-step registration form (Owner only, no persona selection).
  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Signing up as{" "}
              <span className="font-medium text-brand-600">{MVP_USER_TYPE_LABEL}</span>
            </p>
          </div>

          {/* Google signup */}
          <button
            type="button"
            onClick={() => startGoogleAuth("/app")}
            className="flex w-full items-center justify-center gap-3 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Sign up with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or sign up with email</span>
            </div>
          </div>

          {/* Global error */}
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-50/5 px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="First Name"
                id="register-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
              <Input
                label="Last Name"
                id="register-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            <Input
              label="Email"
              id="register-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />

            {/* Password with live requirements */}
            <div className="space-y-1 text-sm">
              <label htmlFor="register-password" className="block font-medium text-slate-700">
                Password
              </label>
              <input
                id="register-password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!passwordDirty) setPasswordDirty(true);
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }}
                aria-invalid={!!fieldErrors.password || (submitted && !pwResult.valid)}
                aria-describedby="pw-requirements pw-error"
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.password
                    ? "border-danger focus:ring-danger"
                    : "border-slate-300 hover:border-slate-400"
                }`}
                placeholder="At least 8 characters"
                required
              />
              <PasswordRequirements result={pwResult} dirty={passwordDirty} id="pw-requirements" />
              {fieldErrors.password && (
                <p id="pw-error" className="text-xs text-danger" role="alert">
                  {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-1 text-sm">
              <label htmlFor="register-confirm" className="block font-medium text-slate-700">
                Confirm Password
              </label>
              <input
                id="register-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (!confirmDirty) setConfirmDirty(true);
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
                }}
                aria-invalid={confirmMismatch || !!fieldErrors.confirmPassword}
                aria-describedby="confirm-error"
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  confirmMismatch || fieldErrors.confirmPassword
                    ? "border-danger focus:ring-danger"
                    : "border-slate-300 hover:border-slate-400"
                }`}
                required
              />
              {(confirmMismatch || fieldErrors.confirmPassword) && (
                <p id="confirm-error" className="text-xs text-danger" role="alert">
                  {fieldErrors.confirmPassword || "Passwords do not match."}
                </p>
              )}
            </div>

            {/* Legal consent */}
            <label className="flex items-start gap-2 text-sm text-slate-600 cursor-pointer">
              <input
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span>
                I agree to the{" "}
                {OWNER_LEGAL_DOCS.map((doc, i) => (
                  <span key={doc.slug}>
                    {i > 0 && (i === OWNER_LEGAL_DOCS.length - 1 ? ", and " : ", ")}
                    <a
                      href={doc.publicUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-brand-600 hover:text-brand-500 underline"
                    >
                      {doc.title}
                    </a>
                  </span>
                ))}
              </span>
            </label>

            <Button
              type="submit"
              disabled={!formValid}
              loading={loading}
              className="w-full"
              size="lg"
            >
              Create account
            </Button>
          </form>

          <p className="text-center text-sm text-slate-500">
            Already have an account?{" "}
            <a
              href={getSignInUrl()}
              className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
            >
              Sign in
            </a>
          </p>

          {/* Legal links */}
          <p className="text-center text-xs text-slate-400">
            <a href={LEGAL_DOCUMENTS.find(d => d.slug === "terms")!.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">Terms</a>
            {" · "}
            <a href={LEGAL_DOCUMENTS.find(d => d.slug === "privacy")!.publicUrl} target="_blank" rel="noopener noreferrer" className="hover:text-slate-500 transition-colors">Privacy</a>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function RegisterPage() {
  return (
    <Suspense
      fallback={
        <AuthShell>
          <AuthCard>
            <div className="flex items-center justify-center py-12">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
            </div>
          </AuthCard>
        </AuthShell>
      }
    >
      <RegisterContent />
    </Suspense>
  );
}
