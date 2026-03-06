"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { User } from "lucide-react";

export default function Page({ params }: { params: { id: string } }) {
  return (
    <>
      <PageHeader title="Tenant Profile" description="View tenant details — lease history, payment records, and communications." />
      <EmptyState
        icon={<User size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager will have access."
        className="mt-8"
      />
    </>
  );
}
