"use client";

import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";

export function PropertiesEmptyState() {
  return (
    <EmptyState
      icon={<Building2 size={48} strokeWidth={1.5} />}
      title="No properties yet"
      description="Add your first property to start managing your portfolio."
      action={
        <Link href="/app/properties/new">
          <Button variant="primary" icon={<Plus size={16} />}>
            Add Property
          </Button>
        </Link>
      }
    />
  );
}
