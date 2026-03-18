"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { DoorOpen, Plus } from "lucide-react";
export default function Page() {
  return (
    <>
      <PageHeader title="Units" description="View all units across properties." />
      <EmptyState
        icon={<DoorOpen size={48} strokeWidth={1.5} />}
        title="No units yet"
        description="Create units for your properties to manage occupancy and rent."
        action={
          <Button variant="primary" icon={<Plus size={16} />}>Add Unit</Button>
        }
        className="mt-8"
      />
    </>
  );
}
