"use client";

import { useEffect, useState, useCallback } from "react";
import { PenLine, X, CheckCircle, Clock, XCircle } from "lucide-react";
import {
  fetchSignatureRequestsForDocument,
  cancelSignatureRequest,
  createSignatureRequest,
  SIGNATURE_REQUEST_STATUS_LABELS,
  SIGNER_STATUS_LABELS,
  type SignatureRequestRow,
  type SignerStatus,
} from "@/services/documents/signatureApiService";

interface Props {
  documentId: string;
  isOwner?: boolean;
  onRequestCreated?: () => void;
}

// ── Signer status icon ────────────────────────────────────────────────────────
function SignerStatusIcon({ status }: { status: SignerStatus }) {
  if (status === "SIGNED")   return <CheckCircle size={12} className="text-emerald-400" />;
  if (status === "DECLINED" || status === "FAILED") return <XCircle size={12} className="text-rose-400" />;
  return <Clock size={12} className="text-slate-400" />;
}

// ── SignatureRequestPanel ─────────────────────────────────────────────────────
export function SignatureRequestPanel({ documentId, isOwner = false, onRequestCreated }: Props) {
  const [requests, setRequests] = useState<SignatureRequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchSignatureRequestsForDocument(documentId);
      setRequests(result.data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load signature requests");
    } finally {
      setLoading(false);
    }
  }, [documentId]);

  useEffect(() => { load(); }, [load]);

  async function handleCancel(requestId: string) {
    if (!confirm("Cancel this signature request?")) return;
    setActionLoading(requestId);
    try {
      await cancelSignatureRequest(requestId);
      await load();
    } catch (e: any) {
      alert(`Cancel failed: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  const activeRequests = requests.filter(
    (r) => !["CANCELLED", "COMPLETED"].includes(r.status)
  );
  const hasActive = activeRequests.length > 0;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/50">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <PenLine size={13} className="text-slate-400" />
          <h4 className="text-xs font-semibold text-slate-200">Signature Requests</h4>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {loading && <p className="text-xs text-slate-500">Loading…</p>}

        {error && !loading && (
          <p className="text-xs text-rose-400">{error}</p>
        )}

        {!loading && !error && requests.length === 0 && (
          <p className="text-xs text-slate-500">No signature requests yet.</p>
        )}

        {!loading && requests.map((req) => {
          const statusLabel = SIGNATURE_REQUEST_STATUS_LABELS[req.status] ?? req.status;
          const isTerminal = ["CANCELLED", "COMPLETED"].includes(req.status);
          const canCancel = isOwner && !isTerminal && actionLoading !== req.id;

          return (
            <div
              key={req.id}
              className="rounded border border-slate-800/60 bg-slate-900/40 p-3 space-y-2"
            >
              {/* Request header */}
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-200">{statusLabel}</span>
                {canCancel && (
                  <button
                    onClick={() => handleCancel(req.id)}
                    className="text-slate-500 hover:text-rose-400"
                    title="Cancel signature request"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Signers */}
              {req.signers && req.signers.length > 0 && (
                <div className="space-y-1">
                  {req.signers.map((signer) => (
                    <div key={signer.id} className="flex items-center gap-2">
                      <SignerStatusIcon status={signer.status} />
                      <span className="text-xs text-slate-400">
                        {signer.display_name || signer.email || signer.user_id}
                      </span>
                      <span className="ml-auto text-xs text-slate-500">
                        {SIGNER_STATUS_LABELS[signer.status]}
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
