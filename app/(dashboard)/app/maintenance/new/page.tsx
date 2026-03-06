"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { PlusCircle } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="New Maintenance Request" description="Submit a new maintenance request — describe the issue and upload photos." />
      <EmptyState
        icon={<PlusCircle size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. tenant will have access."
        className="mt-8"
      />
    </>
  );
}
