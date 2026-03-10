"use client";

import { useEffect, useState, useMemo } from "react";
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
} from "@/services/leases/leaseService";
import type { LeaseRow, CreateLeaseDTO, RenewLeaseDTO } from "@/services/leases/types";
import { LeaseForm } from "@/components/leases/LeaseForm";
import { LeaseDetailSkeleton } from "@/components/leases/LeaseDetailSkeleton";

/* ── Helpers ── */

function statusVariant(status: string): BadgeVariant {
  switch (status) {
    case "ACTIVE": return "success";
    case "PENDING": return "warning";
    case "TERMINATED": return "danger";
    default: return "neutral";
  }
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
}: {
  lease: LeaseRow;
  onTerminate: () => void;
  onRenew: () => void;
  onActivate: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Rent</h3>
          <p className="text-2xl font-semibold text-slate-900">
            {formatCurrency(lease.monthly_rent)}
            <span className="text-sm font-normal text-slate-400">/mo</span>
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
          {lease.signed_at && (
            <p className="text-xs text-slate-500">Signed: {formatDate(lease.signed_at)}</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</h3>
          <Badge variant={statusVariant(lease.status)}>{lease.status}</Badge>
          <p className="text-xs text-slate-500 mt-1">
            Type: {lease.lease_type.replace(/_/g, " ")}
          </p>
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
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tenant</h3>
          <p className="text-sm text-slate-700">
            {lease.tenant_id || "Not assigned"}
          </p>
        </div>
      </div>

      {/* Status-dependent actions */}
      <div className="flex items-center gap-3 pt-2">
        {lease.status === "ACTIVE" && (
          <>
            <Button variant="danger" size="sm" onClick={onTerminate}>
              Terminate
            </Button>
            <Button variant="secondary" size="sm" onClick={onRenew}>
              Renew
            </Button>
          </>
        )}
        {(lease.status === "DRAFT" || lease.status === "PENDING") && (
          <Button variant="primary" size="sm" onClick={onActivate}>
            Activate
          </Button>
        )}
      </div>
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
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Renew form state
  const [renewStartDate, setRenewStartDate] = useState("");
  const [renewEndDate, setRenewEndDate] = useState("");
  const [renewRent, setRenewRent] = useState("");

  useEffect(() => {
    let cancelled = false;
    fetchLease(id)
      .then((res) => {
        if (!cancelled) setLease(res.data);
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
  }, [id]);

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
        startDate: renewStartDate,
        endDate: renewEndDate,
        monthlyRent: Math.round(parseFloat(renewRent) * 100),
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
    try {
      const result = await updateLease(id, { status: "ACTIVE" });
      setLease(result.data);
    } catch (e: any) {
      setError(e.message || "Failed to activate lease");
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
            onRenew={() => {
              setRenewRent(String(lease.monthly_rent / 100));
              setShowRenew(true);
            }}
            onActivate={handleActivate}
          />
        ),
      },
      {
        id: "edit",
        label: "Edit",
        content: <EditPanel lease={lease} onSaved={handleSaved} />,
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lease]);

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
          <Input
            label="End Date"
            type="date"
            value={renewEndDate}
            onChange={(e) => setRenewEndDate(e.target.value)}
            required
          />
          <Input
            label="Monthly Rent ($)"
            type="number"
            value={renewRent}
            onChange={(e) => setRenewRent(e.target.value)}
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

  if (user?.persona !== "owner" && user?.persona !== "propertyManager") {
    return (
      <div className="text-sm text-slate-400">
        Lease detail is not available for your account type.
      </div>
    );
  }

  return <LeaseDetailContent />;
}
