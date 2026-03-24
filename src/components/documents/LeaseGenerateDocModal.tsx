"use client";

import { useEffect, useState } from "react";
import { X, FileText, Zap } from "lucide-react";
import {
  fetchTemplates,
  fetchTemplateVariables,
  generateDocumentFromTemplate,
  type TemplateRow,
  type TemplateVariable,
} from "@/services/documents/templateApiService";

interface Props {
  leaseId: string;
  onClose: () => void;
  onGenerated: () => void;
}

export function LeaseGenerateDocModal({ leaseId, onClose, onGenerated }: Props) {
  const [templates, setTemplates] = useState<TemplateRow[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [variables, setVariables] = useState<TemplateVariable[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingVars, setLoadingVars] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load active templates
  useEffect(() => {
    fetchTemplates({ active: true, category: "LEASE_AGREEMENT" })
      .then((r) => setTemplates(r.data))
      .catch(() => setTemplates([]));
  }, []);

  // Load variables when template changes
  useEffect(() => {
    if (!selectedId) { setVariables([]); setValues({}); return; }
    setLoadingVars(true);
    fetchTemplateVariables(selectedId)
      .then((r) => {
        setVariables(r.data);
        // Pre-fill defaults
        const defaults: Record<string, string> = {};
        for (const v of r.data) {
          if (v.default_value_json) {
            try { defaults[v.variable_key] = JSON.parse(v.default_value_json); } catch { /**/ }
          }
        }
        setValues(defaults);
      })
      .catch(() => setVariables([]))
      .finally(() => setLoadingVars(false));
  }, [selectedId]);

  async function handleGenerate() {
    if (!selectedId) { setError("Please select a template."); return; }
    const missing = variables.filter((v) => v.required && !values[v.variable_key]?.trim());
    if (missing.length > 0) {
      setError(`Required fields missing: ${missing.map((v) => v.label).join(", ")}`);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await generateDocumentFromTemplate(selectedId, {
        leaseId,
        variables: Object.fromEntries(
          Object.entries(values).map(([k, v]) => [k, v])
        ),
        title: title.trim() || undefined,
      });
      onGenerated();
    } catch (e: any) {
      setError(e?.message ?? "Failed to generate document");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-700 px-5 py-4">
          <div className="flex items-center gap-2">
            <Zap size={16} className="text-indigo-400" />
            <h2 className="text-sm font-semibold text-slate-100">Generate Lease Document</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="space-y-4 px-5 py-4">
          {/* Template selector */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">Template</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">Select a template…</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Document title override */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Document title <span className="text-slate-500">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Leave blank to use template name + date"
              className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          {/* Variables */}
          {loadingVars && (
            <p className="text-xs text-slate-500">Loading variables…</p>
          )}

          {!loadingVars && variables.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-xs font-medium text-slate-400">Template variables</h3>
              {variables.map((v) => (
                <div key={v.variable_key}>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {v.label}
                    {v.required && <span className="ml-1 text-rose-400">*</span>}
                  </label>
                  <input
                    type={v.data_type === "DATE" ? "date" : "text"}
                    value={values[v.variable_key] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [v.variable_key]: e.target.value }))}
                    className="w-full rounded border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-200 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}

          {!loadingVars && selectedId && variables.length === 0 && (
            <p className="text-xs text-slate-500">No variables defined for this template.</p>
          )}

          {error && (
            <p className="rounded bg-rose-950/40 border border-rose-700 px-3 py-2 text-xs text-rose-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-slate-700 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !selectedId}
            className="inline-flex items-center gap-1.5 rounded bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
          >
            <FileText size={12} />
            {loading ? "Generating…" : "Generate document"}
          </button>
        </div>
      </div>
    </div>
  );
}
