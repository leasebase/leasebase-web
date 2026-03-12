"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Send, UserPlus } from "lucide-react";
import {
  fetchMaintenanceDetail as fetchManagerDetail,
  fetchMaintenanceComments as fetchManagerComments,
  postMaintenanceComment,
  updateMaintenanceStatus,
  assignMaintenanceWorkOrder,
  type MaintenanceWorkOrder,
  type MaintenanceComment,
} from "@/services/maintenance/maintenanceApiService";
import {
  fetchMaintenanceDetail,
  fetchMaintenanceComments,
  addMaintenanceComment,
} from "@/services/tenant/adapters/maintenanceAdapter";
import type { WorkOrderRow, WorkOrderCommentRow } from "@/services/tenant/types";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  OPEN: "warning", IN_PROGRESS: "info", RESOLVED: "success", CLOSED: "neutral",
};

const PRIORITY_VARIANTS: Record<string, "danger" | "warning" | "neutral"> = {
  HIGH: "danger", MEDIUM: "warning", LOW: "neutral",
};

/* ═══════════════════════════════════════════════════════════════════════
   Tenant detail — read-only view with comments
   ═══════════════════════════════════════════════════════════════════════ */

export function TenantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<WorkOrderRow | null>(null);
  const [comments, setComments] = useState<WorkOrderCommentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [detailRes, commentsRes] = await Promise.all([
          fetchMaintenanceDetail(id),
          fetchMaintenanceComments(id),
        ]);
        if (!cancelled) {
          if (detailRes.error) { setError(detailRes.error); return; }
          setItem(detailRes.data);
          setComments(commentsRes.data);
          if (commentsRes.error) { /* detail loaded, comments failed — show detail anyway */ }
        }
      } catch (e: any) { if (!cancelled) setError(e.message ?? "Failed to load"); }
      finally { if (!cancelled) setIsLoading(false); }
    }
    load();
    return () => { cancelled = true; };
  }, [id]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const row = await addMaintenanceComment(id, newComment.trim());
      setComments((prev) => [...prev, row]);
      setNewComment("");
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading work order">
        <Skeleton variant="text" className="h-8 w-64" />
        <Skeleton variant="text" className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!item) return null;

  return (
    <>
      <PageHeader title="Work Order" description="View your maintenance request details." />
      <div className="mt-6 space-y-6">
        {/* Detail card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm text-slate-900" data-testid="wo-description">{item.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[item.status] || "neutral"}>
              {item.status.replace("_", " ")}
            </Badge>
            <Badge variant={PRIORITY_VARIANTS[item.priority] || "neutral"}>
              {item.priority}
            </Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
          </div>
          <p className="text-xs text-slate-500">
            Submitted {new Date(item.created_at).toLocaleDateString()}
          </p>
        </div>

        {/* Comments section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Comments</h3>
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet.</p>
          ) : (
            <div className="space-y-3 mb-4" data-testid="comments-thread">
              {comments.map((c) => (
                <div key={c.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm text-slate-700">{c.comment}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {c.author_name} · {new Date(c.created_at).toLocaleString()}
                  </p>
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
              aria-label="Add a comment"
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

/* ═══════════════════════════════════════════════════════════════════════
   Manager detail — owner (status change, assignment, comments)
   Uses org-wide /api/maintenance endpoints (authorized for OWNER)
   ═══════════════════════════════════════════════════════════════════════ */

const ALL_STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"] as const;

export function ManagerMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<MaintenanceWorkOrder | null>(null);
  const [comments, setComments] = useState<MaintenanceComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Comments
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Status change
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  // Assignment
  const [assigneeInput, setAssigneeInput] = useState("");
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detailRes, commentsRes] = await Promise.all([
        fetchManagerDetail(id),
        fetchManagerComments(id),
      ]);
      setItem(detailRes.data);
      setComments(commentsRes.data);
      setAssigneeInput(detailRes.data.assigneeId || "");
    } catch (e: any) {
      setError(e?.message || "Failed to load work order");
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      const res = await postMaintenanceComment(id, newComment.trim());
      setComments((prev) => [...prev, res.data]);
      setNewComment("");
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  async function handleStatusChange(status: string) {
    setStatusUpdating(status);
    try {
      const res = await updateMaintenanceStatus(id, status);
      setItem(res.data);
    } catch { /* silent */ }
    finally { setStatusUpdating(null); }
  }

  async function handleAssign() {
    const trimmed = assigneeInput.trim();
    if (!trimmed || trimmed === item?.assigneeId) return;
    setAssigning(true);
    try {
      const res = await assignMaintenanceWorkOrder(id, trimmed);
      setItem(res.data);
    } catch { /* silent */ }
    finally { setAssigning(false); }
  }

  if (isLoading) {
    return (
      <div className="space-y-3" aria-label="Loading work order">
        <Skeleton variant="text" className="h-8 w-64" />
        <Skeleton variant="text" className="h-40 w-full rounded-lg" />
      </div>
    );
  }
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!item) return null;

  return (
    <>
      <PageHeader title="Work Order" description="Manage work order details." />
      <div className="mt-6 space-y-6">
        {/* Detail card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          <p className="text-sm text-slate-900" data-testid="wo-description">{item.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[item.status] || "neutral"}>
              {item.status.replace("_", " ")}
            </Badge>
            <Badge variant={PRIORITY_VARIANTS[item.priority] || "neutral"}>
              {item.priority}
            </Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
          </div>
          <p className="text-xs text-slate-500">
            Submitted {new Date(item.createdAt).toLocaleDateString()}
          </p>

          {/* Status controls */}
          <div className="pt-2">
            <p className="text-xs font-medium text-slate-600 mb-2">Change status</p>
            <div className="flex gap-2 flex-wrap" role="group" aria-label="Status controls">
              {ALL_STATUSES.filter((s) => s !== item.status).map((s) => (
                <Button
                  key={s}
                  variant="secondary"
                  size="sm"
                  loading={statusUpdating === s}
                  onClick={() => handleStatusChange(s)}
                >
                  {s.replace("_", " ")}
                </Button>
              ))}
            </div>
          </div>

          {/* Assignment controls */}
          <div className="pt-2">
            <p className="text-xs font-medium text-slate-600 mb-2">Assignee</p>
            <div className="flex gap-2 items-center">
              <input
                type="text"
                value={assigneeInput}
                onChange={(e) => setAssigneeInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAssign()}
                placeholder="Enter assignee ID…"
                aria-label="Assignee ID"
                className="w-64 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <Button
                variant="secondary"
                size="sm"
                icon={<UserPlus size={14} />}
                loading={assigning}
                onClick={handleAssign}
              >
                Assign
              </Button>
            </div>
            {item.assigneeId && (
              <p className="text-xs text-slate-500 mt-1">Currently assigned: {item.assigneeId}</p>
            )}
          </div>
        </div>

        {/* Comments section */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Comments</h3>
          {comments.length === 0 ? (
            <p className="text-xs text-slate-500">No comments yet.</p>
          ) : (
            <div className="space-y-3 mb-4" data-testid="comments-thread">
              {comments.map((c) => (
                <div key={c.id} className="border-l-2 border-slate-200 pl-3">
                  <p className="text-sm text-slate-700">{c.comment}</p>
                  <p className="text-xs text-slate-500 mt-1">
                    {c.authorName} · {new Date(c.createdAt).toLocaleString()}
                  </p>
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
              aria-label="Add a comment"
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
