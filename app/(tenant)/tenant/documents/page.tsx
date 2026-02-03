"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { api, toApiError } from "@/lib/api/http";
import type { Document } from "@/lib/api/types";

export default function TenantDocumentsPage() {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get<Document[]>("/tenant/documents");
        setDocs(res.data);
        setError(null);
      } catch (err) {
        const e = toApiError(err);
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Lease documents"
        description="View and download your lease and related documents."
      />
      {loading && <p className="text-sm text-slate-300">Loading documents…</p>}
      {error && <p className="text-sm text-red-400">{error}</p>}
      <DataTable<Document>
        columns={[
          { key: "name", header: "Name" },
          { key: "createdAt", header: "Uploaded" }
        ]}
        rows={docs}
        getRowId={(d) => d.id}
        emptyMessage="No documents yet."
      />
    </div>
  );
}
