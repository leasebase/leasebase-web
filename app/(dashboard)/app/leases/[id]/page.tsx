"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Tabs, type TabItem } from "@/components/ui/Tabs";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { authStore } from "@/lib/auth/store";
import {
  fetchLease,
  updateLease,
  terminateLease,
  renewLease,
  activateLease,
} from "@/services/leases/leaseService";
import type { LeaseRow, CreateLeaseDTO, RenewLeaseDTO } from "@/services/leases/types";
import {
  fetchPendingInvitationsForUnit,
  resendInvitation,
  type TenantInvitation,
} from "@/services/invitations/invitationApiService";
import { InviteTenantModal } from "@/components/invitations/InviteTenantModal";
import { LeaseForm } from "@/components/leases/LeaseForm";
import { LeaseDetailSkeleton } from "@/components/leases/LeaseDetailSkeleton";
import { Mail, RefreshCw, CheckCircle2, AlertCircle, FileCheck, Upload } from "lucide-react";
import {
  fetchLeaseDocuments,
  confirmLeaseDocument,
  type DocumentRow,
} from "@/services/documents/documentApiService";

/* ── Helpers ── */

/** Badge variant for lease-lifecycle display status. */
function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE":
    case "EXTENDED":      return "success";
    case "ACKNOWLEDGED":  return "info";
    case "DRAFT":         return "warning";
    case "INACTIVE":      return "danger";
    case "RENEWED":       return "neutral";
    default:              return "neutral";
  }
}

/** Resolve display_status (prefers backend-computed field, falls back to raw). */
function resolveDisplayStatus(lease: LeaseRow): string {
  return lease.display_status ?? lease.status;
}

function formatCurrency(cents: number): string {
  return `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString();
}

/* ── Overview Panel ── */

function OverviewPanel({
  lease,
  onTerminate,
  onRenew,
  onActivate,
  onInviteTenant,
  onResendInvite,
  pendingInvitation,
  resendLoading,
  activateLoading,
  activateError,
}: {
  lease: LeaseRow;
  onTerminate: () => void;
  onRenew: () => void;
  onActivate: () => void;
  onInviteTenant: () => void;
  onResendInvite: () => void;
  pendingInvitation: TenantInvitation | null;
  resendLoading: boolean;
  activateLoading: boolean;
  activateError: string | null;
}) {
  const hasTenants = lease.tenants && lease.tenants.length > 0;
  const showInvite = lease.status === "DRAFT" && !hasTenants;
  const showResend =
    ["ASSIGNED", "INVITED"].includes(lease.status) &&
    pendingInvitation != null;
  const showActivate = lease.status === "ACKNOWLEDGED";
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rent</h3>
          <p className="text-lg font-semibold text-slate-900">
            {formatCurrency(lease.rent_amount)}/mo
          </p>
          <p className="text-xs text-slate-500">
            {(lease.term_type ?? "").replace(/_/g, " ")}
          </p>
          {lease.security_deposit != null && (
            <p className="text-xs text-slate-500">
              Deposit: {formatCurrency(lease.security_deposit)}
            </p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Dates</h3>
          <p className="text-sm text-slate-700">
            {formatDate(lease.start_date)} — {formatDate(lease.end_date)}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
          <Badge variant={statusVariant(resolveDisplayStatus(lease))}>{resolveDisplayStatus(lease)}</Badge>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Property &amp; Unit
          </h3>
          <p className="text-sm text-slate-700">
            {lease.property_name ? (
              <Link
                href={`/app/properties/${lease.property_id}`}
                className="text-brand-600 hover:underline"
              >
                {lease.property_name}
              </Link>
            ) : (
              lease.property_id
            )}
          </p>
          <p className="text-xs text-slate-500">
            Unit: {lease.unit_number ?? lease.unit_id}
          </p>
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenants</h3>
          {hasTenants ? (
            <ul className="text-sm text-slate-700 space-y-1">
              {lease.tenants!.map((t) => (
                <li key={t.id}>{t.name} <span className="text-xs text-slate-400">({t.role})</span></li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-400">Not assigned</p>
          )}
          {pendingInvitation && (
            <p className="text-xs text-amber-600">
              Invitation pending — sent to {pendingInvitation.invited_email}
            </p>
          )}
        </div>
      </div>

      {/* Status-dependent actions */}
      <div className="flex flex-col gap-3 pt-2">
        {lease.status === "ACTIVE" && (
          <div className="flex items-center gap-3">
            <Button variant="danger" size="sm" onClick={onTerminate}>
              Terminate
            </Button>
            <Button variant="secondary" size="sm" onClick={onRenew}>
              Renew
            </Button>
          </div>
        )}
        {showInvite && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onInviteTenant}
            icon={<Mail size={14} />}
          >
            Invite Tenant
          </Button>
        )}
        {showResend && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onResendInvite}
            loading={resendLoading}
            icon={<RefreshCw size={14} />}
          >
            Re-send Invite
          </Button>
        )}
        {showActivate && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 text-blue-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-blue-900">Tenant has accepted — activate tenancy</p>
                <p className="text-xs text-blue-700 mt-1">
                  The tenant has joined. Upload the signed lease document below and confirm it,
                  then click <strong>Activate Lease</strong> to make the unit occupied and the tenant active.
                </p>
              </div>
            </div>
            {activateError && (
              <p className="text-xs text-red-600 rounded border border-red-200 bg-red-50 px-3 py-2">
                {activateError}
              </p>
            )}
            <Button
              variant="primary"
              size="sm"
              onClick={onActivate}
              loading={activateLoading}
              icon={<CheckCircle2 size={14} />}
            >
              Activate Lease
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Documents Panel ── */

const DOC_STATUS_LABELS: Record<string, string> = {
  UPLOADED: "Uploaded",
  EXECUTED: "Executed",
  CONFIRMED_EXTERNAL: "Confirmed on file",
};

const DOC_STATUS_VARIANTS: Record<string, "success" | "info" | "warning" | "neutral"> = {
  UPLOADED: "warning",
  EXECUTED: "success",
  CONFIRMED_EXTERNAL: "success",
};

function DocumentsPanel({
  leaseId,
  isAcknowledged,
  onDocumentConfirmed,
}: {
  leaseId: string;
  isAcknowledged: boolean;
  onDocumentConfirmed: () => void;
}) {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLeaseDocuments(leaseId)
      .then((res) => { if (!cancelled) setDocs(res.data); })
      .catch(() => { if (!cancelled) setError("Failed to load documents"); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [leaseId]);

  const handleConfirm = async (docId: string, status: "EXECUTED" | "CONFIRMED_EXTERNAL") => {
    setConfirmingId(docId);
    setConfirmError(null);
    try {
      const result = await confirmLeaseDocument(docId, status);
      setDocs((prev) => prev.map((d) => d.id === docId ? result.data : d));
      onDocumentConfirmed();
    } catch (e: any) {
      setConfirmError(e.message || "Failed to confirm document");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) return <p className="text-sm text-slate-400">Loading documents…</p>;
  if (error) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div className="space-y-4">
      {isAcknowledged && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-medium flex items-center gap-1.5">
            <FileCheck size={15} />
            Document confirmation required before activation
          </p>
          <p className="mt-1 text-xs">
            Upload the executed lease document and mark it as <strong>Confirmed on file</strong> or
            <strong> Executed</strong>. Once confirmed, use the <strong>Activate Lease</strong>
            action on the Overview tab.
          </p>
        </div>
      )}

      {confirmError && (
        <p className="text-xs text-red-600 rounded border border-red-200 bg-red-50 px-3 py-2">
          {confirmError}
        </p>
      )}

      {docs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <Upload size={24} className="mx-auto mb-2 text-slate-300" />
          <p className="text-sm text-slate-500">No documents yet.</p>
          <p className="text-xs text-slate-400 mt-1">
            Upload the signed lease using the button below, then confirm its status.
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {docs.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
            >
              <div>
                <p className="text-sm font-medium text-slate-900">{doc.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={DOC_STATUS_VARIANTS[doc.status] ?? "neutral"}>
                  {DOC_STATUS_LABELS[doc.status] ?? doc.status}
                </Badge>
                {doc.status === "UPLOADED" && isAcknowledged && (
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={confirmingId === doc.id}
                    onClick={() => handleConfirm(doc.id, "CONFIRMED_EXTERNAL")}
                    icon={<CheckCircle2 size={13} />}
                  >
                    Confirm on file
                  </Button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs text-slate-400">
        To upload, use the API directly:
        {" "}
        <code className="font-mono bg-slate-100 px-1 rounded">POST /api/documents/upload</code>
        {" "}with{" "}
        <code className="font-mono bg-slate-100 px-1 rounded">relatedType=LEASE</code>.
        E-sign integration coming soon.
      </p>
    </div>
  );
}

/* ── Edit Panel ── */

function EditPanel({
  lease,
  onSaved,
}: {
  lease: LeaseRow;
  onSaved: (updated: LeaseRow) => void;
}) {
  const [saved, setSaved] = useState(false);

  const handleSubmit = async (data: CreateLeaseDTO) => {
    const result = await updateLease(lease.id, data);
    onSaved(result.data);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl">
      {saved && (
        <div className="mb-4 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Lease updated successfully.
        </div>
      )}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <LeaseForm
          initial={lease}
          onSubmit={handleSubmit}
          onCancel={() => {}}
          submitLabel="Save Changes"
        />
      </div>
    </div>
  );
}

/* ── Detail Content ── */

function LeaseDetailContent() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [lease, setLease] = useState<LeaseRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTerminate, setShowTerminate] = useState(false);
  const [showRenew, setShowRenew] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingInvitation, setPendingInvitation] = useState<TenantInvitation | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [activateLoading, setActivateLoading] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  // Renew form state
  const [renewStartDate, setRenewStartDate] = useState("");

  const loadInvitations = useCallback(
    async (unitId: string) => {
      try {
        const pending = await fetchPendingInvitationsForUnit(unitId);
        setPendingInvitation(pending[0] ?? null);
      } catch {
        // Non-critical — don't block the page.
      }
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;
    fetchLease(id)
      .then((res) => {
        if (!cancelled) {
          setLease(res.data);
          loadInvitations(res.data.unit_id);
        }
      })
      .catch((e: any) => {
        if (!cancelled) setError(e.message || "Failed to load lease");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, loadInvitations]);

  const handleTerminate = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const result = await terminateLease(id);
      setLease(result.data);
      setShowTerminate(false);
    } catch (e: any) {
      setActionError(e.message || "Failed to terminate lease");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRenew = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const dto: RenewLeaseDTO = {
        termType: lease?.term_type ?? "TWELVE_MONTH",
        startDate: renewStartDate,
      };
      const result = await renewLease(id, dto);
      setShowRenew(false);
      router.push(`/app/leases/${result.data.id}`);
    } catch (e: any) {
      setActionError(e.message || "Failed to renew lease");
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    setActivateLoading(true);
    setActivateError(null);
    try {
      const result = await activateLease(id);
      setLease(result.data);
    } catch (e: any) {
      const msg = e.message || "Failed to activate lease";
      // Surface documentation requirement hint clearly
      setActivateError(
        msg.includes("DOCUMENTATION_REQUIRED") || msg.includes("documentation")
          ? "A confirmed or executed lease document is required before activation. Upload the signed lease and confirm it first."
          : msg,
      );
    } finally {
      setActivateLoading(false);
    }
  };

  const handleInviteSuccess = () => {
    setShowInviteModal(false);
    // Re-fetch lease and invitations to reflect new state.
    fetchLease(id)
      .then((res) => {
        setLease(res.data);
        loadInvitations(res.data.unit_id);
      })
      .catch(() => {});
  };

  const handleResendInvite = async () => {
    if (!pendingInvitation) return;
    setResendLoading(true);
    setResendSuccess(false);
    try {
      await resendInvitation(pendingInvitation.id);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 4000);
      // Refresh invitation data (token/expiry may have changed).
      if (lease) loadInvitations(lease.unit_id);
    } catch (e: any) {
      setActionError(e.message || "Failed to re-send invitation");
    } finally {
      setResendLoading(false);
    }
  };

  const handleSaved = (updated: LeaseRow) => setLease(updated);

  const tabs: TabItem[] = useMemo(() => {
    if (!lease) return [];
    return [
      {
        id: "overview",
        label: "Overview",
        content: (
          <OverviewPanel
            lease={lease}
            onTerminate={() => setShowTerminate(true)}
            onRenew={() => setShowRenew(true)}
            onActivate={handleActivate}
            onInviteTenant={() => setShowInviteModal(true)}
            onResendInvite={handleResendInvite}
            pendingInvitation={pendingInvitation}
            resendLoading={resendLoading}
            activateLoading={activateLoading}
            activateError={activateError}
          />
        ),
      },
      {
        id: "edit",
        label: "Edit",
        content: <EditPanel lease={lease} onSaved={handleSaved} />,
      },
      {
        id: "documents",
        label: "Documents",
        content: (
          <DocumentsPanel
            leaseId={lease.id}
            isAcknowledged={lease.status === "ACKNOWLEDGED"}
            onDocumentConfirmed={() => {
              // After confirming a document, clear any activate error so owner can retry
              setActivateError(null);
            }}
          />
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lease, pendingInvitation, resendLoading, activateLoading, activateError]);

  if (isLoading) return <LeaseDetailSkeleton />;

  if (error) {
    return (
      <>
        <Breadcrumb
          items={[{ label: "Leases", href: "/app/leases" }, { label: "Error" }]}
          className="mb-4"
        />
        <div
          className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      </>
    );
  }

  if (!lease) return null;

  const title = `Lease — ${lease.unit_number ? `Unit ${lease.unit_number}` : lease.unit_id}${
    lease.property_name ? ` at ${lease.property_name}` : ""
  }`;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Leases", href: "/app/leases" },
          {
            label: lease.unit_number
              ? `Unit ${lease.unit_number}`
              : lease.id.slice(0, 8),
          },
        ]}
        className="mb-4"
      />
      <PageHeader title={title} />
      <Tabs items={tabs} defaultActiveId="overview" className="mt-6" />

      {/* Terminate confirmation modal */}
      <Modal
        open={showTerminate}
        onClose={() => setShowTerminate(false)}
        title="Terminate Lease"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to terminate this lease? This action sets the
            status to TERMINATED and the end date to today.
          </p>
          {actionError && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {actionError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowTerminate(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleTerminate}
              disabled={actionLoading}
            >
              {actionLoading ? "Terminating…" : "Terminate"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Resend success banner */}
      {resendSuccess && (
        <div className="fixed bottom-4 right-4 z-50 rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 shadow-lg">
          Invitation re-sent successfully.
        </div>
      )}

      {/* Invite Tenant modal */}
      <InviteTenantModal
        open={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={handleInviteSuccess}
        propertyUnit={
          lease
            ? {
                propertyId: lease.property_id,
                propertyName: lease.property_name ?? lease.property_id,
                unitId: lease.unit_id,
                unitNumber: lease.unit_number ?? lease.unit_id,
              }
            : undefined
        }
      />

      {/* Renew modal */}
      <Modal
        open={showRenew}
        onClose={() => setShowRenew(false)}
        title="Renew Lease"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Create a successor lease in DRAFT status. The current lease remains
            ACTIVE until it ends or is terminated.
          </p>
          <Input
            label="Start Date"
            type="date"
            value={renewStartDate}
            onChange={(e) => setRenewStartDate(e.target.value)}
            required
          />
          {actionError && (
            <div
              className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
              role="alert"
            >
              {actionError}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowRenew(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleRenew}
              disabled={actionLoading}
            >
              {actionLoading ? "Creating…" : "Create Renewal"}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}

/* ── Page export ── */

export default function Page() {
  const { user } = authStore();

  if (user?.persona !== "owner") {
    return (
      <div className="text-sm text-slate-400">
        Lease detail is not available for your account type.
      </div>
    );
  }

  return <LeaseDetailContent />;
}
