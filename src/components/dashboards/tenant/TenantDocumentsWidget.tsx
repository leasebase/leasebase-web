"use client";

import { FolderOpen, FileText } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import type { TenantDocumentsWidgetViewModel } from "@/services/tenant/types";

interface TenantDocumentsWidgetProps {
  vm: TenantDocumentsWidgetViewModel;
}

export function TenantDocumentsWidget({ vm }: TenantDocumentsWidgetProps) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/70">
      <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
        <div className="flex items-center gap-2">
          <FolderOpen size={16} className="text-slate-400" />
          <h2 className="text-sm font-semibold text-slate-100">Documents</h2>
        </div>
        {vm.hasDocuments && (
          <Badge variant="success">{vm.documents.length}</Badge>
        )}
      </div>
      <div className="px-4 py-4">
        {!vm.hasDocuments ? (
          <p className="text-xs text-slate-400">
            {vm.source === "unavailable"
              ? "Could not load documents."
              : "No documents available yet."}
          </p>
        ) : (
          <div className="space-y-2">
            {vm.documents.slice(0, 3).map((doc) => (
              <div key={doc.id} className="flex items-center gap-2 text-xs">
                <FileText size={14} className="shrink-0 text-slate-500" />
                <span className="truncate text-slate-200">{doc.name}</span>
                <span className="shrink-0 text-slate-500">{doc.date}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
