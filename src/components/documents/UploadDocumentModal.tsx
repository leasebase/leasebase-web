"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Upload, FileText, X } from "lucide-react";
import {
  uploadDocument,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
  type DocumentRow,
} from "@/services/documents/documentApiService";

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
  const [relatedType, setRelatedType] = useState("GENERAL");
  const [relatedId, setRelatedId] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const reset = useCallback(() => {
    setFile(null); setTitle(""); setDescription(""); setCategory("OWNER_UPLOAD");
    setRelatedType("GENERAL"); setRelatedId(""); setError(null); setDragOver(false);
  }, []);

  const handleClose = useCallback(() => { reset(); onClose(); }, [reset, onClose]);

  // ── Shared file selection logic ────────────────────────────────────────────
  const selectFile = useCallback((f: File) => {
    setFile(f);
    setError(null);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  }, [title]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) selectFile(f);
  }, [selectFile]);

  // ── Drag-and-drop handlers ─────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) selectFile(f);
  }, [selectFile]);

  // ── Global drop prevention ─────────────────────────────────────────────────
  // Prevent browser from opening dropped files anywhere in the document
  // while the modal is open.
  useEffect(() => {
    if (!open) return;
    const prevent = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    document.addEventListener("dragover", prevent);
    document.addEventListener("drop", prevent);
    return () => {
      document.removeEventListener("dragover", prevent);
      document.removeEventListener("drop", prevent);
    };
  }, [open]);

  // ── Upload handler ─────────────────────────────────────────────────────────
  const handleUpload = useCallback(async () => {
    if (!file || !title.trim()) return;
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

  return (
    <Modal open={open} onClose={handleClose} title="Upload Document">
      <div className="space-y-4">
        {/* ── Drop zone / file picker ── */}
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
              onDragOver={handleDragOver}
              onDragEnter={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-sm transition-colors ${
                dragOver
                  ? "border-brand-500 bg-brand-50 text-brand-600"
                  : "border-slate-300 bg-white text-slate-500 hover:border-brand-400 hover:text-brand-600"
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
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief notes about this document…"
            rows={2}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
            {DOCUMENT_CATEGORIES.map((c) => <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>)}
          </select>
        </div>

        {/* Related entity */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Related To</label>
            <select value={relatedType} onChange={(e) => setRelatedType(e.target.value)} className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500">
              {RELATED_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</option>)}
            </select>
          </div>
          <Input label="Related ID" value={relatedId} onChange={(e) => setRelatedId(e.target.value)} placeholder="Lease or entity ID" helperText={relatedType === "GENERAL" ? "Optional for general uploads" : undefined} />
        </div>

        {error && <p className="text-xs text-red-600">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={handleClose} disabled={uploading}>Cancel</Button>
          <Button variant="primary" size="sm" onClick={handleUpload} loading={uploading} disabled={!file || !title.trim()} icon={<Upload size={14} />}>
            Upload
          </Button>
        </div>
      </div>
    </Modal>
  );
}
