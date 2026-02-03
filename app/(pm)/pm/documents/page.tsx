"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";
import type { Document } from "@/lib/api/types";

export default function DocumentsPage() {
  const toast = useToast();
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    try {
      const res = await api.get<Document[]>("/pm/documents");
      setDocs(res.data);
      setError(null);
    } catch (err) {
      const e = toApiError(err);
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const fileInput = form.elements.namedItem("file") as HTMLInputElement | null;
    if (!fileInput?.files?.length) return;
    const file = fileInput.files[0];
    try {
      const { data } = await api.post<{ uploadUrl: string; documentId: string }>(
        "/pm/documents/upload-url",
        { name: file.name, type: file.type }
      );
      await fetch(data.uploadUrl, { method: "PUT", body: file });
      await api.post(`/pm/documents/${data.documentId}/complete`);
      toast.show("Document uploaded.");
      form.reset();
      load();
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Documents"
        description="Upload and manage documents using signed URLs from the API."
      />
      {loading && <p className="text-sm text-slate-300">Loading documents…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <DataTable<Document>
        columns={[
          { key: "name", header: "Name" },
          { key: "category", header: "Category" },
          { key: "createdAt", header: "Uploaded" }
        ]}
        rows={docs}
        getRowId={(d) => d.id}
        emptyMessage="No documents yet."
      />
      <form className="mt-4 space-y-2 text-sm" onSubmit={handleUpload}>
        <FormField label="Upload document">
          <input
            type="file"
            name="file"
            className="block w-full text-xs text-slate-300"
            required
          />
        </FormField>
        <button
          type="submit"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Upload
        </button>
      </form>
    </div>
  );
}
