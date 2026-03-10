"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/apiBase";
import { validatePassword } from "@/lib/validation/password";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [confirmDirty, setConfirmDirty] = useState(false);

  const pwResult = useMemo(() => validatePassword(newPassword), [newPassword]);

  const confirmMismatch =
    confirmDirty && confirmPassword.length > 0 && newPassword !== confirmPassword;

  const formValid =
    email.length > 0 &&
    code.length > 0 &&
    pwResult.valid &&
    newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code, newPassword }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Unable to reset password");
      }

      const message = encodeURIComponent("Password reset successful");
      router.push(`/auth/login?message=${message}`);
    } catch (err: any) {
      setError(err.message || "Unable to reset password");
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    if (!email) return;
    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Unable to resend code");
      }

      setSuccess(
        body.message || "If an account exists for this email, a new reset code has been sent.",
      );
    } catch (err: any) {
      setError(err.message || "Unable to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Set a new password
            </h2>
            <p className="text-sm text-slate-500">
              Enter the reset code from your email and choose a new password.
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-50/5 px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
              {success}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
            />
            <Input
              label="Reset code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="tracking-[0.3em]"
              required
            />

            {/* New password with live requirements */}
            <div className="space-y-1 text-sm">
              <label htmlFor="reset-new-password" className="block font-medium text-slate-700">
                New password
              </label>
              <input
                id="reset-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (!passwordDirty) setPasswordDirty(true);
                }}
                aria-invalid={passwordDirty && !pwResult.valid}
                aria-describedby="reset-pw-requirements"
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  passwordDirty && !pwResult.valid
                    ? "border-danger focus:ring-danger"
                    : "border-slate-300 hover:border-slate-400"
                }`}
                placeholder="At least 8 characters"
                required
              />
              <PasswordRequirements result={pwResult} dirty={passwordDirty} id="reset-pw-requirements" />
            </div>

            {/* Confirm password */}
            <div className="space-y-1 text-sm">
              <label htmlFor="reset-confirm-password" className="block font-medium text-slate-700">
                Confirm password
              </label>
              <input
                id="reset-confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (!confirmDirty) setConfirmDirty(true);
                }}
                aria-invalid={confirmMismatch}
                className={`w-full rounded-md border bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  confirmMismatch
                    ? "border-danger focus:ring-danger"
                    : "border-slate-300 hover:border-slate-400"
                }`}
                required
              />
              {confirmMismatch && (
                <p className="text-xs text-danger" role="alert">
                  Passwords do not match.
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
              Reset password
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={resending || !email}
              className="font-medium text-brand-600 hover:text-brand-500 transition-colors disabled:opacity-60"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
            <Link
              href="/auth/login"
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
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
      <ResetPasswordContent />
    </Suspense>
  );
}
