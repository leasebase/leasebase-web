"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/apiBase";
import { buildSignInRedirect, navigateToSignIn, getSignInUrl } from "@/lib/hostname";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ConfirmEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/confirm-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Unable to confirm email");
      }

      // After successful confirmation, redirect directly to sign-in.
      // All new owners default to the FREE plan — billing setup is optional
      // and can be done later from Settings.
      const url = buildSignInRedirect({ message: "Email confirmed. Please sign in." });
      navigateToSignIn(url, router);
    } catch (err: any) {
      setError(err.message || "Unable to confirm email");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Unable to resend code");
      }

      setSuccess(
        body.message || "If an account exists and is awaiting confirmation, a new code has been sent.",
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
              Confirm your email
            </h2>
            <p className="text-sm text-slate-500">
              We&apos;ve sent a 6-digit confirmation code to{" "}
              <span className="font-medium text-slate-700">{email || "your email"}</span>.{" "}
              Enter it below to activate your account.
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

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input
              label="Confirmation code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="123456"
              className="tracking-[0.3em]"
              required
            />
            <Button
              type="submit"
              loading={submitting}
              className="w-full"
              size="lg"
            >
              Confirm email
            </Button>
          </form>

          <div className="flex items-center justify-between text-sm">
            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="font-medium text-brand-600 hover:text-brand-500 transition-colors disabled:opacity-60"
            >
              {resending ? "Resending…" : "Resend code"}
            </button>
            <a
              href={getSignInUrl()}
              className="text-slate-500 hover:text-slate-700 transition-colors"
            >
              Back to sign in
            </a>
          </div>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function ConfirmEmailPage() {
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
      <ConfirmEmailContent />
    </Suspense>
  );
}
