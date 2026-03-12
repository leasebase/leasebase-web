"use client";

import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { PropertyForm } from "@/components/properties/PropertyForm";
import { createProperty } from "@/services/properties/propertyService";
import type { CreatePropertyDTO } from "@/services/properties/types";
import { authStore } from "@/lib/auth/store";

export default function CreatePropertyPage() {
  const router = useRouter();
  const { user } = authStore();

  // Only owner can create properties
  if (user?.persona !== "owner") {
    return <div className="text-sm text-slate-400">You do not have permission to create properties.</div>;
  }

  const handleSubmit = async (data: CreatePropertyDTO) => {
    const result = await createProperty(data);
    router.push(`/app/properties/${result.data.id}`);
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Properties", href: "/app/properties" },
          { label: "New Property" },
        ]}
        className="mb-4"
      />
      <PageHeader
        title="Add Property"
        description="Create a new property in your portfolio."
      />
      <div className="mt-6 max-w-2xl">
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          <PropertyForm
            onSubmit={handleSubmit}
            onCancel={() => router.push("/app/properties")}
          />
        </div>
      </div>
    </>
  );
}
