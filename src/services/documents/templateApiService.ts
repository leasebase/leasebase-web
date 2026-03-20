/**
 * Template API Service — Phase 2
 *
 * Client for document-service template endpoints.
 * All requests target /api/documents/templates/* (proxied via BFF).
 */

import { apiRequest } from "@/lib/api/client";
import type { DocumentCategory } from "./documentApiService";

// ── Types ────────────────────────────────────────────────────────────────────

export interface TemplateRow {
  id: string;
  organization_id: string;
  category: DocumentCategory;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
  versions?: TemplateVersionRow[];
}

export interface TemplateVersionRow {
  id: string;
  template_id: string;
  version_number: number;
  storage_bucket: string;
  storage_key: string;
  source_format: "PDF" | "DOCX" | "HTML";
  content_text?: string | null;
  created_by_user_id: string;
  created_at: string;
}

export const VARIABLE_DATA_TYPES = [
  "STRING", "NUMBER", "DATE", "BOOLEAN", "CURRENCY", "TEXT",
] as const;
export type VariableDataType = typeof VARIABLE_DATA_TYPES[number];

export interface TemplateVariable {
  id?: string;
  template_version_id?: string;
  variable_key: string;
  label: string;
  data_type: VariableDataType;
  required: boolean;
  default_value_json?: string | null;
  sort_order: number;
}

export interface GeneratedDocumentRow {
  id: string;
  document_id: string;
  template_version_id: string;
  lease_id: string;
  generation_input_json: Record<string, unknown>;
  created_by_user_id: string;
  created_at: string;
}

// ── Template CRUD ─────────────────────────────────────────────────────────────

export async function fetchTemplates(params?: {
  category?: DocumentCategory;
  active?: boolean;
}): Promise<{ data: TemplateRow[] }> {
  const q = new URLSearchParams();
  if (params?.category) q.set("category", params.category);
  if (params?.active !== undefined) q.set("active", String(params.active));
  const qs = q.toString();
  return apiRequest<{ data: TemplateRow[] }>({
    path: `api/documents/templates${qs ? `?${qs}` : ""}`,
  });
}

export async function fetchTemplateById(
  id: string,
): Promise<{ data: TemplateRow & { versions: TemplateVersionRow[] } }> {
  return apiRequest({ path: `api/documents/templates/${id}` });
}

export async function createTemplate(params: {
  name: string;
  description?: string;
  category?: DocumentCategory;
}): Promise<{ data: TemplateRow }> {
  return apiRequest<{ data: TemplateRow }>({
    path: "api/documents/templates",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}

export async function updateTemplate(
  id: string,
  fields: { name?: string; description?: string; category?: DocumentCategory; is_active?: boolean },
): Promise<{ data: TemplateRow }> {
  return apiRequest<{ data: TemplateRow }>({
    path: `api/documents/templates/${id}`,
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(fields),
  });
}

export async function archiveTemplate(id: string): Promise<void> {
  await apiRequest<void>({ path: `api/documents/templates/${id}`, method: "DELETE" });
}

// ── Template variables ────────────────────────────────────────────────────────

export async function fetchTemplateVariables(
  templateId: string,
): Promise<{ data: TemplateVariable[]; versionId: string | null; versionNumber?: number }> {
  return apiRequest({ path: `api/documents/templates/${templateId}/variables` });
}

export async function setTemplateVariables(
  templateId: string,
  variables: Omit<TemplateVariable, "id" | "template_version_id">[],
): Promise<{ data: TemplateVariable[]; versionId: string }> {
  return apiRequest({
    path: `api/documents/templates/${templateId}/variables`,
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(variables),
  });
}

// ── Template version upload ───────────────────────────────────────────────────

export async function requestTemplateVersionUploadUrl(
  templateId: string,
  params: { fileName: string; mimeType: string; sourceFormat?: "PDF" | "DOCX" | "HTML"; contentText?: string },
): Promise<{ data: TemplateVersionRow; uploadUrl: string; storageKey: string }> {
  return apiRequest({
    path: `api/documents/templates/${templateId}/versions/upload-url`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceFormat: "PDF", ...params }),
  });
}

export async function completeTemplateVersionUpload(
  templateId: string,
  versionId: string,
): Promise<{ data: TemplateVersionRow }> {
  return apiRequest({
    path: `api/documents/templates/${templateId}/versions/upload-complete`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versionId }),
  });
}

// ── Document generation ───────────────────────────────────────────────────────

export interface GenerateDocumentParams {
  leaseId: string;
  variables: Record<string, unknown>;
  title?: string;
}

export async function generateDocumentFromTemplate(
  templateId: string,
  params: GenerateDocumentParams,
): Promise<{
  data: import("./documentApiService").DocumentRow & { current_version: unknown };
  generatedDocument: GeneratedDocumentRow;
}> {
  return apiRequest({
    path: `api/documents/templates/${templateId}/generate`,
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
}
