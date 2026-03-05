"use client";

import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Settings } from "lucide-react";

export default function Page() {
  return (
    <>
      <PageHeader title="Settings" description="Manage your account, organization, and notification preferences." />
      <EmptyState
        icon={<Settings size={48} strokeWidth={1.5} />}
        title="Coming soon"
        description="This section is under development. propertyManager, owner, tenant will have access."
        className="mt-8"
      />
    </>
  );
}
