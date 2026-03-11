"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getSignInUrl, buildSignInRedirect, navigateToSignIn } from "@/lib/hostname";
import { validatePassword, isPasswordComplexityError } from "@/lib/validation/password";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

// MVP: only OWNER signup is publicly available.
// PROPERTY_MANAGER is kept commented-out for future restoration.
// export type UserType = "PROPERTY_MANAGER" | "OWNER";
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
    password === confirmPassword;

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

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, firstName, lastName, userType }),
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "Registration failed";
        try {
          const body = JSON.parse(text);
          message = body.message || body.error?.message || message;
        } catch {
          // Non-JSON response (likely HTML error page)
        }

        // Map password-specific backend errors to the password field.
        if (isPasswordComplexityError(message)) {
          setFieldErrors({ password: "Password does not meet the requirements." });
          return;
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
