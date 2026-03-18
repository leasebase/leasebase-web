"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getApiBaseUrl } from "@/lib/apiBase";
import { getSignInUrl } from "@/lib/hostname";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

function ForgotPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";

  const [email, setEmail] = useState(initialEmail);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || body.error?.message || "Unable to process request");
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message || "Unable to process request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
              Reset your password
            </h2>
            <p className="text-sm text-slate-500">
              {submitted
                ? "If an account exists for this email, a reset code has been sent. Check your inbox."
                : "Enter your email address and we\u2019ll send you a code to reset your password."}
            </p>
          </div>

          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger-50/5 px-4 py-3 text-sm text-danger" role="alert">
              {error}
            </div>
          )}

          {!submitted ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
              <Button
                type="submit"
                loading={loading}
                className="w-full"
                size="lg"
              >
                Send reset code
              </Button>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-700">
                If an account exists for this email, a reset code has been sent.
              </div>
              <Button
                type="button"
                onClick={() =>
                  router.push(
                    `/auth/reset-password?email=${encodeURIComponent(email)}`,
                  )
                }
                className="w-full"
                size="lg"
              >
                Enter reset code
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-slate-500">
            <a
              href={getSignInUrl()}
              className="font-medium text-brand-600 hover:text-brand-500 transition-colors"
            >
              Back to sign in
            </a>
          </p>
        </div>
      </AuthCard>
    </AuthShell>
  );
}

export default function ForgotPasswordPage() {
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
      <ForgotPasswordContent />
    </Suspense>
  );
}
