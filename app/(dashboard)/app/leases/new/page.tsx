"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LeaseForm } from "@/components/leases/LeaseForm";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { createLease } from "@/services/leases/leaseService";
import {
  createInvitation,
  InvitationApiError,
} from "@/services/invitations/invitationApiService";
import type { CreateLeaseDTO, LeaseRow, ActivationMode } from "@/services/leases/types";
import { authStore } from "@/lib/auth/store";
import { CheckCircle, Mail, Upload, FileCheck, AlertTriangle } from "lucide-react";

// ── Friendly messages for invitation conflict codes ─────────────────
const INVITE_ERROR_MESSAGES: Record<string, string> = {
  TENANT_ALREADY_INVITED:
    "A pending invitation already exists for this email on this unit. You can resend it from the Invitations page.",
  TENANT_ALREADY_EXISTS:
    "A user with this email already exists in your organization.",
  ACTIVE_LEASE_EXISTS:
    "This unit already has an active lease and cannot be re-invited.",
};

// ── Step 2: Inline tenant invitation form ────────────────────────
interface InviteStepProps {
  lease: LeaseRow;
  onDone: () => void;
}

function InviteStep({ lease, onDone }: InviteStepProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await createInvitation({
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        propertyId: lease.property_id,
        unitId: lease.unit_id,
        leaseStart: lease.start_date?.split("T")[0],
        leaseEnd: lease.end_date?.split("T")[0],
        securityDeposit: lease.security_deposit ?? undefined,
      });
      setSent(true);
    } catch (err: any) {
      const code = err instanceof InvitationApiError ? err.code : undefined;
      setError(
        (code && INVITE_ERROR_MESSAGES[code]) ||
          err.message ||
          "Failed to send invitation.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4 text-center py-6">
        <CheckCircle size={40} className="mx-auto text-green-500" strokeWidth={1.5} />
        <h3 className="text-base font-semibold text-slate-900">Invitation sent!</h3>
        <p className="text-sm text-slate-500">
          An email has been sent to <strong>{email}</strong> with a link to set their
          password and activate their account.
        </p>
        <Button variant="primary" onClick={onDone}>
          Go to Leases
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Invite Tenant</h3>
        <p className="mt-1 text-sm text-slate-500">
          Lease created. Optionally invite the tenant now — they will receive an
          email to set their password and activate their account.
        </p>
      </div>

      {/* Context pill */}
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
        {lease.property_name ? (
          <span>
            <span className="font-medium">{lease.property_name}</span>
            {lease.unit_number && (
              <span> — Unit <span className="font-medium">{lease.unit_number}</span></span>
            )}
          </span>
        ) : (
          <span className="font-medium">Unit ID: {lease.unit_id}</span>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <Input
          label="First name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          required
          placeholder="Jane"
        />
        <Input
          label="Last name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          required
          placeholder="Smith"
        />
      </div>

      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="jane@example.com"
      />

      <Input
        label="Phone (optional)"
        type="tel"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        placeholder="+1 555 123 4567"
      />

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone} disabled={submitting}>
          Skip for now
        </Button>
        <Button
          type="submit"
          variant="primary"
          icon={<Mail size={14} />}
          loading={submitting}
        >
          Send Invitation
        </Button>
      </div>
    </form>
  );
}

// ── Step 2: Activation Path ────────────────────────────────────────────
interface ActivationPathStepProps {
  onSelect: (mode: ActivationMode) => void;
}

function ActivationPathStep({ onSelect }: ActivationPathStepProps) {
  const [attested, setAttested] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Activation Path</h3>
        <p className="mt-1 text-sm text-slate-500">
          How will this lease be activated? Choose the document handling approach.
        </p>
      </div>

      {/* Option 1: Upload existing signed lease */}
      <button
        type="button"
        onClick={() => onSelect("EXISTING_SIGNED_UPLOAD")}
        className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-colors"
      >
        <Upload size={20} className="mt-0.5 shrink-0 text-brand-500" />
        <div>
          <p className="text-sm font-medium text-slate-900">Upload existing signed lease</p>
          <p className="mt-0.5 text-xs text-slate-500">
            I have a signed lease document (PDF) to upload. The lease will activate
            after I upload and confirm the document.
          </p>
        </div>
      </button>

      {/* Option 2: Skip document for now */}
      <div className="rounded-lg border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <FileCheck size={20} className="mt-0.5 shrink-0 text-amber-500" />
          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Skip document for now</p>
            <p className="mt-0.5 text-xs text-slate-500">
              The lease will activate automatically when the tenant accepts the invitation.
              You can upload a lease document later.
            </p>

            {/* Attestation checkbox */}
            <label className="mt-3 flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={attested}
                onChange={(e) => setAttested(e.target.checked)}
                className="mt-0.5 rounded border-slate-300 text-brand-500 focus:ring-brand-500"
              />
              <span className="text-xs text-slate-600">
                I confirm that tenant signature is not required in-platform at this time.
                I understand the lease will activate without an uploaded document.
              </span>
            </label>

            <Button
              variant="secondary"
              size="sm"
              className="mt-3"
              disabled={!attested}
              onClick={() => onSelect("OWNER_ATTESTED_NO_DOCUMENT")}
            >
              Continue without document
            </Button>
          </div>
        </div>
      </div>

      {/* Future: e-sign (disabled) */}
      <div className="flex items-start gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 opacity-50">
        <AlertTriangle size={20} className="mt-0.5 shrink-0 text-slate-400" />
        <div>
          <p className="text-sm font-medium text-slate-400">Create & send for e-signature</p>
          <p className="mt-0.5 text-xs text-slate-400">
            Coming soon — generate a lease from a template and send for digital signature.
          </p>
        </div>
      </div>
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────

type Step = "lease" | "activation" | "invite";

export default function CreateLeasePage() {
  const router = useRouter();
  const { user } = authStore();
  const [step, setStep] = useState<Step>("lease");
  const [createdLease, setCreatedLease] = useState<LeaseRow | null>(null);
  const [pendingLeaseData, setPendingLeaseData] = useState<CreateLeaseDTO | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  // Only owner can create leases
  if (user?.persona !== "owner") {
    return (
      <div className="text-sm text-slate-400">
        You do not have permission to create leases.
      </div>
    );
  }

  const handleLeaseFormSubmit = async (data: CreateLeaseDTO) => {
    // Don't create yet — save form data and move to activation path
    setPendingLeaseData(data);
    setStep("activation");
  };

  const handleActivationSelect = async (mode: ActivationMode) => {
    if (!pendingLeaseData) return;
    setCreating(true);
    setCreateError(null);
    try {
      const result = await createLease({ ...pendingLeaseData, activationMode: mode });
      setCreatedLease(result.data);
      setStep("invite");
      track("first_action_taken", { type: "lease" });
      track("lease_created", { leaseId: result.data.id, activationMode: mode });
    } catch (err: any) {
      setCreateError(err?.message || "Failed to create lease.");
    } finally {
      setCreating(false);
    }
  };

  const handleInviteDone = () => {
    router.push("/app/leases");
  };

  const stepDescriptions: Record<Step, string> = {
    lease: "Create a new lease agreement — select property, unit, and terms.",
    activation: "Choose how this lease will be activated.",
    invite: "Lease created. Invite the tenant or skip to finish.",
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Leases", href: "/app/leases" },
          { label: "New Lease" },
        ]}
        className="mb-4"
      />
      <PageHeader
        title="Create Lease"
        description={stepDescriptions[step]}
      />

      {/* Step indicator */}
      <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <span className={`font-medium ${step === "lease" ? "text-blue-600" : "text-slate-400"}`}>1. Lease details</span>
        <span className="text-slate-300">/</span>
        <span className={`font-medium ${step === "activation" ? "text-blue-600" : "text-slate-400"}`}>2. Activation path</span>
        <span className="text-slate-300">/</span>
        <span className={`font-medium ${step === "invite" ? "text-blue-600" : "text-slate-400"}`}>3. Invite tenant</span>
      </div>

      <div className="mt-6 max-w-2xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {step === "lease" && (
            <LeaseForm
              onSubmit={handleLeaseFormSubmit}
              onCancel={() => router.push("/app/leases")}
              submitLabel="Continue"
            />
          )}
          {step === "activation" && (
            <>
              {createError && (
                <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</div>
              )}
              {creating ? (
                <p className="text-sm text-slate-500">Creating lease…</p>
              ) : (
                <ActivationPathStep onSelect={handleActivationSelect} />
              )}
            </>
          )}
          {step === "invite" && createdLease && (
            <InviteStep lease={createdLease} onDone={handleInviteDone} />
          )}
        </div>
      </div>
    </>
  );
}
