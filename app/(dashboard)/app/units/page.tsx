"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { DoorOpen } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Units" description="View all units across properties — occupancy, rent, and lease status." />
      <EmptyState
        icon={<DoorOpen size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager will have access."
        className="mt-8"
      />
    </>
  );
}
