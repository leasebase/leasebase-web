"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormField } from "@/components/ui/FormField";
import { useToast } from "@/components/ui/Toast";
import { api, toApiError } from "@/lib/api/http";
import type { WorkOrder, WorkOrderComment } from "@/lib/api/types";

interface Combined {
  workOrder: WorkOrder;
  comments: WorkOrderComment[];
}

export default function TenantMaintenanceDetailPage() {
  const params = useParams<{ workOrderId: string }>();
  const toast = useToast();
  const [state, setState] = useState<{
    data: Combined | null;
    loading: boolean;
    error: string | null;
  }>({ data: null, loading: true, error: null });
  const [comment, setComment] = useState("");

  const load = async () => {
    try {
      const res = await api.get<Combined>(`/tenant/maintenance/${params.workOrderId}`);
      setState({ data: res.data, loading: false, error: null });
    } catch (err) {
      const e = toApiError(err);
      setState({ data: null, loading: false, error: e.message });
    }
  };

  useEffect(() => {
    load();
  }, []);

  const addComment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/tenant/maintenance/${params.workOrderId}/comments`, {
        message: comment
      });
      setComment("");
      toast.show("Comment added.");
      load();
    } catch (err) {
      const e = toApiError(err);
      toast.show(e.message);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={state.data?.workOrder.title || "Maintenance request"}
        description="View details and comment on your maintenance request."
      />
      {state.loading && <p className="text-sm text-slate-300">Loading request…</p>}
      {state.error && <p className="text-sm text-red-400">{state.error}</p>}
      {state.data && (
        <>
          <p className="text-sm text-slate-200">Status: {state.data.workOrder.status}</p>
          <div className="mt-4 space-y-2">
            <h2 className="text-sm font-semibold text-slate-200">Comments</h2>
            <ul className="space-y-1 text-xs text-slate-200">
              {state.data.comments.map((c) => (
                <li key={c.id} className="rounded bg-slate-900/70 px-2 py-1">
                  <span className="font-medium">{c.authorEmail}</span>: {c.message}
                </li>
              ))}
              {!state.data.comments.length && (
                <li className="text-slate-400">No comments yet.</li>
              )}
            </ul>
            <form className="mt-2 space-y-2" onSubmit={addComment}>
              <FormField label="Add comment">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  className="w-full rounded-md border border-slate-700 bg-slate-900 px-2 py-1 text-sm"
                  rows={3}
                  required
                />
              </FormField>
              <button
                type="submit"
                className="rounded-md bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-600"
              >
                Post comment
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
