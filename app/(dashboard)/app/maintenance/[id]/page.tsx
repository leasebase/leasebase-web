"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="Work Order" description="View work order details — status, assignment, photos, and notes." />
      <EmptyState
        icon={<ClipboardList size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant, vendor will have access."
        className="mt-8"
      />
    </>
  );
}
