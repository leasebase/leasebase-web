"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Bell } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Notifications" description="View alerts, reminders, and system notifications." />
      <EmptyState
        icon={<Bell size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant, vendor will have access."
        className="mt-8"
      />
    </>
  );
}
