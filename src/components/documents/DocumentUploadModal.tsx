"use client";

import { useRef, useState } from "react";
import { X, Upload, FileText, AlertCircle } from "lucide-react";
import {
  uploadDocument,
  DOCUMENT_CATEGORIES,
  type DocumentCategory,
} from "@/services/documents/documentApiService";

interface DocumentUploadModalProps {
  /** Pre-fill the related entity. If not provided, user must choose. */
  relatedType?: string;
  relatedId?: string;
  onClose: () => void;
  onSuccess: () => void;
}

function categoryLabel(cat: string): string {
  return cat.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());
}

export function DocumentUploadModal({
  relatedType: defaultRelatedType = "LEASE",
  relatedId: defaultRelatedId = "",
  onClose,
  onSuccess,
}: DocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("LEASE_AGREEMENT");
  const [relatedId, setRelatedId] = useState(defaultRelatedId);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    // Auto-fill title from filename if empty
    if (!title) {
      setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) { setError("Please choose a file."); return; }
    if (!title.trim()) { setError("Please enter a document title."); return; }
    if (!relatedId.trim()) { setError("Please enter the lease ID."); return; }

    setError(null);
    setUploading(true);

    try {
      setProgress("Requesting upload URL…");
      const doc = await uploadDocument({
        relatedType: defaultRelatedType,
        relatedId: relatedId.trim(),
        category,
        title: title.trim(),
        description: description.trim() || undefined,
        file,
      });
      setProgress("Upload complete!");
      onSuccess();
    } catch (e: any) {
      setError(e?.message ?? "Upload failed. Please try again.");
      setProgress(null);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4">
          <h2 className="text-sm font-semibold text-slate-100">Upload Document</h2>
          <button
            onClick={onClose}
            disabled={uploading}
            className="text-slate-400 hover:text-slate-200 disabled:opacity-40"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
          {/* File drop zone */}
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors ${
                file
                  ? "border-indigo-600/50 bg-indigo-950/20"
                  : "border-slate-700 bg-slate-950/50 hover:border-slate-600"
              }`}
            >
              {file ? (
                <>
                  <FileText size={20} className="text-indigo-400" />
                  <span className="text-xs text-slate-200 font-medium truncate max-w-[200px]">
                    {file.name}
                  </span>
                  <span className="text-xs text-slate-500">
                    {(file.size / 1024).toFixed(0)} KB
                  </span>
                </>
              ) : (
                <>
                  <Upload size={20} className="text-slate-500" />
                  <span className="text-xs text-slate-400">
                    Click to choose a file
                  </span>
                  <span className="text-[11px] text-slate-600">PDF, DOCX, JPG, PNG</span>
                </>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.docx,.doc,.jpg,.jpeg,.png"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Document title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Lease Agreement — Unit 101"
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as DocumentCategory)}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              {DOCUMENT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>{categoryLabel(cat)}</option>
              ))}
            </select>
          </div>

          {/* Lease ID (shown when relatedId not pre-filled) */}
          {!defaultRelatedId && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Lease ID <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={relatedId}
                onChange={(e) => setRelatedId(e.target.value)}
                placeholder="Lease ID"
                className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none font-mono"
                required
              />
            </div>
          )}

          {/* Description (optional) */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Description <span className="text-slate-600">(optional)</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Any notes about this document"
              rows={2}
              className="w-full rounded border border-slate-700 bg-slate-950 px-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:border-indigo-500 focus:outline-none resize-none"
            />
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 rounded border border-rose-800 bg-rose-950/50 px-3 py-2 text-xs text-rose-400">
              <AlertCircle size={12} className="mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {/* Progress */}
          {progress && (
            <p className="text-center text-xs text-indigo-400">{progress}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={uploading}
              className="rounded border border-slate-700 px-4 py-1.5 text-xs text-slate-300 hover:bg-slate-800 disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
            >
              {uploading ? (
                <>
                  <span className="animate-spin">⟳</span>
                  Uploading…
                </>
              ) : (
                <>
                  <Upload size={12} />
                  Upload
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
