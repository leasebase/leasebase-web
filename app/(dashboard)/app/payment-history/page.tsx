"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { History } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Payment History" description="View your past payments and download receipts." />
      <EmptyState
        icon={<History size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. tenant will have access."
        className="mt-8"
      />
    </>
  );
}
