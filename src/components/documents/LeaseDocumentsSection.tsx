"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, CheckCircle, Download, AlertCircle } from "lucide-react";
import {
  fetchLeaseDocuments,
  fetchLeaseExecutionStatus,
  fetchDocumentDownloadUrl,
  markVerifiedExternal,
  ACTIVATABLE_STATUSES,
  DOCUMENT_STATUS_LABELS,
  type DocumentRow,
  type LeaseExecutionStatus,
} from "@/services/documents/documentApiService";
import { DocumentUploadModal } from "./DocumentUploadModal";

interface LeaseDocumentsSectionProps {
  leaseId: string;
  isOwner?: boolean;
}

// ── Execution status badge ────────────────────────────────────────────────────
function ExecutionStatusBadge({ status }: { status: LeaseExecutionStatus["executionStatus"] }) {
  const config = {
    NONE: { label: "No lease agreement", color: "text-slate-500" },
    UPLOADED: { label: "Document uploaded", color: "text-blue-400" },
    VERIFIED_EXTERNAL: { label: "Verified External ✓", color: "text-emerald-400" },
    FULLY_EXECUTED: { label: "Fully Executed ✓", color: "text-emerald-400" },
  }[status] ?? { label: status, color: "text-slate-400" };

  return (
    <span className={`text-xs font-medium ${config.color}`}>{config.label}</span>
  );
}

// ── LeaseDocumentsSection ─────────────────────────────────────────────────────
export function LeaseDocumentsSection({
  leaseId,
  isOwner = false,
}: LeaseDocumentsSectionProps) {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [executionStatus, setExecutionStatus] = useState<LeaseExecutionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [docsResult, statusResult] = await Promise.allSettled([
        fetchLeaseDocuments(leaseId),
        fetchLeaseExecutionStatus(leaseId),
      ]);

      if (docsResult.status === "fulfilled") {
        setDocs(docsResult.value.data);
      }
      if (statusResult.status === "fulfilled") {
        setExecutionStatus(statusResult.value.data);
      }
    } catch (e: any) {
      setError(e?.message ?? "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [leaseId]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(doc: DocumentRow) {
    try {
      setActionLoading(doc.id);
      const { downloadUrl } = await fetchDocumentDownloadUrl(doc.id);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(`Download failed: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkVerified(doc: DocumentRow) {
    if (!confirm(`Mark "${doc.title}" as Verified External? This will activate the lease.`)) return;
    try {
      setActionLoading(doc.id);
      await markVerifiedExternal(doc.id);
      await load();
    } catch (e: any) {
      alert(`Verification failed: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      {/* Section header */}
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-100">Documents</h3>
          {executionStatus && (
            <ExecutionStatusBadge status={executionStatus.executionStatus} />
          )}
        </div>
        {isOwner && (
          <button
            onClick={() => setUploadOpen(true)}
            className="inline-flex items-center gap-1.5 rounded border border-slate-700 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-800 transition-colors"
          >
            <Upload size={12} />
            Upload
          </button>
        )}
      </div>

      {/* Body */}
      <div className="px-4 py-3">
        {loading && (
          <p className="text-xs text-slate-500 py-3 text-center">Loading…</p>
        )}

        {error && !loading && (
          <div className="flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle size={12} />
            {error}
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className="text-center py-4">
            <p className="text-xs text-slate-500">No documents yet.</p>
            {isOwner && (
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-1 text-xs text-indigo-400 underline hover:text-indigo-300"
              >
                Upload lease agreement
              </button>
            )}
          </div>
        )}

        {!loading && !error && docs.length > 0 && (
          <div className="space-y-1.5">
            {docs.map((doc) => {
              const busy = actionLoading === doc.id;
              const isActivatable = ACTIVATABLE_STATUSES.includes(doc.status);
              const canVerify =
                isOwner &&
                doc.category === "LEASE_AGREEMENT" &&
                !isActivatable &&
                doc.status !== "ARCHIVED";

              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-2 rounded border border-slate-800/60 bg-slate-900/50 px-3 py-2 text-xs"
                >
                  <FileText size={12} className="shrink-0 text-slate-500" />

                  <span className="flex-1 truncate text-slate-200 font-medium">
                    {doc.title}
                  </span>

                  <span className="shrink-0 text-slate-500">
                    {DOCUMENT_STATUS_LABELS[doc.status] ?? doc.status}
                  </span>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={busy}
                    className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
                    title="Download"
                  >
                    <Download size={12} />
                  </button>

                  {/* Mark verified external */}
                  {canVerify && (
                    <button
                      onClick={() => handleMarkVerified(doc)}
                      disabled={busy}
                      className="text-slate-400 hover:text-emerald-400 disabled:opacity-40"
                      title="Mark Verified External — activates lease"
                    >
                      <CheckCircle size={12} />
                    </button>
                  )}

                  {/* Verified indicator */}
                  {isActivatable && (
                    <CheckCircle size={12} className="shrink-0 text-emerald-400" />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Upload modal */}
      {uploadOpen && (
        <DocumentUploadModal
          relatedType="LEASE"
          relatedId={leaseId}
          onClose={() => setUploadOpen(false)}
          onSuccess={() => { setUploadOpen(false); load(); }}
        />
      )}
    </div>
  );
}
