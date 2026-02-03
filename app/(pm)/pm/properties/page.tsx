"use client";

import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable } from "@/components/ui/DataTable";
import { Modal } from "@/components/ui/Modal";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { usePmProperties } from "@/lib/api/hooks";
import { api } from "@/lib/api/http";
import type { Property } from "@/lib/api/types";
import Link from "next/link";

export default function PropertiesPage() {
  const { data, loading, error } = usePmProperties();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const toast = useToast();

  const onCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/pm/properties", { name, address });
      toast.show("Property created (refresh to see it in the list).");
      setOpen(false);
      setName("");
      setAddress("");
    } catch (err: any) {
      toast.show(err?.message || "Failed to create property");
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Properties"
        description="Manage your properties and units."
        actions={
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
          >
            New property
          </button>
        }
      />

      {loading && <p className="text-sm text-slate-300">Loading properties…</p>}
      {error && (
        <p className="text-sm text-red-400">Failed to load properties: {error.message}</p>
      )}

      {data && (
        <DataTable<Property>
          columns={[
            {
              key: "name",
              header: "Name",
              render: (p) => (
                <Link
                  href={`/pm/properties/${p.id}`}
                  className="text-emerald-400 hover:underline"
                >
                  {p.name}
                </Link>
              )
            },
            { key: "address", header: "Address" },
            { key: "city", header: "City" },
            { key: "state", header: "State" },
            { key: "unitCount", header: "Units" }
          ]}
          rows={data}
          getRowId={(row) => row.id}
          emptyMessage="No properties yet. Create your first property to get started."
        />
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create property"
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-slate-600 px-3 py-1.5 text-xs text-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="create-property-form"
              className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
            >
              Create
            </button>
          </>
        }
      >
        <form id="create-property-form" className="space-y-3" onSubmit={onCreate}>
          <FormField label="Name">
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>
          <FormField label="Address">
            <input
              className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
            />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
