"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardList, Send } from "lucide-react";
import { authStore } from "@/lib/auth/store";
import {
  fetchPMMaintenanceItem,
  fetchPMMaintenanceComments,
  postPMMaintenanceComment,
  updatePMMaintenanceStatus,
} from "@/services/pm/pmApiService";
import type { PMCommentRow } from "@/services/pm/pmApiService";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "warning", IN_PROGRESS: "info", RESOLVED: "success", CLOSED: "neutral",
};

function PMMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<any>(null);
  const [comments, setComments] = useState<PMCommentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [itemRes, commentsRes] = await Promise.all([
          fetchPMMaintenanceItem(id),
          fetchPMMaintenanceComments(id),
        ]);
        if (!cancelled) { setItem(itemRes.data); setComments(commentsRes.data); }
      } catch (e: any) { if (!cancelled) setError(e.message); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await postPMMaintenanceComment(id, newComment.trim());
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  async function handleStatusChange(status: string) {
    try {
      const res = await updatePMMaintenanceStatus(id, status);
      setItem((prev: any) => ({ ...prev, ...res.data }));
    } catch { /* silent */ }
  }

  if (isLoading) return <div className="space-y-3"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!item) return null;

  return (
    <>
      <PageHeader title="Work Order" description={`${item.property_name} · Unit ${item.unit_number}`} />
      <div className="mt-6 space-y-6">
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm text-slate-900">{item.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[item.status] || "neutral"}>{item.status.replace("_", " ")}</Badge>
            <Badge variant={item.priority === "HIGH" ? "danger" : item.priority === "MEDIUM" ? "warning" : "neutral"}>{item.priority}</Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
          </div>
          <div className="flex gap-2 pt-2">
            {["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"].filter((s) => s !== item.status).map((s) => (
              <Button key={s} variant="secondary" size="sm" onClick={() => handleStatusChange(s)}>
                {s.replace("_", " ")}
              </Button>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Comments</h3>
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet.</p>
          ) : (
            <div className="space-y-3 mb-4">
              {comments.map((c) => (
                <div key={c.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm text-slate-700">{c.comment}</p>
                  <p className="text-xs text-slate-500 mt-1">{c.author_name} · {new Date(c.created_at).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
              placeholder="Add a comment…"
              className="flex-1 rounded-md border border-slate-200 bg-slate-800 px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <Button variant="primary" size="sm" icon={<Send size={14} />} loading={submitting} onClick={handleAddComment}>
              Send
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  const { user } = authStore();
  if (user?.persona === "propertyManager") return <PMMaintenanceDetail />;
  return (
    <>
      <PageHeader title="Work Order" description="View work order details." />
      <EmptyState icon={<ClipboardList size={48} strokeWidth={1.5} />} title="Coming soon" description="This section is under development." className="mt-8" />
    </>
  );
}
