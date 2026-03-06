"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FileText } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Leases" description="View and manage lease agreements — active, upcoming, and expired." />
      <EmptyState
        icon={<FileText size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant will have access."
        className="mt-8"
      />
    </>
  );
}
