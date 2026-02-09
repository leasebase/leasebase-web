"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/apiBase";

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialEmail = searchParams.get("email") || "";
  const next = searchParams.get("next") || "/";

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
      const res = await fetch(`${getApiBaseUrl()}/auth/confirm-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Unable to verify email");
      }

      const message = encodeURIComponent(
        body.message || "Your email has been verified. You can now sign in.",
      );
      router.push(`/auth/login?registered=true&message=${message}&next=${encodeURIComponent(next)}`);
    } catch (err: any) {
      setError(err.message || "Unable to verify email");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/resend-confirmation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const body = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(body.message || "Unable to resend verification code");
      }

      setSuccess(
        body.message || "We have sent a new verification code to your email.",
      );
    } catch (err: any) {
      setError(err.message || "Unable to resend verification code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Verify your email</h1>
        <p className="mt-1 text-sm text-slate-300">
          We&apos;ve sent a 6-digit verification code to
          {" "}
          <span className="font-medium text-slate-100">{email || "your email"}</span>.
          {" "}
          Enter it below to finish setting up your Leasebase account.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}
      {success && <p className="text-sm text-emerald-400">{success}</p>}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </div>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Verification code</label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm tracking-[0.3em]"
            placeholder="123456"
            required
          />
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {submitting ? "Verifying…" : "Verify email"}
        </button>
      </form>

      <div className="flex items-center justify-between text-sm text-slate-400">
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="text-emerald-400 hover:underline disabled:opacity-60"
        >
          {resending ? "Resending…" : "Resend code"}
        </button>
        <Link href="/auth/login" className="hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto"><p>Loading…</p></div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
