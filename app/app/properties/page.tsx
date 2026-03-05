"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Building2 } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Properties" description="Manage your property portfolio — buildings, addresses, and unit counts." />
      <EmptyState
        icon={<Building2 size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner will have access."
        className="mt-8"
      />
    </>
  );
}
