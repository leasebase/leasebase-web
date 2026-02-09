"use client";

import { Suspense, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getApiBaseUrl } from "@/lib/apiBase";

export type UserType = "PROPERTY_MANAGER" | "OWNER" | "TENANT";

interface UserTypeOption {
  value: UserType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const userTypeOptions: UserTypeOption[] = [
  {
    value: "PROPERTY_MANAGER",
    label: "Property Manager",
    description: "Manage properties for multiple owners and landlords",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
  },
  {
    value: "OWNER",
    label: "Landlord / Owner",
    description: "Own and rent out your properties",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    value: "TENANT",
    label: "Tenant",
    description: "Rent a property and manage your lease",
    icon: (
      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
];

function RegisterContent() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [userType, setUserType] = useState<UserType | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!userType) {
      setError("Please select a user type");
      setLoading(false);
      return;
    }

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
        body: JSON.stringify({ email, password, firstName, lastName, userType })
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

  // Step 1: User type selection
  if (step === 1) {
    return (
      <div className="max-w-lg mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-300">
            First, tell us how you&apos;ll be using Leasebase.
          </p>
        </div>

        <div className="space-y-3">
          {userTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => handleUserTypeSelect(option.value)}
              className="w-full flex items-start gap-4 p-4 rounded-lg border border-slate-700 bg-slate-900 hover:border-emerald-500 hover:bg-slate-800 transition-colors text-left"
            >
              <div className="flex-shrink-0 p-2 rounded-lg bg-slate-800 text-emerald-400">
                {option.icon}
              </div>
              <div>
                <h3 className="font-medium text-slate-100">{option.label}</h3>
                <p className="mt-1 text-sm text-slate-400">{option.description}</p>
              </div>
            </button>
          ))}
        </div>

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

  // Step 2: Registration form
  const selectedOption = userTypeOptions.find(o => o.value === userType);

  return (
    <div className="max-w-md mx-auto space-y-6">
      <div>
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-sm text-slate-400 hover:text-slate-200 mb-4"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
        <h1 className="text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-slate-300">
          Signing up as <span className="text-emerald-400 font-medium">{selectedOption?.label}</span>
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
