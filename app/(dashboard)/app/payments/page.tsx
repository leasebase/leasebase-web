"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CreditCard } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Payments" description="View payment history, pending charges, and financial ledger." />
      <EmptyState
        icon={<CreditCard size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant will have access."
        className="mt-8"
      />
    </>
  );
}
