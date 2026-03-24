"use client";

import { useEffect, useState, useCallback } from "react";
import { FileText, Upload, Download, CheckCircle, Archive, Filter } from "lucide-react";
import {
  fetchDocuments,
  fetchDocumentDownloadUrl,
  markVerifiedExternal,
  archiveDocument,
  DOCUMENT_CATEGORIES,
  DOCUMENT_STATUSES,
  DOCUMENT_STATUS_LABELS,
  ACTIVATABLE_STATUSES,
  type DocumentRow,
  type DocumentCategory,
  type DocumentStatus,
  type PaginatedDocuments,
} from "@/services/documents/documentApiService";
import { DocumentUploadModal } from "./DocumentUploadModal";

// ── Status badge colors ──────────────────────────────────────────────────────
function statusColor(status: DocumentStatus): string {
  switch (status) {
    case "VERIFIED_EXTERNAL":
    case "FULLY_EXECUTED":
      return "bg-emerald-900/40 text-emerald-400 border-emerald-800";
    case "UPLOADED":
      return "bg-blue-900/40 text-blue-400 border-blue-800";
    case "DRAFT":
      return "bg-slate-800 text-slate-400 border-slate-700";
    case "PENDING_TENANT_SIGNATURE":
      return "bg-amber-900/40 text-amber-400 border-amber-800";
    case "ARCHIVED":
      return "bg-slate-800/50 text-slate-500 border-slate-700";
    default:
      return "bg-slate-800 text-slate-400 border-slate-700";
  }
}

function StatusBadge({ status }: { status: DocumentStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[11px] font-medium ${statusColor(status)}`}
    >
      {DOCUMENT_STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Category label helpers ───────────────────────────────────────────────────
function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

// ── OwnerDocumentsPage ───────────────────────────────────────────────────────
export function OwnerDocumentsPage() {
  const [result, setResult] = useState<PaginatedDocuments | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Filters
  const [filterCategory, setFilterCategory] = useState<DocumentCategory | "">("");
  const [filterStatus, setFilterStatus] = useState<DocumentStatus | "">("");
  const [filterRelatedType, setFilterRelatedType] = useState<string>("");
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchDocuments({
        category: filterCategory || undefined,
        status: filterStatus || undefined,
        relatedType: filterRelatedType || undefined,
        page,
        limit: 20,
      });
      setResult(data);
    } catch (e: any) {
      setError(e?.message ?? "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [filterCategory, filterStatus, filterRelatedType, page]);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(doc: DocumentRow) {
    try {
      setActionLoading(doc.id + ":download");
      const { downloadUrl } = await fetchDocumentDownloadUrl(doc.id);
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      alert(`Download failed: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleMarkVerified(doc: DocumentRow) {
    if (!confirm(`Mark "${doc.title}" as Verified External? This may activate the lease.`)) return;
    try {
      setActionLoading(doc.id + ":verify");
      await markVerifiedExternal(doc.id);
      await load();
    } catch (e: any) {
      alert(`Failed to mark verified: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleArchive(doc: DocumentRow) {
    if (!confirm(`Archive "${doc.title}"?`)) return;
    try {
      setActionLoading(doc.id + ":archive");
      await archiveDocument(doc.id);
      await load();
    } catch (e: any) {
      alert(`Failed to archive: ${e?.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  return (
    <section className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-100">Documents</h1>
          <p className="text-sm text-slate-400">
            Manage lease agreements and property documents
          </p>
        </div>
        <button
          onClick={() => setUploadOpen(true)}
          className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-500 transition-colors"
        >
          <Upload size={14} />
          Upload
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={14} className="text-slate-500" />

        <select
          value={filterCategory}
          onChange={(e) => { setFilterCategory(e.target.value as DocumentCategory | ""); setPage(1); }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All categories</option>
          {DOCUMENT_CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{categoryLabel(cat)}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value as DocumentStatus | ""); setPage(1); }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All statuses</option>
          {DOCUMENT_STATUSES.map((s) => (
            <option key={s} value={s}>{DOCUMENT_STATUS_LABELS[s]}</option>
          ))}
        </select>

        <select
          value={filterRelatedType}
          onChange={(e) => { setFilterRelatedType(e.target.value); setPage(1); }}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="">All types</option>
          <option value="LEASE">Lease</option>
          <option value="MAINTENANCE">Maintenance</option>
          <option value="PAYMENT">Payment</option>
        </select>

        {(filterCategory || filterStatus || filterRelatedType) && (
          <button
            onClick={() => { setFilterCategory(""); setFilterStatus(""); setFilterRelatedType(""); setPage(1); }}
            className="text-xs text-slate-400 underline hover:text-slate-200"
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="py-12 text-center text-sm text-slate-500">Loading documents…</div>
      )}

      {error && !loading && (
        <div className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-400">
          {error}
          <button onClick={load} className="ml-2 underline">Retry</button>
        </div>
      )}

      {!loading && !error && result && (
        <>
          {result.data.length === 0 ? (
            <div className="rounded-lg border border-slate-800 bg-slate-950/70 py-12 text-center">
              <FileText size={24} className="mx-auto mb-2 text-slate-600" />
              <p className="text-sm text-slate-400">No documents found.</p>
              <button
                onClick={() => setUploadOpen(true)}
                className="mt-3 text-xs text-indigo-400 underline hover:text-indigo-300"
              >
                Upload your first document
              </button>
            </div>
          ) : (
            <div className="rounded-lg border border-slate-800 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="border-b border-slate-800 bg-slate-950">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-400">Title</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-400">Category</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-400">Status</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-400">Linked to</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-400">Uploaded</th>
                    <th className="px-3 py-2 text-right font-medium text-slate-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {result.data.map((doc) => {
                    const busy = actionLoading?.startsWith(doc.id);
                    const canVerify =
                      doc.category === "LEASE_AGREEMENT" &&
                      !ACTIVATABLE_STATUSES.includes(doc.status) &&
                      doc.status !== "ARCHIVED";

                    return (
                      <tr
                        key={doc.id}
                        className="bg-slate-950/50 hover:bg-slate-900/50 transition-colors"
                      >
                        <td className="px-3 py-2 text-slate-200 font-medium max-w-[200px] truncate">
                          <div className="flex items-center gap-1.5">
                            <FileText size={13} className="shrink-0 text-slate-500" />
                            <span className="truncate">{doc.title}</span>
                          </div>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{categoryLabel(doc.category)}</td>
                        <td className="px-3 py-2">
                          <StatusBadge status={doc.status} />
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {doc.related_type === "LEASE" ? (
                            <span className="font-mono">{doc.related_id.slice(0, 8)}…</span>
                          ) : (
                            <span>{doc.related_type}</span>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-500">
                          {new Date(doc.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center justify-end gap-2">
                            {/* Download */}
                            <button
                              onClick={() => handleDownload(doc)}
                              disabled={busy}
                              className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
                              title="Download"
                            >
                              <Download size={13} />
                            </button>

                            {/* Mark verified external (lease agreements only) */}
                            {canVerify && (
                              <button
                                onClick={() => handleMarkVerified(doc)}
                                disabled={busy}
                                className="text-slate-400 hover:text-emerald-400 disabled:opacity-40"
                                title="Mark Verified External"
                              >
                                <CheckCircle size={13} />
                              </button>
                            )}

                            {/* Archive */}
                            {doc.status !== "ARCHIVED" && (
                              <button
                                onClick={() => handleArchive(doc)}
                                disabled={busy}
                                className="text-slate-400 hover:text-rose-400 disabled:opacity-40"
                                title="Archive"
                              >
                                <Archive size={13} />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Pagination */}
              {result.meta.totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-800 px-3 py-2 text-xs text-slate-400">
                  <span>
                    {result.meta.total} total — page {result.meta.page} of {result.meta.totalPages}
                  </span>
                  <div className="flex gap-2">
                    <button
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800 disabled:opacity-40"
                    >
                      Prev
                    </button>
                    <button
                      disabled={page >= result.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="rounded border border-slate-700 px-2 py-0.5 hover:bg-slate-800 disabled:opacity-40"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Upload modal */}
      {uploadOpen && (
        <DocumentUploadModal
          onClose={() => setUploadOpen(false)}
          onSuccess={() => { setUploadOpen(false); load(); }}
        />
      )}
    </section>
  );
}
