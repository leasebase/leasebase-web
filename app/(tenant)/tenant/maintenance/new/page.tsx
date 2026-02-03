"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";

export default function NewMaintenancePage() {
  const router = useRouter();
  const toast = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let documentId: string | undefined;
      if (file) {
        const { data } = await api.post<{ uploadUrl: string; documentId: string }>(
          "/tenant/maintenance/photos/upload-url",
          { name: file.name, type: file.type }
        );
        await fetch(data.uploadUrl, { method: "PUT", body: file });
        documentId = data.documentId;
      }
      const res = await api.post<{ id: string }>("/tenant/maintenance", {
        title,
        description,
        documentId
      });
      toast.show("Maintenance request created.");
      router.push(`/tenant/maintenance/${res.data.id}`);
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="New maintenance request"
        description="Describe the issue and optionally attach a photo."
      />
      <form className="space-y-3 max-w-lg" onSubmit={submit}>
        <FormField label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <FormField label="Description">
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            rows={3}
            required
          />
        </FormField>
        <FormField label="Photo" hint="Optional">
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-xs text-slate-300"
          />
        </FormField>
        <button
          type="submit"
          className="rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Submit request
        </button>
      </form>
    </div>
  );
}
