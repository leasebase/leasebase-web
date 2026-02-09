"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/apiBase";

function RegisterContent() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, firstName, lastName })
      });
      if (!res.ok) {
        const text = await res.text();
        let message = "Registration failed";
        try {
          const body = JSON.parse(text);
          message = body.message || message;
        } catch {
          // Non-JSON response (likely HTML error page)
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
          "Registration successful. Please check your email to verify your account."
      );
      router.push(`/auth/login?registered=true&message=${message}`);
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-300">
          Sign up to get started with Leasebase.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <form className="space-y-3" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              required
            />
          </div>
          <div className="space-y-1 text-sm">
            <label className="block text-slate-200">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={e => setLastName(e.target.value)}
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              required
            />
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </div>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Password</label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            placeholder="At least 8 characters"
            required
          />
        </div>
        <div className="space-y-1 text-sm">
          <label className="block text-slate-200">Confirm Password</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>

      <div className="border-t border-slate-800 pt-4">
        <p className="text-sm text-slate-400">
          Already have an account?{" "}
          <Link href="/auth/login" className="text-emerald-400 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto"><p>Loading...</p></div>}>
      <RegisterContent />
    </Suspense>
  );
}
