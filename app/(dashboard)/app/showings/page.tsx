"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { CalendarDays } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Showings" description="Schedule and manage property showings for prospective tenants." />
      <EmptyState
        icon={<CalendarDays size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development."
        className="mt-8"
      />
    </>
  );
}
