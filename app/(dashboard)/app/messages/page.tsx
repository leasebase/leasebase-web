"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { MessageSquare } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Messages" description="Communicate with tenants, owners, and vendors." />
      <EmptyState
        icon={<MessageSquare size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant will have access."
        className="mt-8"
      />
    </>
  );
}
