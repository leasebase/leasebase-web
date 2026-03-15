"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { Mail, ArrowLeft, RefreshCw, XCircle } from "lucide-react";
import {
  fetchInvitations,
  resendInvitation,
  revokeInvitation,
  type TenantInvitation,
} from "@/services/invitations/invitationApiService";

const STATUS_VARIANTS: Record<string, "success" | "danger" | "warning" | "neutral"> = {
  PENDING: "warning",
  ACCEPTED: "success",
  REVOKED: "danger",
  EXPIRED: "neutral",
};

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return iso;
  }
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchInvitations(1, 100);
      setInvitations(res.data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleResend(id: string) {
    setActionLoading(id);
    try {
      await resendInvitation(id);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleRevoke(id: string) {
    setActionLoading(id);
    try {
      await revokeInvitation(id);
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <>
      <PageHeader title="Tenant Invitations" description="Track and manage pending tenant invitations." />

      <div className="mt-4 flex items-center gap-2">
        <Link href="/app/tenants">
          <Button variant="ghost" size="sm" icon={<ArrowLeft size={14} />}>Back to Tenants</Button>
        </Link>
        <Link href="/app/leases/new">
          <Button variant="primary" size="sm" icon={<Mail size={14} />}>Invite via New Lease</Button>
        </Link>
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</div>
      )}

      <div className="mt-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />
            ))}
          </div>
        ) : invitations.length === 0 ? (
          <EmptyState
            icon={<Mail size={48} strokeWidth={1.5} />}
            title="No invitations"
            description="Create a new lease to invite your first tenant."
          />
        ) : (
          <div className="space-y-2">
            {invitations.map((inv) => (
              <div
                key={inv.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4"
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium text-slate-900">
                    {inv.invited_first_name} {inv.invited_last_name}
                  </p>
                  <p className="text-xs text-slate-400">
                    {inv.invited_email}
                    {inv.property_name && ` · ${inv.property_name}`}
                    {inv.unit_number && ` — Unit ${inv.unit_number}`}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant={STATUS_VARIANTS[inv.status] ?? "neutral"}>{inv.status}</Badge>
                    <span className="text-xs text-slate-400">
                      Invited {formatDate(inv.created_at)}
                      {inv.status === "PENDING" && ` · Expires ${formatDate(inv.expires_at)}`}
                    </span>
                  </div>
                </div>

                {inv.status === "PENDING" && (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<RefreshCw size={14} />}
                      loading={actionLoading === inv.id}
                      onClick={() => handleResend(inv.id)}
                    >
                      Resend
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      icon={<XCircle size={14} />}
                      loading={actionLoading === inv.id}
                      onClick={() => handleRevoke(inv.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      Revoke
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

    </>
  );
}
