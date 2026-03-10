"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Building2, Home, User, ChevronLeft } from "lucide-react";
import { getApiBaseUrl } from "@/lib/apiBase";
import { validatePassword, isPasswordComplexityError } from "@/lib/validation/password";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { AuthShell } from "@/components/auth/AuthShell";
import { AuthCard } from "@/components/auth/AuthCard";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

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
    icon: <Building2 size={22} />,
  },
  {
    value: "OWNER",
    label: "Landlord / Owner",
    description: "Own and rent out your properties",
    icon: <Home size={22} />,
  },
  {
    value: "TENANT",
    label: "Tenant",
    description: "Rent a property and manage your lease",
    icon: <User size={22} />,
  },
];

/* ------------------------------------------------------------------ */
/*  Field-level error state                                            */
/* ------------------------------------------------------------------ */
interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

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

  const handleUserTypeSelect = (type: UserType) => {
    setUserType(type);
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError(null);
    setFieldErrors({});
  };

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
        router.push(`/auth/login?registered=true&message=${message}`);
      } else {
        router.push(`/auth/verify-email?email=${encodeURIComponent(email)}`);
      }
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // Step 1: User type selection
  if (step === 1) {
    return (
      <AuthShell>
        <AuthCard className="max-w-lg">
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-semibold tracking-tight text-white">
                Create your account
              </h2>
              <p className="text-sm text-slate-400">
                First, tell us how you&apos;ll be using Leasebase.
              </p>
            </div>

            <div className="space-y-3">
              {userTypeOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleUserTypeSelect(option.value)}
                  className="w-full flex items-start gap-4 rounded-xl border border-slate-700/60 bg-slate-900/60 p-4 text-left transition-all hover:border-brand-500/60 hover:bg-slate-800/60 focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500/10 text-brand-400">
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-100">{option.label}</h3>
                    <p className="mt-0.5 text-sm text-slate-400">{option.description}</p>
                  </div>
                </button>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
              >
                Sign in
              </Link>
            </p>
          </div>
        </AuthCard>
      </AuthShell>
    );
  }

  // Step 2: Registration form
  const selectedOption = userTypeOptions.find((o) => o.value === userType);

  return (
    <AuthShell>
      <AuthCard>
        <div className="space-y-6">
          <div>
            <button
              onClick={handleBack}
              className="mb-4 flex items-center gap-1 text-sm text-slate-400 transition-colors hover:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 rounded"
            >
              <ChevronLeft size={16} />
              Back
            </button>
            <h2 className="text-2xl font-semibold tracking-tight text-white">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Signing up as{" "}
              <span className="font-medium text-brand-400">{selectedOption?.label}</span>
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
              <label htmlFor="register-password" className="block font-medium text-slate-200">
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
                className={`w-full rounded-md border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  fieldErrors.password
                    ? "border-danger focus:ring-danger"
                    : "border-slate-700 hover:border-slate-600"
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
              <label htmlFor="register-confirm" className="block font-medium text-slate-200">
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
                className={`w-full rounded-md border bg-slate-900 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
                  confirmMismatch || fieldErrors.confirmPassword
                    ? "border-danger focus:ring-danger"
                    : "border-slate-700 hover:border-slate-600"
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
            <Link
              href="/auth/login"
              className="font-medium text-brand-400 hover:text-brand-300 transition-colors"
            >
              Sign in
            </Link>
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
