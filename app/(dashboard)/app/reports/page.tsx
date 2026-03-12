"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3 } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Reports" description="Generate financial and operational reports for your portfolio." />
      <EmptyState
        icon={<BarChart3 size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development."
        className="mt-8"
      />
    </>
  );
}
