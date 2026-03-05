"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FolderOpen } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Documents" description="Upload, manage, and e-sign documents — leases, notices, and receipts." />
      <EmptyState
        icon={<FolderOpen size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant will have access."
        className="mt-8"
      />
    </>
  );
}
