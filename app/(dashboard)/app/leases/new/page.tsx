"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { FilePlus } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="New Lease" description="Create a new lease agreement — select property, unit, tenant, and terms." />
      <EmptyState
        icon={<FilePlus size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager will have access."
        className="mt-8"
      />
    </>
  );
}
