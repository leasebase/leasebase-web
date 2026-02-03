"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";

export default function NewLeasePage() {
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    propertyId: "",
    unitId: "",
    tenantEmail: "",
    rentAmount: "",
    depositAmount: "",
    startDate: "",
    endDate: ""
  });

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        rentAmount: Number(form.rentAmount || 0),
        depositAmount: form.depositAmount ? Number(form.depositAmount) : undefined
      };
      const res = await api.post("/pm/leases", payload);
      toast.show("Lease created.");
      const id = res.data?.id;
      router.push(id ? `/pm/leases/${id}` : "/pm/leases");
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Create lease"
        description="Set up a lease for a property and unit, with rent and dates."
      />
      <form className="space-y-3 max-w-lg" onSubmit={onSubmit}>
        <FormField label="Property ID">
          <input
            name="propertyId"
            value={form.propertyId}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <FormField label="Unit ID">
          <input
            name="unitId"
            value={form.unitId}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <FormField label="Tenant email">
          <input
            name="tenantEmail"
            type="email"
            value={form.tenantEmail}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <FormField label="Monthly rent">
          <input
            name="rentAmount"
            type="number"
            step="0.01"
            value={form.rentAmount}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <FormField label="Deposit" hint="Optional">
          <input
            name="depositAmount"
            type="number"
            step="0.01"
            value={form.depositAmount}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          />
        </FormField>
        <FormField label="Start date">
          <input
            name="startDate"
            type="date"
            value={form.startDate}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
            required
          />
        </FormField>
        <FormField label="End date" hint="Optional">
          <input
            name="endDate"
            type="date"
            value={form.endDate}
            onChange={onChange}
            className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
          />
        </FormField>
        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded-md bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-60"
        >
          {submitting ? "Creating…" : "Create lease"}
        </button>
      </form>
    </div>
  );
}
