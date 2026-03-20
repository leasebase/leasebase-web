"use client";

import { useEffect, useState, useCallback } from "react";
import { PenLine, CheckCircle, Clock, XCircle, RefreshCw, X } from "lucide-react";
import {
  fetchSignatureRequestsForDocument,
  cancelSignatureRequest,
  SIGNATURE_REQUEST_STATUS_LABELS,
  SIGNER_STATUS_LABELS,
  type SignatureRequestRow,
  type SignerStatus,
  type SignatureRequestStatus,
} from "@/services/documents/signatureApiService";

interface Props {
  documentId: string;
  onComplete?: () => void;
}

function SignerStatusIcon({ status }: { status: SignerStatus }) {
  switch (status) {
    case "SIGNED":   return <CheckCircle size={13} className="text-emerald-400" />;
    case "VIEWED":   return <Clock size={13} className="text-yellow-400" />;
    case "DECLINED": return <XCircle size={13} className="text-rose-400" />;
    case "FAILED":   return <XCircle size={13} className="text-rose-400" />;
    default:         return <Clock size={13} className="text-slate-500" />;
  }
}

function RequestStatusBadge({ status }: { status: SignatureRequestStatus }) {
  const colors: Record<SignatureRequestStatus, string> = {
    DRAFT:             "text-slate-400 bg-slate-800",
    REQUESTED:         "text-blue-300 bg-blue-900/40",
    PARTIALLY_SIGNED:  "text-yellow-300 bg-yellow-900/30",
    COMPLETED:         "text-emerald-300 bg-emerald-900/30",
    CANCELLED:         "text-slate-400 bg-slate-800",
    FAILED:            "text-rose-300 bg-rose-900/30",
  };
  return (
    <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${colors[status] ?? ""}`}>
      {SIGNATURE_REQUEST_STATUS_LABELS[status]}
    </span>
  );
}

export function OwnerSignatureProgressPanel({ documentId, onComplete }: Props) {
  const [requests, setRequests] = useState<SignatureRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await fetchSignatureRequestsForDocument(documentId);
      setRequests(data);
      // Notify parent if any request just completed
      if (data.some((r) => r.status === "COMPLETED") && onComplete) {
        onComplete();
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load signature requests");
    } finally {
      setLoading(false);
    }
  }, [documentId, onComplete]);

  useEffect(() => { load(); }, [documentId]);

  async function handleCancel(requestId: string) {
    if (!confirm("Cancel this signature request?")) return;
    setCancelling(requestId);
    try {
      await cancelSignatureRequest(requestId);
      await load();
    } catch (e: any) {
      setError(e?.message ?? "Failed to cancel");
    } finally {
      setCancelling(null);
    }
  }

  if (loading) return null;
  if (requests.length === 0) return null;

  const activeRequest = requests.find((r) =>
    ["REQUESTED", "PARTIALLY_SIGNED"].includes(r.status),
  );
  const completedRequest = requests.find((r) => r.status === "COMPLETED");
  const displayRequest = activeRequest ?? completedRequest ?? requests[0];

  if (!displayRequest) return null;

  const isProviderBacked = displayRequest.provider !== "MANUAL";
  const isCancellable = ["REQUESTED", "PARTIALLY_SIGNED"].includes(displayRequest.status);
  const signers = displayRequest.signers ?? [];
  const signedCount = signers.filter((s) => s.status === "SIGNED").length;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <PenLine size={13} className="text-slate-400" />
          <h4 className="text-xs font-semibold text-slate-200">Signature Progress</h4>
          <RequestStatusBadge status={displayRequest.status} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="text-slate-500 hover:text-slate-300"
            title="Refresh"
          >
            <RefreshCw size={12} />
          </button>
          {isCancellable && (
            <button
              onClick={() => handleCancel(displayRequest.id)}
              disabled={cancelling === displayRequest.id}
              className="text-slate-500 hover:text-rose-400 disabled:opacity-40"
              title="Cancel signature request"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {error && <p className="text-xs text-rose-400">{error}</p>}

        {/* Provider badge */}
        {isProviderBacked && (
          <p className="text-xs text-slate-500">
            Via: <span className="text-slate-400">{displayRequest.provider}</span>
          </p>
        )}

        {/* Progress summary */}
        {signers.length > 0 && (
          <p className="text-xs text-slate-400">
            {signedCount} / {signers.length} signed
          </p>
        )}

        {/* Signer list */}
        {signers.length > 0 && (
          <div className="space-y-1">
            {signers.map((signer) => (
              <div key={signer.id} className="flex items-center gap-2">
                <SignerStatusIcon status={signer.status} />
                <span className="flex-1 text-xs text-slate-300 truncate">
                  {signer.display_name || signer.email || signer.user_id}
                </span>
                <span className={`text-xs ${signer.status === "SIGNED" ? "text-emerald-400" : "text-slate-500"}`}>
                  {SIGNER_STATUS_LABELS[signer.status] ?? signer.status}
                </span>
                {signer.signed_at && (
                  <span className="text-xs text-slate-600">
                    {new Date(signer.signed_at).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Completion message */}
        {displayRequest.status === "COMPLETED" && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
            <CheckCircle size={12} />
            All signatures complete — document fully executed
          </div>
        )}
      </div>
    </div>
  );
}
