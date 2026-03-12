"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Receipt } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Rent Roll" description="Overview of all rents due and collected across your portfolio." />
      <EmptyState
        icon={<Receipt size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development."
        className="mt-8"
      />
    </>
  );
}
