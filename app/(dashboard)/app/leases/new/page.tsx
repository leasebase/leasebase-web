"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { LeaseForm } from "@/components/leases/LeaseForm";
import { createLease } from "@/services/leases/leaseService";
import type { CreateLeaseDTO } from "@/services/leases/types";
import { authStore } from "@/lib/auth/store";

export default function CreateLeasePage() {
  const router = useRouter();
  const { user } = authStore();

  // Only owner and PM can create leases
  if (user?.persona !== "owner" && user?.persona !== "propertyManager") {
    return <div className="text-sm text-slate-400">You do not have permission to create leases.</div>;
  }

  const handleSubmit = async (data: CreateLeaseDTO) => {
    const result = await createLease(data);
    router.push(`/app/leases/${result.data.id}`);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Leases", href: "/app/leases" },
          { label: "New Lease" },
        ]}
        className="mb-4"
      />
      <PageHeader
        title="Create Lease"
        description="Create a new lease agreement — select property, unit, and terms."
      />
      <div className="mt-6 max-w-2xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <LeaseForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/app/leases")}
          />
        </div>
      </div>
    </>
  );
}
