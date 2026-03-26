"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Send, UserPlus, BellRing, BellOff } from "lucide-react";
import {
  fetchMaintenanceDetail as fetchManagerDetail,
  fetchMaintenanceComments as fetchManagerComments,
  postMaintenanceComment,
  updateMaintenanceStatus,
  assignMaintenanceWorkOrder,
  cancelMaintenanceWorkOrder,
  type MaintenanceWorkOrder,
  type MaintenanceComment,
} from "@/services/maintenance/maintenanceApiService";
import {
  fetchMaintenanceDetail,
  fetchMaintenanceComments,
  addMaintenanceComment,
  cancelMaintenanceRequest,
} from "@/services/tenant/adapters/maintenanceAdapter";
import type { WorkOrderRow, WorkOrderCommentRow } from "@/services/tenant/types";
import {
  fetchSubscription,
  upsertSubscription,
  type Subscription,
} from "@/services/notifications/preferencesV2";

const STATUS_VARIANTS: Record<string, "success" | "warning" | "danger" | "info" | "neutral"> = {
  SUBMITTED: "warning", IN_REVIEW: "info", SCHEDULED: "info",
  IN_PROGRESS: "info", COMPLETED: "success", CLOSED: "neutral", CANCELLED: "neutral",
};

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted", IN_REVIEW: "In Review", SCHEDULED: "Scheduled",
  IN_PROGRESS: "In Progress", COMPLETED: "Completed", CLOSED: "Closed", CANCELLED: "Cancelled",
};

const PRIORITY_VARIANTS: Record<string, "danger" | "warning" | "neutral"> = {
  URGENT: "danger", HIGH: "danger", MEDIUM: "warning", LOW: "neutral",
};

const CANCELLABLE_STATUSES = ["SUBMITTED", "IN_REVIEW"];

/** Owner status transitions — server-enforced. */
const OWNER_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["IN_REVIEW", "CLOSED"],
  IN_REVIEW: ["SCHEDULED", "IN_PROGRESS", "CLOSED"],
  SCHEDULED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["COMPLETED", "CLOSED"],
  COMPLETED: ["CLOSED"],
};

/* ═══════════════════════════════════════════════════════════════════════
   Tenant detail — read-only view with comments
   ═══════════════════════════════════════════════════════════════════════ */

function useFollowMute(entityId: string) {
  const [sub, setSub] = useState<Subscription | null>(null);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchSubscription("WORK_ORDER", entityId).then(setSub).catch(() => {});
  }, [entityId]);

  const toggle = useCallback(async () => {
    setToggling(true);
    try {
      const newState = sub?.state === "muted" ? "following" : "muted";
      const result = await upsertSubscription({
        entity_type: "WORK_ORDER",
        entity_id: entityId,
        state: newState,
      });
      setSub(result);
    } catch { /* silent */ }
    finally { setToggling(false); }
  }, [entityId, sub]);

  return { sub, toggling, toggle };
}

function FollowMuteButton({ entityId }: { entityId: string }) {
  const { sub, toggling, toggle } = useFollowMute(entityId);
  const isMuted = sub?.state === "muted";
  return (
    <Button
      variant={isMuted ? "danger" : "secondary"}
      size="sm"
      icon={isMuted ? <BellOff size={14} /> : <BellRing size={14} />}
      loading={toggling}
      onClick={toggle}
    >
      {isMuted ? "Muted" : "Following"}
    </Button>
  );
}

export function TenantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<WorkOrderRow | null>(null);
  const [comments, setComments] = useState<WorkOrderCommentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

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

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    setCancelling(true);
    try {
      const updated = await cancelMaintenanceRequest(id);
      setItem(updated);
    } catch (err: any) {
      setError(err?.message || "Failed to cancel");
    } finally { setCancelling(false); }
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
        {/* Follow/mute control */}
        <div className="flex justify-end">
          <FollowMuteButton entityId={id} />
        </div>
        {/* Detail card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          {item.title && <p className="text-sm font-semibold text-slate-900">{item.title}</p>}
          <p className="text-sm text-slate-900" data-testid="wo-description">{item.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[item.status] || "neutral"}>
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
            <Badge variant={PRIORITY_VARIANTS[item.priority] || "neutral"}>
              {item.priority}
            </Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
            {item.request_number && <span className="text-xs text-slate-400">{item.request_number}</span>}
          </div>
          <p className="text-xs text-slate-500">
            Submitted {new Date(item.submitted_at || item.created_at).toLocaleDateString()}
          </p>
          {CANCELLABLE_STATUSES.includes(item.status) && (
            <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>
              Cancel Request
            </Button>
          )}
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
              className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
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

/* ═════════════════════════════════════════════════════════════════════
   Manager detail
   Uses org-wide /api/maintenance endpoints (authorized for OWNER)
   ═══════════════════════════════════════════════════════════════════════ */

const ALL_STATUSES = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CLOSED", "CANCELLED"] as const;

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
      setAssigneeInput(detailRes.data.assignee_id || "");
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
    if (!trimmed || trimmed === item?.assignee_id) return;
    setAssigning(true);
    try {
      const res = await assignMaintenanceWorkOrder(id, { assigneeId: trimmed });
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
        {/* Follow/mute control */}
        <div className="flex justify-end">
          <FollowMuteButton entityId={id} />
        </div>
        {/* Detail card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-3">
          {item.title && <p className="text-sm font-semibold text-slate-900">{item.title}</p>}
          <p className="text-sm text-slate-900" data-testid="wo-description">{item.description}</p>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_VARIANTS[item.status] || "neutral"}>
              {STATUS_LABELS[item.status] || item.status}
            </Badge>
            <Badge variant={PRIORITY_VARIANTS[item.priority] || "neutral"}>
              {item.priority}
            </Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
            {item.request_number && <span className="text-xs text-slate-400">{item.request_number}</span>}
          </div>
          <p className="text-xs text-slate-500">
            Submitted {new Date(item.submitted_at || item.created_at).toLocaleDateString()}
          </p>
          {item.scheduled_date && (
            <p className="text-xs text-slate-500">Scheduled: {new Date(item.scheduled_date).toLocaleDateString()}</p>
          )}
          {item.assignee_name && (
            <p className="text-xs text-slate-500">Assigned to: {item.assignee_name}</p>
          )}

          {/* Status controls — only show valid transitions */}
          {OWNER_TRANSITIONS[item.status] && (
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-600 mb-2">Change status</p>
              <div className="flex gap-2 flex-wrap" role="group" aria-label="Status controls">
                {(OWNER_TRANSITIONS[item.status] || []).map((s) => (
                  <Button
                    key={s}
                    variant="secondary"
                    size="sm"
                    loading={statusUpdating === s}
                    onClick={() => handleStatusChange(s)}
                  >
                    {STATUS_LABELS[s] || s}
                  </Button>
                ))}
              </div>
            </div>
          )}

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
            {item.assignee_id && (
              <p className="text-xs text-slate-500 mt-1">Currently assigned: {item.assignee_id}</p>
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
              className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400"
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
