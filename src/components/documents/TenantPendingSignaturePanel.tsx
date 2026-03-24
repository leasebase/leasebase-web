"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { PenLine, CheckCircle, Clock, ExternalLink, AlertCircle } from "lucide-react";
import {
  fetchSignatureRequestsForDocument,
  fetchSigningUrl,
  SIGNATURE_REQUEST_STATUS_LABELS,
  SIGNER_STATUS_LABELS,
  type SignatureRequestRow,
  type SignerStatus,
} from "@/services/documents/signatureApiService";

interface Props {
  /** The document_id to check for signature requests */
  documentId: string;
  /** The current user's ID (to find their signer slot) */
  userId: string;
  /** Called when signature state changes (e.g. to refresh parent) */
  onStatusChange?: () => void;
}

const POLL_INTERVAL_MS = 6000;

export function TenantPendingSignaturePanel({ documentId, userId, onStatusChange }: Props) {
  const [request, setRequest] = useState<SignatureRequestRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [signUrl, setSignUrl] = useState<string | null>(null);
  const [signingLoading, setSigningLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Find the relevant pending request for this tenant
  const loadRequest = useCallback(async () => {
    try {
      const { data: requests } = await fetchSignatureRequestsForDocument(documentId);
      // Find active request (REQUESTED or PARTIALLY_SIGNED) with this tenant as a signer
      const active = requests.find(
        (r) =>
          ["REQUESTED", "PARTIALLY_SIGNED"].includes(r.status) &&
          r.signers?.some((s) => s.user_id === userId && s.status !== "SIGNED"),
      );
      const previous = request;
      setRequest(active ?? null);

      // Notify parent if completion state changed
      if (previous?.status !== active?.status && onStatusChange) {
        onStatusChange();
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load signature request");
    } finally {
      setLoading(false);
    }
  }, [documentId, userId, request, onStatusChange]);

  useEffect(() => {
    loadRequest();
  }, [documentId]);

  // Poll while request is active
  useEffect(() => {
    if (request && ["REQUESTED", "PARTIALLY_SIGNED"].includes(request.status)) {
      pollTimerRef.current = setInterval(loadRequest, POLL_INTERVAL_MS);
    }
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [request?.status]);

  const mySigner = request?.signers?.find(
    (s) => s.user_id === userId && s.status !== "SIGNED",
  );

  async function handleSignNow() {
    if (!request) return;
    setSigningLoading(true);
    setError(null);
    try {
      const { data } = await fetchSigningUrl(request.id);
      if (data.alreadySigned) {
        // Already signed — reload to show updated state
        await loadRequest();
        return;
      }
      if (data.signUrl) {
        setSignUrl(data.signUrl);
        // Open in new tab
        window.open(data.signUrl, "_blank", "noopener,noreferrer");
      } else {
        setError("Signing URL is not available yet. Please try again in a moment.");
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to get signing URL");
    } finally {
      setSigningLoading(false);
    }
  }

  if (loading) return null;
  if (!request || !mySigner) return null;

  const myStatus = mySigner.status as SignerStatus;
  const isCompleted = request.status === "COMPLETED";
  const isSigned = myStatus === "SIGNED";
  const isProvider = request.provider !== "MANUAL";

  return (
    <div className="rounded-lg border border-indigo-700/50 bg-indigo-950/30 px-4 py-3">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0">
          {isCompleted || isSigned ? (
            <CheckCircle size={16} className="text-emerald-400" />
          ) : (
            <PenLine size={16} className="text-indigo-400 animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0 space-y-1">
          <p className="text-sm font-medium text-indigo-200">
            {isCompleted || isSigned
              ? "Document signed"
              : "Your signature is required"}
          </p>

          <p className="text-xs text-indigo-400">
            {isCompleted || isSigned
              ? "All parties have signed this document."
              : `Status: ${SIGNATURE_REQUEST_STATUS_LABELS[request.status]}`}
          </p>

          {myStatus !== "SIGNED" && !isCompleted && (
            <p className="text-xs text-slate-400">
              Your status:{" "}
              <span className={myStatus === "VIEWED" ? "text-yellow-400" : "text-slate-300"}>
                {SIGNER_STATUS_LABELS[myStatus] ?? myStatus}
              </span>
            </p>
          )}

          {error && (
            <div className="flex items-center gap-1 text-xs text-rose-400 mt-1">
              <AlertCircle size={11} />
              {error}
            </div>
          )}
        </div>

        {!isCompleted && !isSigned && (
          <div className="flex-shrink-0">
            {isProvider ? (
              <button
                onClick={handleSignNow}
                disabled={signingLoading}
                className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
              >
                {signingLoading ? (
                  <Clock size={12} className="animate-spin" />
                ) : (
                  <ExternalLink size={12} />
                )}
                {signingLoading ? "Loading…" : "Sign Now"}
              </button>
            ) : (
              <span className="rounded border border-slate-600 px-2.5 py-1 text-xs text-slate-400">
                External
              </span>
            )}
          </div>
        )}

        {(isCompleted || isSigned) && (
          <CheckCircle size={16} className="flex-shrink-0 mt-0.5 text-emerald-400" />
        )}
      </div>

      {signUrl && !isCompleted && !isSigned && (
        <div className="mt-2 pt-2 border-t border-indigo-800/40">
          <p className="text-xs text-indigo-400">
            Signing page opened in a new tab.{" "}
            <button
              onClick={() => window.open(signUrl, "_blank", "noopener,noreferrer")}
              className="underline hover:text-indigo-300"
            >
              Click here
            </button>{" "}
            if it didn&apos;t open.
          </p>
        </div>
      )}
    </div>
  );
}
