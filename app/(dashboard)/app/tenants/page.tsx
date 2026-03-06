"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Users } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Tenants" description="Manage tenant records, contacts, and lease associations." />
      <EmptyState
        icon={<Users size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager will have access."
        className="mt-8"
      />
    </>
  );
}
