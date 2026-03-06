"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList } from "lucide-react";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="Work Order Detail" description="View and update work order — progress, notes, and invoice submission." />
      <EmptyState
        icon={<ClipboardList size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. vendor will have access."
        className="mt-8"
      />
    </>
  );
}
