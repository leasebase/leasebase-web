"use client";

import { useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { FolderOpen, FileText, Plus } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { fetchTenantDocuments } from "@/services/tenant/adapters/documentAdapter";
import type { DocumentRow } from "@/services/tenant/types";

/**
 * Documents — LIVE for tenant (Phase 2).
 * Fetches via GET /api/documents/mine (lease-scoped, server-side filtered).
 * s3_key is excluded from the response for safety.
 */
export default function Page() {
  const { user } = authStore();
  const isTenant = user?.persona === "tenant";
  const [documents, setDocuments] = useState<DocumentRow[]>([]);
  const [isLoading, setIsLoading] = useState(isTenant);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTenant) return;
    let cancelled = false;
    async function load() {
      try {
        const result = await fetchTenantDocuments();
        if (!cancelled) {
          setDocuments(result.data);
          if (result.source === "unavailable") setError(result.error);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [isTenant]);

  return (
    <>
      <PageHeader
        title="Documents"
        description={
          isTenant
            ? "View lease documents, notices, and receipts."
            : "Upload, manage, and e-sign documents — leases, notices, and receipts."
        }
      />

      {isTenant ? (
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} variant="text" className="h-14 w-full rounded-md" />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              icon={<FolderOpen size={48} strokeWidth={1.5} />}
              title="No documents available"
              description="Your lease documents will appear here once your property manager uploads them."
            />
          ) : (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white p-4"
                >
                  <FileText size={20} className="shrink-0 text-slate-400" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-900 truncate">{doc.name}</p>
                    <p className="text-xs text-slate-400">
                      {doc.mime_type} · {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <EmptyState
          icon={<FolderOpen size={48} strokeWidth={1.5} />}
          title="No documents yet"
          description="Upload leases, notices, and receipts to keep everything organized."
          action={
            <Button variant="primary" icon={<Plus size={16} />}>Upload Document</Button>
          }
          className="mt-8"
        />
      )}
    </>
  );
}
