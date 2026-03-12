"use client";

import { useEffect, useState, type FormEvent, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { PasswordRequirements } from "@/components/auth/PasswordRequirements";
import { validatePassword } from "@/lib/validation/password";
import {
  fetchInvitationByToken,
  acceptInvitation,
  type InvitationAcceptInfo,
} from "@/services/invitations/invitationApiService";

type PageState =
  | { kind: "loading" }
  | { kind: "invite"; invite: InvitationAcceptInfo }
  | { kind: "success"; email: string }
  | { kind: "error"; code: string; message: string };

function AcceptInviteContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [state, setState] = useState<PageState>({ kind: "loading" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordDirty, setPasswordDirty] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const pwResult = validatePassword(password);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = pwResult.valid && passwordsMatch && password.length > 0;

  useEffect(() => {
    if (!token) {
      setState({ kind: "error", code: "MISSING_TOKEN", message: "No invitation token provided." });
      return;
    }

    fetchInvitationByToken(token)
      .then((res) => setState({ kind: "invite", invite: res.data }))
      .catch((err: any) => {
        setState({
          kind: "error",
          code: err.code || "UNKNOWN",
          message: err.message || "Unable to load invitation.",
        });
      });
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!canSubmit || state.kind !== "invite") return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      const res = await acceptInvitation({ token, password });
      setState({ kind: "success", email: res.data.email });
    } catch (err: any) {
      // If the invite was already accepted or revoked during submit, show that state
      if (err.code === "ALREADY_ACCEPTED" || err.code === "REVOKED" || err.code === "EXPIRED") {
        setState({ kind: "error", code: err.code, message: err.message });
      } else {
        setSubmitError(err.message || "Failed to accept invitation.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const tenantLoginUrl = "/auth/login";

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-slate-900">LeaseBase</h1>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* ── Loading ── */}
          {state.kind === "loading" && (
            <div className="space-y-3 text-center py-8">
              <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
              <p className="text-sm text-slate-500">Loading invitation…</p>
            </div>
          )}

          {/* ── Error states ── */}
          {state.kind === "error" && (
            <div className="space-y-4 text-center py-6">
              <div className="text-3xl">
                {state.code === "EXPIRED" ? "⏰" : state.code === "REVOKED" ? "🚫" : state.code === "ALREADY_ACCEPTED" ? "✅" : "⚠️"}
              </div>
              <h2 className="text-lg font-semibold text-slate-900">
                {state.code === "EXPIRED"
                  ? "Invitation Expired"
                  : state.code === "REVOKED"
                    ? "Invitation Revoked"
                    : state.code === "ALREADY_ACCEPTED"
                      ? "Already Accepted"
                      : "Invalid Invitation"}
              </h2>
              <p className="text-sm text-slate-500">{state.message}</p>
              {state.code === "ALREADY_ACCEPTED" && (
                <a href={tenantLoginUrl}>
                  <Button variant="primary">Sign In</Button>
                </a>
              )}
            </div>
          )}

          {/* ── Invite details + password form ── */}
          {state.kind === "invite" && (
            <>
              <h2 className="text-lg font-semibold text-slate-900 mb-1">Accept Your Invitation</h2>
              <p className="text-sm text-slate-500 mb-4">
                Set your password to activate your account.
              </p>

              <div className="rounded-md bg-slate-50 border border-slate-200 p-3 mb-4 space-y-1">
                {state.invite.inviterName && (
                  <p className="text-xs text-slate-500">
                    Invited by <span className="font-medium text-slate-700">{state.invite.inviterName}</span>
                  </p>
                )}
                {state.invite.propertyName && (
                  <p className="text-xs text-slate-600">
                    <span className="font-medium">{state.invite.propertyName}</span>
                    {state.invite.unitNumber && ` — Unit ${state.invite.unitNumber}`}
                  </p>
                )}
                <p className="text-xs text-slate-400">{state.invite.invitedEmail}</p>
              </div>

              {submitError && (
                <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700 mb-3">
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Input
                    label="Password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (!passwordDirty) setPasswordDirty(true);
                    }}
                    required
                    autoComplete="new-password"
                    placeholder="Create a strong password"
                  />
                  <PasswordRequirements result={pwResult} dirty={passwordDirty} />
                </div>

                <Input
                  label="Confirm password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  error={confirmPassword && !passwordsMatch ? "Passwords do not match" : undefined}
                />

                <Button
                  type="submit"
                  variant="primary"
                  className="w-full"
                  loading={isSubmitting}
                  disabled={!canSubmit}
                >
                  Accept Invitation
                </Button>
              </form>
            </>
          )}

          {/* ── Success ── */}
          {state.kind === "success" && (
            <div className="space-y-4 text-center py-6">
              <div className="text-3xl">🎉</div>
              <h2 className="text-lg font-semibold text-slate-900">Account Created!</h2>
              <p className="text-sm text-slate-500">
                Your account has been set up. Sign in to access your tenant portal.
              </p>
              <a href={tenantLoginUrl}>
                <Button variant="primary" className="w-full">
                  Sign In to LeaseBase
                </Button>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-brand-500" />
        </div>
      }
    >
      <AcceptInviteContent />
    </Suspense>
  );
}
