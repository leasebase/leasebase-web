"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { track as trackEvent } from "@/lib/analytics";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LeaseForm } from "@/components/leases/LeaseForm";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { createLease } from "@/services/leases/leaseService";
import {
  createInvitation,
  InvitationApiError,
} from "@/services/invitations/invitationApiService";
import { fetchTemplates, type TemplateRow } from "@/services/documents/templateApiService";
import { UploadDocumentModal } from "@/components/documents/UploadDocumentModal";
import type { CreateLeaseDTO, LeaseRow, ActivationMode } from "@/services/leases/types";
import { authStore } from "@/lib/auth/store";
import { CheckCircle, Mail, FilePlus, FileText, Upload, Plus } from "lucide-react";

// ── Error messages ───────────────────────────────────────────────────────
const INVITE_ERROR_MESSAGES: Record<string, string> = {
  TENANT_ALREADY_INVITED: "A pending invitation already exists for this email on this unit.",
  TENANT_ALREADY_EXISTS: "A user with this email already exists in your organization.",
  ACTIVE_LEASE_EXISTS: "This unit already has an active lease and cannot be re-invited.",
};

// ══════════════════════════════════════════════════════════════════════════
// STEP: Choose track (New vs Existing)
// ══════════════════════════════════════════════════════════════════════════
function ChooseTrackStep({ onSelect }: { onSelect: (track: "new" | "existing") => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Is this a new lease or an existing lease?</h3>
        <p className="mt-1 text-sm text-slate-500">This determines how the lease will be activated.</p>
      </div>

      <button type="button" onClick={() => onSelect("new")}
        className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
        <FilePlus size={20} className="mt-0.5 shrink-0 text-brand-500" />
        <div>
          <p className="text-sm font-medium text-slate-900">New lease</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Create a new lease from a template. The tenant will need to sign the lease document before it becomes active.
          </p>
        </div>
      </button>

      <button type="button" onClick={() => onSelect("existing")}
        className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-4 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
        <FileText size={20} className="mt-0.5 shrink-0 text-emerald-500" />
        <div>
          <p className="text-sm font-medium text-slate-900">Existing lease</p>
          <p className="mt-0.5 text-xs text-slate-500">
            I already have a signed lease. The lease will activate automatically once the tenant accepts the invitation.
          </p>
        </div>
      </button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STEP: Template picker (New lease track)
// ══════════════════════════════════════════════════════════════════════════
function TemplatePickerStep({ onSelect, onUpload }: {
  onSelect: (templateId: string) => void;
  onUpload: () => void;
}) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchTemplates({ category: "LEASE_AGREEMENT", active: true })
      .then((res) => { if (!cancelled) setTemplates(res.data); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  if (loading) return <Skeleton variant="text" className="h-24 w-full rounded-lg" />;

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Choose a lease template</h3>
        <p className="mt-1 text-sm text-slate-500">Select an existing template or upload a new one.</p>
      </div>

      {templates.length > 0 ? (
        <div className="space-y-2">
          {templates.map((t) => (
            <button key={t.id} type="button" onClick={() => onSelect(t.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left hover:border-brand-300 hover:bg-brand-50/30 transition-colors">
              <FileText size={18} className="shrink-0 text-slate-400" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{t.name}</p>
                {t.description && <p className="text-xs text-slate-400 truncate">{t.description}</p>}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="text-sm text-slate-500">No templates found. Upload one to get started.</p>
        </div>
      )}

      <Button variant="secondary" size="sm" icon={<Plus size={14} />} onClick={onUpload}>
        Upload new template
      </Button>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STEP: Upload existing doc (Existing lease track)
// ══════════════════════════════════════════════════════════════════════════
function UploadOrSkipStep({ lease, onDone }: { lease: LeaseRow; onDone: () => void }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploaded, setUploaded] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Upload signed lease (optional)</h3>
        <p className="mt-1 text-sm text-slate-500">
          You can upload the signed lease document now for record-keeping, or skip and do it later.
        </p>
      </div>

      {uploaded ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
          Document uploaded successfully.
        </div>
      ) : (
        <Button variant="secondary" icon={<Upload size={14} />} onClick={() => setUploadOpen(true)}>
          Upload signed lease
        </Button>
      )}

      <div className="flex justify-end pt-2">
        <Button variant="primary" onClick={onDone}>
          {uploaded ? "Continue to invite" : "Skip & continue"}
        </Button>
      </div>

      <UploadDocumentModal
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => { setUploadOpen(false); setUploaded(true); }}
      />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// STEP: Invite tenant
// ══════════════════════════════════════════════════════════════════════════
function InviteStep({ lease, onDone }: { lease: LeaseRow; onDone: () => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null); setSubmitting(true);
    try {
      await createInvitation({
        email, firstName, lastName, phone: phone || undefined,
        propertyId: lease.property_id, unitId: lease.unit_id,
        leaseStart: lease.start_date?.split("T")[0],
        leaseEnd: lease.end_date?.split("T")[0],
        securityDeposit: lease.security_deposit ?? undefined,
      });
      setSent(true);
    } catch (err: any) {
      const code = err instanceof InvitationApiError ? err.code : undefined;
      setError((code && INVITE_ERROR_MESSAGES[code]) || err.message || "Failed to send invitation.");
    } finally { setSubmitting(false); }
  }

  if (sent) return (
    <div className="space-y-4 text-center py-6">
      <CheckCircle size={40} className="mx-auto text-green-500" strokeWidth={1.5} />
      <h3 className="text-base font-semibold text-slate-900">Invitation sent!</h3>
      <p className="text-sm text-slate-500">An email has been sent to <strong>{email}</strong>.</p>
      <Button variant="primary" onClick={onDone}>Go to Leases</Button>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="text-base font-semibold text-slate-900">Invite Tenant</h3>
        <p className="mt-1 text-sm text-slate-500">Lease created. Invite the tenant now or skip.</p>
      </div>
      <div className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-600">
        {lease.property_name ? (
          <span><span className="font-medium">{lease.property_name}</span>
            {lease.unit_number && <span> — Unit <span className="font-medium">{lease.unit_number}</span></span>}
          </span>
        ) : <span className="font-medium">Unit ID: {lease.unit_id}</span>}
      </div>
      {error && <div className="rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <Input label="First name" value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="Jane" />
        <Input label="Last name" value={lastName} onChange={(e) => setLastName(e.target.value)} required placeholder="Smith" />
      </div>
      <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="jane@example.com" />
      <Input label="Phone (optional)" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1 555 123 4567" />
      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={onDone} disabled={submitting}>Skip for now</Button>
        <Button type="submit" variant="primary" icon={<Mail size={14} />} loading={submitting}>Send Invitation</Button>
      </div>
    </form>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ══════════════════════════════════════════════════════════════════════════

type Track = "new" | "existing";
type Step = "choose" | "template" | "lease" | "upload" | "invite";

export default function CreateLeasePage() {
  const router = useRouter();
  const { user } = authStore();
  const [track, setTrack] = useState<Track | null>(null);
  const [step, setStep] = useState<Step>("choose");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [createdLease, setCreatedLease] = useState<LeaseRow | null>(null);
  const [pendingLeaseData, setPendingLeaseData] = useState<CreateLeaseDTO | null>(null);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  if (user?.persona !== "owner") {
    return <div className="text-sm text-slate-400">You do not have permission to create leases.</div>;
  }

  const handleTrackSelect = (t: Track) => {
    setTrack(t);
    setStep(t === "new" ? "template" : "lease");
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    setStep("lease");
  };

  const handleLeaseFormSubmit = async (data: CreateLeaseDTO) => {
    if (track === "existing") {
      // Create lease immediately with EXISTING_LEASE mode
      setCreating(true); setCreateError(null);
      try {
        const result = await createLease({ ...data, activationMode: "EXISTING_LEASE" });
        setCreatedLease(result.data);
        setStep("upload");
        trackEvent("lease_created", { leaseId: result.data.id, activationMode: "EXISTING_LEASE" });
      } catch (err: any) {
        setCreateError(err?.message || "Failed to create lease.");
      } finally { setCreating(false); }
    } else {
      // Save form data, create on next step
      setPendingLeaseData(data);
      setCreating(true); setCreateError(null);
      try {
        const result = await createLease({
          ...data,
          activationMode: "NEW_LEASE",
          templateId: selectedTemplateId || undefined,
        });
        setCreatedLease(result.data);
        setStep("invite");
        trackEvent("lease_created", { leaseId: result.data.id, activationMode: "NEW_LEASE" });
      } catch (err: any) {
        setCreateError(err?.message || "Failed to create lease.");
      } finally { setCreating(false); }
    }
  };

  const handleUploadDone = () => setStep("invite");
  const handleInviteDone = () => router.push("/app/leases");

  // Step labels for indicator
  const steps: { key: Step; label: string }[] = track === "new"
    ? [{ key: "template", label: "Template" }, { key: "lease", label: "Lease details" }, { key: "invite", label: "Invite" }]
    : track === "existing"
    ? [{ key: "lease", label: "Lease details" }, { key: "upload", label: "Document" }, { key: "invite", label: "Invite" }]
    : [];

  return (
    <>
      <Breadcrumb items={[{ label: "Leases", href: "/app/leases" }, { label: "New Lease" }]} className="mb-4" />
      <PageHeader title="Create Lease" description={
        step === "choose" ? "Is this a new lease or an existing lease?" :
        step === "template" ? "Select a lease template." :
        step === "lease" ? "Enter lease details." :
        step === "upload" ? "Optionally upload the signed lease document." :
        "Invite the tenant."
      } />

      {/* Step indicator */}
      {steps.length > 0 && (
        <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
          {steps.map((s, i) => (
            <span key={s.key}>
              {i > 0 && <span className="text-slate-300 mr-2">/</span>}
              <span className={`font-medium ${step === s.key ? "text-blue-600" : "text-slate-400"}`}>
                {i + 1}. {s.label}
              </span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-6 max-w-2xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {step === "choose" && <ChooseTrackStep onSelect={handleTrackSelect} />}

          {step === "template" && (
            <TemplatePickerStep
              onSelect={handleTemplateSelect}
              onUpload={() => router.push("/app/documents")}
            />
          )}

          {step === "lease" && (
            <>
              {createError && <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{createError}</div>}
              {creating ? (
                <p className="text-sm text-slate-500">Creating lease…</p>
              ) : (
                <LeaseForm
                  onSubmit={handleLeaseFormSubmit}
                  onCancel={() => router.push("/app/leases")}
                  submitLabel={track === "existing" ? "Create Lease" : "Create Lease & Continue"}
                />
              )}
            </>
          )}

          {step === "upload" && createdLease && (
            <UploadOrSkipStep lease={createdLease} onDone={handleUploadDone} />
          )}

          {step === "invite" && createdLease && (
            <InviteStep lease={createdLease} onDone={handleInviteDone} />
          )}
        </div>
      </div>
    </>
  );
}
