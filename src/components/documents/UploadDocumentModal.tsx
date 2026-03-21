"use client";

import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Upload, FileText, X, Search } from "lucide-react";
import {
  uploadDocument,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type DocumentRow,
} from "@/services/documents/documentApiService";
import { fetchLeases } from "@/services/leases/leaseService";
import type { LeaseRow } from "@/services/leases/types";

const CATEGORY_LABELS: Record<DocumentCategory, string> = {
  LEASE_AGREEMENT: "Lease Agreement",
  LEASE_ADDENDUM: "Lease Addendum",
  NOTICE: "Notice",
  PAYMENT_RECEIPT: "Payment Receipt",
  MOVE_IN_CHECKLIST: "Move-in Checklist",
  MOVE_OUT_CHECKLIST: "Move-out Checklist",
  MAINTENANCE_ATTACHMENT: "Maintenance Attachment",
  OWNER_UPLOAD: "General Upload",
};

const RELATED_TYPES = ["LEASE", "PAYMENT", "MAINTENANCE", "GENERAL"] as const;

/** Build a human-readable label for a lease row. */
function leaseLabel(l: LeaseRow): string {
  const parts: string[] = [];
  if (l.property_name) parts.push(l.property_name);
  if (l.unit_number) parts.push(`Unit ${l.unit_number}`);
  const tenantNames = l.tenants?.map((t) => t.name).filter(Boolean).join(", ");
  if (tenantNames) parts.push(tenantNames);
  if (parts.length === 0) parts.push(`Lease ${l.id.slice(0, 8)}`);
  return parts.join(" · ");
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSuccess: (doc: DocumentRow) => void;
}

export function UploadDocumentModal({ open, onClose, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("OWNER_UPLOAD");
  const [relatedType, setRelatedType] = useState("LEASE");
  const [relatedId, setRelatedId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  // ── Lease picker state ─────────────────────────────────────────────────────
  const [leases, setLeases] = useState<LeaseRow[]>([]);
  const [leasesLoading, setLeasesLoading] = useState(false);
  const [leasesLoaded, setLeasesLoaded] = useState(false);
  const [leaseSearch, setLeaseSearch] = useState("");

  // Load leases once when modal opens (cached for session)
  useEffect(() => {
    if (!open || leasesLoaded) return;
    let cancelled = false;
    async function load() {
      setLeasesLoading(true);
      try {
        const result = await fetchLeases(1, 100);
        if (!cancelled) setLeases(result.data);
      } catch {
        // Non-blocking — fallback to manual ID
      } finally {
        if (!cancelled) { setLeasesLoading(false); setLeasesLoaded(true); }
      }
    }
    load();
    return () => { cancelled = true; };
  }, [open, leasesLoaded]);

  const filteredLeases = useMemo(() => {
    if (!leaseSearch.trim()) return leases;
    const q = leaseSearch.toLowerCase();
    return leases.filter((l) => leaseLabel(l).toLowerCase().includes(q) || l.id.includes(q));
  }, [leases, leaseSearch]);

  const reset = useCallback(() => {
    setFile(null); setTitle(""); setDescription(""); setCategory("OWNER_UPLOAD");
    setRelatedType("LEASE"); setRelatedId(""); setError(null); setDragOver(false);
    setLeaseSearch("");
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  // ── Shared file selection logic ──────────────────────────────────────────
  const MAX_FILE_SIZE = 25 * 1024 * 1024;

  const selectFile = useCallback((f: File) => {
    if (f.size > MAX_FILE_SIZE) {
      setError(`File is too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum size is 25 MB.`);
      return;
    }
    setFile(f); setError(null);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }, [title]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  }, [selectFile]);

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(true); }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); }, []);
  const handleDrop = useCallback((e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setDragOver(false); const f = e.dataTransfer?.files?.[0]; if (f) selectFile(f); }, [selectFile]);

  useEffect(() => {
    if (!open) return;
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => { document.removeEventListener("dragover", prevent); document.removeEventListener("drop", prevent); };
  }, [open]);

  // ── Upload ─────────────────────────────────────────────────────────────────
  const canSubmit = file && title.trim() && (relatedType === "GENERAL" || relatedId);

  const handleUpload = useCallback(async () => {
    if (!file || !title.trim()) return;
    if (relatedType !== "GENERAL" && !relatedId) {
      setError("Please select or enter a related entity.");
      return;
    }
    setUploading(true); setError(null);
    try {
      const doc = await uploadDocument({
        relatedType: relatedType || "GENERAL",
        relatedId: relatedId || "none",
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        file,
      });
      onSuccess(doc);
      handleClose();
    } catch (e: any) {
      setError(e?.message || "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [file, title, description, category, relatedType, relatedId, onSuccess, handleClose]);

  // ── Lease picker or manual ID ──────────────────────────────────────────────
  const selectedLease = leases.find((l) => l.id === relatedId);

  function renderRelatedEntity() {
    return (
      <div className="space-y-2">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Related To</label>
          <select
            value={relatedType}
            onChange={(e) => { setRelatedType(e.target.value); setRelatedId(""); setLeaseSearch(""); }}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {RELATED_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
          </select>
        </div>

        {relatedType === "LEASE" ? (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Lease</label>
            {leasesLoading ? (
              <Skeleton variant="text" className="h-9 w-full rounded-md" />
            ) : leases.length > 0 ? (
              <>
                {/* Selected lease chip or search input */}
                {selectedLease ? (
                  <div className="flex items-center gap-2 rounded-md border border-brand-200 bg-brand-50 px-3 py-2">
                    <span className="flex-1 truncate text-sm text-brand-700">{leaseLabel(selectedLease)}</span>
                    <button type="button" onClick={() => setRelatedId("")} className="text-brand-400 hover:text-brand-600"><X size={14} /></button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={leaseSearch}
                      onChange={(e) => setLeaseSearch(e.target.value)}
                      placeholder="Search leases…"
                      className="w-full rounded-md border border-slate-300 bg-white pl-8 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
                    />
                  </div>
                )}
                {/* Dropdown list (only when no selection) */}
                {!selectedLease && (
                  <div className="mt-1 max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white">
                    {filteredLeases.length === 0 ? (
                      <p className="px-3 py-2 text-xs text-slate-400">No matching leases</p>
                    ) : (
                      filteredLeases.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => { setRelatedId(l.id); setLeaseSearch(""); }}
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 transition-colors"
                        >
                          <span className="flex-1 truncate text-slate-700">{leaseLabel(l)}</span>
                          <span className="shrink-0 text-xs text-slate-400">{l.status}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Fallback: no leases found — manual ID input */
              <Input
                value={relatedId}
                onChange={(e) => setRelatedId(e.target.value)}
                placeholder="Enter lease ID"
                helperText="No leases found. Enter the lease ID manually."
              />
            )}
          </div>
        ) : relatedType === "GENERAL" ? (
          <p className="text-xs text-slate-400">No related entity required for general uploads.</p>
        ) : (
          <Input
            label={`${relatedType.charAt(0) + relatedType.slice(1).toLowerCase()} ID`}
            value={relatedId}
            onChange={(e) => setRelatedId(e.target.value)}
            placeholder={`Enter ${relatedType.toLowerCase()} ID`}
          />
        )}
      </div>
    );
  }

  return (
    <Modal open={open} onClose={handleClose} title="Upload Document">
      <div className="space-y-4">
        {/* Drop zone / file picker */}
        <div>
          <input ref={fileRef} type="file" className="hidden" onChange={handleFileChange} accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv,.xls,.xlsx" />
          {file ? (
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <FileText size={18} className="text-slate-500" />
              <span className="flex-1 truncate text-sm text-slate-700">{file.name}</span>
              <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
              <button type="button" onClick={() => setFile(null)} className="text-slate-400 hover:text-slate-600"><X size={14} /></button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              onDragOver={handleDragOver} onDragEnter={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors ${
                dragOver ? "border-brand-500 bg-brand-50 text-brand-600" : "border-slate-300 bg-white text-slate-500 hover:border-brand-400 hover:text-brand-600"
              }`}
            >
              <Upload size={20} />
              <span>{dragOver ? "Drop file here" : "Choose a file or drag & drop"}</span>
            </button>
          )}
        </div>

        {/* Title */}
        <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Lease Agreement — Unit 3B" />

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Description (optional)</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief notes about this document…" rows={2}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>

        {/* Related entity — lease picker or manual ID */}
        {renderRelatedEntity()}

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleUpload} loading={uploading} disabled={!canSubmit} icon={<Upload size={14} />}>
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}
