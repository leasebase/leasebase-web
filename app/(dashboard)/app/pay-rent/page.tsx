"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Banknote } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Pay Rent" description="Make a rent payment — select payment method and amount." />
      <EmptyState
        icon={<Banknote size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. tenant will have access."
        className="mt-8"
      />
    </>
  );
}
