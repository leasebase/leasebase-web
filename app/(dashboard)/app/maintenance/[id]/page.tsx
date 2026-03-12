"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { PageHeader } from "@/components/ui/PageHeader";
import { ClipboardList } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import { TenantMaintenanceDetail, ManagerMaintenanceDetail } from "./_detail-views";

/* ═══════════════════════════════════════════════════════════════════════
   Page — persona router
   ═══════════════════════════════════════════════════════════════════════ */

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "tenant") return <TenantMaintenanceDetail />;
  if (user?.persona === "owner") return <ManagerMaintenanceDetail />;
  return (
    <>
      <PageHeader title="Work Order" description="View work order details." />
      <EmptyState icon={<ClipboardList size={48} strokeWidth={1.5} />} title="Coming soon" description="This section is under development." className="mt-8" />
    </>
  );
}
