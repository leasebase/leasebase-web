"use client";

import Link from "next/link";
import { FileText, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function LeasesEmptyState() {
  return (
    <EmptyState
      icon={<FileText size={48} strokeWidth={1.5} />}
      title="No leases yet"
      description="Create your first lease agreement to start tracking tenants and rent."
      action={
        <Link href="/app/leases/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Create Lease
          </Button>
        </Link>
      }
    />
  );
}
