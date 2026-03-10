"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { FileText, Plus } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Leases" description="View and manage lease agreements — active, upcoming, and expired." />
      <EmptyState
        icon={<FileText size={48} strokeWidth={1.5} />}
        title="No leases yet"
        description="Create your first lease agreement to start tracking tenants and rent."
        action={
          <Button variant="primary" icon={<Plus size={16} />}>Create Lease</Button>
        }
        className="mt-8"
      />
    </>
  );
}
