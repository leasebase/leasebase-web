"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wrench } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Maintenance" description="Track maintenance requests, work orders, and vendor assignments." />
      <EmptyState
        icon={<Wrench size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant will have access."
        className="mt-8"
      />
    </>
  );
}
