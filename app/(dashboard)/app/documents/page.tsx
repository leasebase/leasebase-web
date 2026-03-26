"use client";

import { useEffect, useState, useCallback } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FolderOpen, FileText, Plus, Download, Archive, MoreVertical, Upload, Search } from "lucide-react";
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

  // Category counts
  const categoryCounts = docs.reduce<Record<string, number>>((acc, d) => {
    const cat = d.category || "OTHER";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryCards = [
    { key: "LEASE_AGREEMENT", label: "Leases", color: "bg-blue-100 text-blue-600" },
    { key: "MAINTENANCE_ATTACHMENT", label: "Maintenance", color: "bg-yellow-100 text-yellow-600" },
    { key: "NOTICE", label: "Notices", color: "bg-green-100 text-green-600" },
    { key: "PAYMENT_RECEIPT", label: "Receipts", color: "bg-purple-100 text-purple-600" },
  ];

  if (docs.length === 0) {
    return (
      <>
        <div className="mt-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-semibold text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-4 max-w-md mx-auto">
            Upload your first document to get started. You can organize leases, notices, and other property documents here.
          </p>
          <Button variant="primary" icon={<Upload size={16} />} onClick={() => setUploadOpen(true)}>Upload First Document</Button>
        </div>
        <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
      </>
    );
  }

  return (
    <>
      {successMsg && (
        <div className="mt-3 rounded-md border border-green-200 bg-green-50 px-4 py-2.5 text-sm text-green-700">{successMsg}</div>
      )}

      {/* Category Cards */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {categoryCards.map((cat) => (
          <div key={cat.key} className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{cat.label}</h3>
                <p className="text-sm text-gray-600">{categoryCounts[cat.key] || 0} files</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="mt-6 flex items-center gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search documents…"
            className="w-full h-9 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 placeholder:text-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all" />
        </div>
        <select className="h-9 px-3 bg-white border border-slate-200 rounded-lg text-[12px] text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-300 transition-all">
          <option value="">All Categories</option>
          <option value="LEASE_AGREEMENT">Leases</option>
          <option value="NOTICE">Notices</option>
          <option value="PAYMENT_RECEIPT">Receipts</option>
          <option value="MAINTENANCE_ATTACHMENT">Maintenance</option>
        </select>
        <Button variant="primary" size="sm" icon={<Upload size={14} />} onClick={() => setUploadOpen(true)}>Upload</Button>
      </div>

      {/* Documents Table */}
      <div className="mt-4 bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200/80">
                <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Document</th>
                <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Category</th>
                <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Status</th>
                <th className="text-left py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Date Added</th>
                <th className="text-right py-3.5 px-6 text-[12px] font-semibold text-slate-700 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {docs.map((doc) => {
                const isDownloadable = doc.status !== "DRAFT";
                return (
                  <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className="text-[13px] font-medium text-gray-900 truncate">{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                        {CATEGORY_LABELS[doc.category] || doc.category}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <Badge variant={STATUS_VARIANTS[doc.status] || "neutral"}>
                        {DOCUMENT_STATUS_LABELS[doc.status as DocumentStatus] || doc.status}
                      </Badge>
                    </td>
                    <td className="py-4 px-6 text-[13px] text-gray-600">
                      {formatDate(doc.created_at)}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {isDownloadable && (
                          <button onClick={() => handleDownload(doc.id)} className="text-[12px] text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1">
                            <Download size={14} /> Download
                          </button>
                        )}
                        <DropdownMenu
                          trigger={
                            <button type="button" className="rounded p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Document actions">
                              <MoreVertical size={16} />
                            </button>
                          }
                          items={[
                            ...(isDownloadable ? [{ id: "download", label: "Download", icon: <Download size={14} />, onClick: () => handleDownload(doc.id) }] : []),
                            { id: "archive", label: "Archive", icon: <Archive size={14} />, danger: true, onClick: () => handleArchive(doc.id) },
                          ]}
                          align="right"
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      <UploadDocumentModal open={uploadOpen} onClose={() => setUploadOpen(false)} onSuccess={handleUploadSuccess} />
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TENANT DOCUMENTS — UIUX design
// ══════════════════════════════════════════════════════════════════════════════

const DOC_TYPE_ICON_STYLE: Record<string, string> = {
  LEASE_AGREEMENT: "bg-blue-50 text-blue-600",
  LEASE_ADDENDUM: "bg-blue-50 text-blue-600",
  PAYMENT_RECEIPT: "bg-green-50 text-green-600",
  MOVE_IN_CHECKLIST: "bg-violet-50 text-violet-600",
  MOVE_OUT_CHECKLIST: "bg-violet-50 text-violet-600",
  NOTICE: "bg-amber-50 text-amber-600",
  MAINTENANCE_ATTACHMENT: "bg-amber-50 text-amber-600",
  OWNER_UPLOAD: "bg-slate-50 text-slate-600",
};

const DOC_TYPE_BADGE_STYLE: Record<string, string> = {
  LEASE_AGREEMENT: "bg-blue-100 text-blue-700",
  LEASE_ADDENDUM: "bg-blue-100 text-blue-700",
  PAYMENT_RECEIPT: "bg-green-100 text-green-700",
  MOVE_IN_CHECKLIST: "bg-violet-100 text-violet-700",
  MOVE_OUT_CHECKLIST: "bg-violet-100 text-violet-700",
  NOTICE: "bg-amber-100 text-amber-700",
  MAINTENANCE_ATTACHMENT: "bg-amber-100 text-amber-700",
  OWNER_UPLOAD: "bg-slate-100 text-slate-700",
};

type DocFilter = "all" | string;

function TenantDocuments() {
  const [docs, setDocs] = useState<TenantDocumentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<DocFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

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

  // Derive categories present in actual data
  const categoryCounts = docs.reduce<Record<string, number>>((acc, d) => {
    const cat = d.category || d.related_type || "OTHER";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const filtered = docs.filter((d) => {
    const cat = d.category || d.related_type || "OTHER";
    const matchesFilter = filter === "all" || cat === filter;
    const matchesSearch = !searchQuery || (d.title || d.name || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Unique filter buttons from actual data
  const filterButtons: { key: string; label: string }[] = [
    { key: "all", label: "All" },
    ...Object.keys(categoryCounts).map((k) => ({ key: k, label: CATEGORY_LABELS[k] || k })),
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div><Skeleton variant="text" className="h-7 w-48" /><Skeleton variant="text" className="mt-2 h-4 w-72" /></div>
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4"><Skeleton variant="text" className="h-10 w-full rounded-lg" /></div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">{[0,1,2,3].map(i=><div key={i} className="bg-white rounded-xl border border-slate-200 p-4"><Skeleton variant="text" className="h-7 w-12" /><Skeleton variant="text" className="mt-1 h-4 w-20" /></div>)}</div>
        <div className="bg-white rounded-2xl border border-slate-200 shadow-md p-5">{[0,1,2].map(i=><Skeleton key={i} variant="rectangular" className="mt-3 h-16 rounded-xl" />)}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div><h1 className="text-[26px] font-semibold text-slate-900 mb-1">Documents</h1><p className="text-[14px] text-slate-600">Access your lease documents, receipts, and files</p></div>
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      </div>
    );
  }

  const leaseCount = docs.filter((d) => (d.category || d.related_type) === "LEASE_AGREEMENT" || (d.category || d.related_type) === "LEASE_ADDENDUM" || d.related_type === "lease").length;
  const receiptCount = docs.filter((d) => d.category === "PAYMENT_RECEIPT").length;
  const inspectionCount = docs.filter((d) => (d.category || "").includes("CHECKLIST")).length;

  return (
    <div className="space-y-6">
      {/* \u2500\u2500 Page Header \u2500\u2500 */}
      <div>
        <h1 className="text-[26px] font-semibold text-slate-900 mb-1">Documents</h1>
        <p className="text-[14px] text-slate-600">Access your lease documents, receipts, and files</p>
      </div>

      {/* \u2500\u2500 Search and Filter \u2500\u2500 */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-slate-300 text-[13px] focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto">
            {filterButtons.map((fb) => (
              <button
                key={fb.key}
                onClick={() => setFilter(fb.key)}
                className={`px-4 h-10 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-all ${
                  filter === fb.key
                    ? "bg-gradient-to-r from-green-50 to-green-50/50 text-green-700 ring-2 ring-green-200"
                    : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {fb.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* \u2500\u2500 Document Stats \u2500\u2500 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[24px] font-bold text-slate-900 mb-1">{docs.length}</p>
          <p className="text-[12px] text-slate-600 font-medium">Total Documents</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[24px] font-bold text-blue-600 mb-1">{leaseCount}</p>
          <p className="text-[12px] text-slate-600 font-medium">Lease Docs</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[24px] font-bold text-green-600 mb-1">{receiptCount}</p>
          <p className="text-[12px] text-slate-600 font-medium">Receipts</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
          <p className="text-[24px] font-bold text-violet-600 mb-1">{inspectionCount}</p>
          <p className="text-[12px] text-slate-600 font-medium">Inspections</p>
        </div>
      </div>

      {/* \u2500\u2500 Documents List \u2500\u2500 */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-md overflow-hidden">
        <div className="p-5 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-semibold text-slate-900">
              {filter === "all" ? "All Documents" : `${CATEGORY_LABELS[filter] || filter} Documents`}
            </h3>
            <span className="text-[13px] text-slate-600">
              {filtered.length} document{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>
        <div className="p-5">
          {filtered.length > 0 ? (
            <div className="space-y-3">
              {filtered.map((doc) => {
                const cat = doc.category || doc.related_type || "OTHER";
                const iconStyle = DOC_TYPE_ICON_STYLE[cat] ?? "bg-slate-50 text-slate-600";
                const badgeStyle = DOC_TYPE_BADGE_STYLE[cat] ?? "bg-slate-100 text-slate-700";
                return (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm ${iconStyle}`}>
                        <FileText className="w-6 h-6" strokeWidth={2.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-semibold text-slate-900 mb-1">{doc.title || doc.name || "Document"}</p>
                        <div className="flex items-center gap-3 text-[12px] text-slate-600">
                          <span className={`px-2 py-0.5 rounded-md font-semibold ${badgeStyle}`}>
                            {CATEGORY_LABELS[cat] || cat}
                          </span>
                          <span>\u2022</span>
                          <span>{formatDate(doc.created_at)}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDownload(doc.id)}
                      className="flex items-center gap-2 h-10 px-4 bg-white text-slate-700 text-[13px] font-semibold rounded-lg border border-slate-300 hover:border-slate-400 hover:bg-slate-50 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center mx-auto mb-4">
                <FolderOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-[14px] text-slate-600 mb-1">No documents found</p>
              <p className="text-[12px] text-slate-500">
                {searchQuery ? "Try a different search term" : "Documents will appear here when available"}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* \u2500\u2500 Help Card \u2500\u2500 */}
      <div className="bg-gradient-to-br from-blue-50 to-blue-50/50 rounded-2xl border border-blue-200 p-6">
        <h3 className="text-[15px] font-semibold text-slate-900 mb-2">Need a document?</h3>
        <p className="text-[13px] text-slate-600">
          If you need a specific document that isn\u2019t listed here, reach out to your property manager directly and they\u2019ll provide it to you.
        </p>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE
// ══════════════════════════════════════════════════════════════════════════════

export default function DocumentsPage() {
  const { user } = authStore();
  const isOwner = user?.persona === "owner";

  if (!isOwner) {
    // Tenant documents page handles its own header
    return <TenantDocuments />;
  }

  return (
    <>
      <PageHeader
        title="Documents"
        description="Upload, manage, and organize documents \u2014 leases, notices, and receipts."
      />
      <OwnerDocuments />
    </>
  );
}
