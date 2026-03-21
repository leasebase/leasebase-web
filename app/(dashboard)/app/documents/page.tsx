"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FolderOpen, FileText, Plus, Download, Archive, MoreVertical } from "lucide-react";
import { DropdownMenu, type DropdownMenuItem } from "@/components/ui/DropdownMenu";
import { authStore } from "@/lib/auth/store";
import {
  fetchDocuments,
  fetchDocumentDownloadUrl,
  archiveDocument,
  DOCUMENT_STATUS_LABELS,
  type DocumentRow,
  type DocumentStatus,
} from "@/services/documents/documentApiService";
import { fetchTenantDocuments } from "@/services/tenant/adapters/documentAdapter";
import { fetchTenantDocumentDownload } from "@/services/tenant/adapters/documentAdapter";
import type { DocumentRow as TenantDocumentRow } from "@/services/tenant/types";
import { UploadDocumentModal } from "@/components/documents/UploadDocumentModal";

// ── Helpers ──────────────────────────────────────────────────────────────────

const CATEGORY_LABELS: Record<string, string> = {
  LEASE_AGREEMENT: "Lease Agreement",
  LEASE_ADDENDUM: "Addendum",
  NOTICE: "Notice",
  PAYMENT_RECEIPT: "Receipt",
  MOVE_IN_CHECKLIST: "Move-in",
  MOVE_OUT_CHECKLIST: "Move-out",
  MAINTENANCE_ATTACHMENT: "Maintenance",
  OWNER_UPLOAD: "Upload",
};

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  UPLOADED: "info",
  DRAFT: "neutral",
  PENDING_TENANT_SIGNATURE: "warning",
  FULLY_EXECUTED: "success",
  VERIFIED_EXTERNAL: "success",
  ARCHIVED: "neutral",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

// ══════════════════════════════════════════════════════════════════════════════
// OWNER DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════

function OwnerDocuments() {
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadDocs = useCallback(async () => {
    try {
      const result = await fetchDocuments({ page: 1, limit: 50 });
      setDocs(result.data);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleDownload = useCallback(async (id: string) => {
    try {
      const result = await fetchDocumentDownloadUrl(id);
      window.open(result.downloadUrl, "_blank");
    } catch {
      alert("Could not generate download link. The file may not be uploaded yet.");
    }
  }, []);

  const handleArchive = useCallback(async (id: string) => {
    if (!confirm("Archive this document? It will no longer appear in the active list.")) return;
    try {
      await archiveDocument(id);
      setDocs((prev) => prev.filter((d) => d.id !== id));
    } catch {
      alert("Failed to archive document.");
    }
  }, []);

  const handleUploadSuccess = useCallback((doc: DocumentRow) => {
    setUploadOpen(false);
    setSuccessMsg(`"${doc.title}" uploaded successfully.`);
    loadDocs();
    setTimeout(() => setSuccessMsg(null), 4000);
  }, [loadDocs]);

  if (loading) {
    return (
      <div className="mt-6 space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} variant="text" className="h-16 w-full rounded-md" />)}
      </div>
    );
  }

  if (error) {
    return <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  if (docs.length === 0) {
    return (
      <>
        <EmptyState
          icon={<FolderOpen size={48} strokeWidth={1.5} />}
          title="No documents yet"
          description="Upload leases, notices, and receipts to keep everything organized."
          action={<Button variant="primary" icon={<Plus size={16} />} onClick={() => setUploadOpen(true)}>Upload Document</Button>}
          className="mt-8"
        />
        <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
      </>
    );
  }

  return (
    <>
      {/* Header with upload button */}
      <div className="mt-4 flex justify-end">
        <Button variant="primary" icon={<Plus size={16} />} onClick={() => setUploadOpen(true)}>Upload Document</Button>
      </div>

      {successMsg && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{successMsg}</div>
      )}

      <div className="mt-4 space-y-2">
        {docs.map((doc) => {
          const menuItems: DropdownMenuItem[] = [
            { id: "download", label: "Download", icon: <Download size={14} />, onClick: () => handleDownload(doc.id) },
            { id: "archive", label: "Archive", icon: <Archive size={14} />, danger: true, onClick: () => handleArchive(doc.id) },
          ];

          return (
            <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors">
              <FileText size={20} className="shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-900 truncate">{doc.title}</p>
                <p className="text-xs text-slate-400">
                  {CATEGORY_LABELS[doc.category] || doc.category}
                  {doc.related_type !== "GENERAL" && <> · {doc.related_type}</>}
                  {" · "}{formatDate(doc.created_at)}
                </p>
              </div>
              <Badge variant={STATUS_VARIANTS[doc.status] || "neutral"}>
                {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus] || doc.status}
              </Badge>
              <DropdownMenu
                trigger={
                  <button type="button" className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Document actions">
                    <MoreVertical size={16} />
                  </button>
                }
                items={menuItems}
                align="right"
              />
            </div>
          );
        })}
      </div>
      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TENANT DOCUMENTS
// ══════════════════════════════════════════════════════════════════════════════

function TenantDocuments() {
  const [docs, setDocs] = useState<TenantDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const result = await fetchTenantDocuments();
      if (!cancelled) {
        setDocs(result.data);
        if (result.source === "unavailable") setError(result.error);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const handleDownload = useCallback(async (id: string) => {
    try {
      const result = await fetchTenantDocumentDownload(id);
      if (result.data?.downloadUrl) {
        window.open(result.data.downloadUrl, "_blank");
      } else {
        alert("Download not available for this document.");
      }
    } catch {
      alert("Could not generate download link.");
    }
  }, []);

  if (loading) {
    return (
      <div className="mt-6 space-y-2">
        {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} variant="text" className="h-14 w-full rounded-md" />)}
      </div>
    );
  }

  if (error) {
    return <div className="mt-6 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>;
  }

  if (docs.length === 0) {
    return (
      <EmptyState
        icon={<FolderOpen size={48} strokeWidth={1.5} />}
        title="No documents available"
        description="Your lease documents will appear here once your property manager uploads them."
        className="mt-8"
      />
    );
  }

  return (
    <div className="mt-6 space-y-2">
      {docs.map((doc) => (
        <div key={doc.id} className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4">
          <FileText size={20} className="shrink-0 text-slate-400" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
            <p className="text-xs text-slate-400">
              {doc.related_type} · {formatDate(doc.created_at)}
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={<Download size={14} />} onClick={() => handleDownload(doc.id)}>
            Download
          </Button>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DocumentsPage() {
  const { user } = authStore();
  const isOwner = user?.persona === "owner";

  return (
    <>
      <PageHeader
        title="Documents"
        description={isOwner
          ? "Upload, manage, and organize documents — leases, notices, and receipts."
          : "View lease documents, notices, and receipts."}
      />

      {isOwner ? <OwnerDocuments /> : <TenantDocuments />}
    </>
  );
}
