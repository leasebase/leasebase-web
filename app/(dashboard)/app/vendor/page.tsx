"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { HardHat } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Vendor Dashboard" description="View assigned work orders, update statuses, and submit invoices." />
      <EmptyState
        icon={<HardHat size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development."
        className="mt-8"
      />
    </>
  );
}
