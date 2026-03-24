"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  Send, UserPlus, BellRing, BellOff, Paperclip, Image as ImageIcon,
  Clock, ArrowRight, MessageSquare, User, Wrench,
} from "lucide-react";
import {
  fetchMaintenanceDetail as fetchManagerDetail,
  fetchMaintenanceAttachments as fetchManagerAttachments,
  fetchMaintenanceTimeline as fetchManagerTimeline,
  postMaintenanceComment,
  updateMaintenanceStatus,
  assignMaintenanceWorkOrder,
  type MaintenanceWorkOrder,
  type MaintenanceAttachment,
  type TimelineEntry,
} from "@/services/maintenance/maintenanceApiService";
import {
  fetchMaintenanceDetail,
  fetchMaintenanceAttachments,
  fetchMaintenanceTimeline,
  addMaintenanceComment,
  cancelMaintenanceRequest,
} from "@/services/tenant/adapters/maintenanceAdapter";
import type { WorkOrderRow, WorkOrderAttachmentRow, TimelineEntryRow } from "@/services/tenant/types";
import {
  fetchSubscription,
  upsertSubscription,
  type Subscription,
} from "@/services/notifications/preferencesV2";
import { authStore } from "@/lib/auth/store";

/* ── Constants ─────────────────────────────────────────────────────── */

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

const OWNER_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ["IN_REVIEW", "CLOSED"],
  IN_REVIEW: ["SCHEDULED", "IN_PROGRESS", "CLOSED"],
  SCHEDULED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["COMPLETED", "CLOSED"],
  COMPLETED: ["CLOSED"],
};

const STATUS_LIFECYCLE = ["SUBMITTED", "IN_REVIEW", "SCHEDULED", "IN_PROGRESS", "COMPLETED", "CLOSED"];

const NEXT_STEP_MAP: Record<string, string> = {
  SUBMITTED: "Waiting for review",
  IN_REVIEW: "Being assessed by your property manager",
  SCHEDULED: "Work has been scheduled",
  IN_PROGRESS: "Work is underway",
  COMPLETED: "Pending final closure",
  CLOSED: "Request completed",
  CANCELLED: "Request was cancelled",
};

/* ── Shared hooks & components ─────────────────────────────────────── */

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
      const result = await upsertSubscription({ entity_type: "WORK_ORDER", entity_id: entityId, state: newState });
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
    <Button variant={isMuted ? "danger" : "secondary"} size="sm"
      icon={isMuted ? <BellOff size={14} /> : <BellRing size={14} />}
      loading={toggling} onClick={toggle}>
      {isMuted ? "Muted" : "Following"}
    </Button>
  );
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

/* ── Status Progress ──────────────────────────────────────────────── */

function StatusProgress({ status }: { status: string }) {
  const currentIdx = STATUS_LIFECYCLE.indexOf(status);
  if (status === "CANCELLED") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-500">Status:</span>
        <Badge variant="neutral">Cancelled</Badge>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        {STATUS_LIFECYCLE.map((s, i) => {
          const isActive = i <= currentIdx;
          const isCurrent = s === status;
          return (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`h-2 w-2 rounded-full ${isCurrent ? "bg-brand-500 ring-2 ring-brand-200" : isActive ? "bg-brand-400" : "bg-slate-200"}`} title={STATUS_LABELS[s]} />
              {i < STATUS_LIFECYCLE.length - 1 && <div className={`h-0.5 w-4 ${isActive ? "bg-brand-300" : "bg-slate-200"}`} />}
            </div>
          );
        })}
      </div>
      <div className="flex items-center gap-2 text-sm">
        <Badge variant={STATUS_VARIANTS[status] || "neutral"}>{STATUS_LABELS[status] || status}</Badge>
        <ArrowRight size={12} className="text-slate-400" />
        <span className="text-slate-500">{NEXT_STEP_MAP[status] || ""}</span>
      </div>
    </div>
  );
}

/* ── Timeline ─────────────────────────────────────────────────────── */

function TimelineIcon({ eventType }: { eventType: string }) {
  switch (eventType) {
    case "CREATED": return <Wrench size={14} className="text-brand-500" />;
    case "STATUS_CHANGED": return <ArrowRight size={14} className="text-blue-500" />;
    case "ASSIGNED": return <User size={14} className="text-purple-500" />;
    case "COMMENT_ADDED": return <MessageSquare size={14} className="text-slate-500" />;
    case "ATTACHMENT_ADDED": return <Paperclip size={14} className="text-emerald-500" />;
    default: return <Clock size={14} className="text-slate-400" />;
  }
}

function timelineLabel(entry: { event_type: string; actor_name: string; metadata: Record<string, unknown> }): string {
  switch (entry.event_type) {
    case "CREATED": return `${entry.actor_name} submitted this request`;
    case "STATUS_CHANGED": {
      const ns = STATUS_LABELS[entry.metadata.newStatus as string] || entry.metadata.newStatus;
      return `${entry.actor_name} changed status to ${ns}`;
    }
    case "ASSIGNED": {
      const name = (entry.metadata.assigneeName as string) || "someone";
      return `${entry.actor_name} assigned to ${name}`;
    }
    case "COMMENT_ADDED": return entry.actor_name;
    case "ATTACHMENT_ADDED": {
      const fn = (entry.metadata.fileName as string) || "a file";
      return `${entry.actor_name} attached ${fn}`;
    }
    default: return `${entry.actor_name} performed ${entry.event_type.toLowerCase().replace(/_/g, " ")}`;
  }
}

interface TimelineProps {
  timeline: Array<{ id: string; type: string; event_type: string; actor_name: string; metadata: Record<string, unknown>; created_at: string }>;
}

function WorkOrderTimeline({ timeline }: TimelineProps) {
  if (timeline.length === 0) return <p className="text-xs text-slate-500">No activity yet.</p>;
  return (
    <div className="space-y-0">
      {timeline.map((entry, i) => (
        <div key={entry.id} className="flex gap-3 py-2">
          <div className="flex flex-col items-center">
            <div className="mt-0.5 rounded-full bg-slate-100 p-1.5"><TimelineIcon eventType={entry.event_type} /></div>
            {i < timeline.length - 1 && <div className="flex-1 w-px bg-slate-200 mt-1" />}
          </div>
          <div className="flex-1 min-w-0 pb-2">
            {entry.event_type === "COMMENT_ADDED" && entry.metadata.comment ? (
              <>
                <p className="text-sm font-medium text-slate-700">{entry.actor_name}</p>
                <p className="text-sm text-slate-600 mt-0.5">{entry.metadata.comment as string}</p>
              </>
            ) : (
              <p className="text-sm text-slate-700">{timelineLabel(entry)}</p>
            )}
            <p className="text-xs text-slate-400 mt-0.5">{relativeTime(entry.created_at)}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Attachments ──────────────────────────────────────────────────── */

function AttachmentsList({ attachments }: { attachments: Array<{ id: string; file_url: string; file_type: string; file_name: string; uploader_name: string; created_at: string }> }) {
  if (attachments.length === 0) return null;
  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider">Attachments ({attachments.length})</h4>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {attachments.map((a) => (
          <a key={a.id} href={a.file_url} target="_blank" rel="noopener noreferrer"
            className="group flex flex-col items-center gap-1.5 rounded-lg border border-slate-200 p-3 transition-colors hover:border-brand-300 hover:bg-brand-50/50">
            {a.file_type.startsWith("image/") ? <ImageIcon size={24} className="text-slate-400 group-hover:text-brand-500" /> : <Paperclip size={24} className="text-slate-400 group-hover:text-brand-500" />}
            <p className="text-xs text-slate-600 truncate w-full text-center">{a.file_name}</p>
            <p className="text-xs text-slate-400">{relativeTime(a.created_at)}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Tenant detail — v2
   ═══════════════════════════════════════════════════════════════════ */

export function TenantMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<WorkOrderRow | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntryRow[]>([]);
  const [attachments, setAttachments] = useState<WorkOrderAttachmentRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [detailRes, timelineRes, attachRes] = await Promise.all([
          fetchMaintenanceDetail(id),
          fetchMaintenanceTimeline(id),
          fetchMaintenanceAttachments(id),
        ]);
        if (!cancelled) {
          if (detailRes.error) { setError(detailRes.error); return; }
          setItem(detailRes.data);
          setTimeline(timelineRes.data);
          setAttachments(attachRes.data);
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
      await addMaintenanceComment(id, newComment.trim());
      setNewComment("");
      const res = await fetchMaintenanceTimeline(id);
      setTimeline(res.data);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  async function handleCancel() {
    if (!confirm("Are you sure you want to cancel this request?")) return;
    setCancelling(true);
    try { const updated = await cancelMaintenanceRequest(id); setItem(updated); }
    catch (err: any) { setError(err?.message || "Failed to cancel"); }
    finally { setCancelling(false); }
  }

  if (isLoading) return <div className="space-y-3" aria-label="Loading work order"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!item) return null;

  return (
    <>
      <PageHeader title={item.title || "Work Order"} description="View your maintenance request details." />
      <div className="mt-6 space-y-6">
        <div className="flex justify-end"><FollowMuteButton entityId={id} /></div>

        {/* Detail card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <p className="text-sm text-slate-900" data-testid="wo-description">{item.description}</p>
          <StatusProgress status={item.status} />
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={PRIORITY_VARIANTS[item.priority] || "neutral"}>{item.priority}</Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
            {item.request_number && <span className="text-xs text-slate-400">{item.request_number}</span>}
          </div>
          <div className="grid grid-cols-2 gap-3 text-xs text-slate-500">
            <div><span className="font-medium text-slate-600">Submitted:</span> {new Date(item.submitted_at || item.created_at).toLocaleDateString()}</div>
            {item.scheduled_date && <div><span className="font-medium text-slate-600">Scheduled:</span> <span className="text-brand-600 font-medium">{new Date(item.scheduled_date).toLocaleDateString()}</span></div>}
            <div><span className="font-medium text-slate-600">Last update:</span> {relativeTime(item.updated_at)}</div>
          </div>
          {CANCELLABLE_STATUSES.includes(item.status) && (
            <Button variant="danger" size="sm" loading={cancelling} onClick={handleCancel}>Cancel Request</Button>
          )}
        </div>

        {/* Attachments */}
        {attachments.length > 0 && <div className="rounded-lg border border-slate-200 bg-white p-4"><AttachmentsList attachments={attachments} /></div>}

        {/* Timeline */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Activity</h3>
          <WorkOrderTimeline timeline={timeline} />
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()} placeholder="Add a comment…" aria-label="Add a comment"
              className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <Button variant="primary" size="sm" icon={<Send size={14} />} loading={submitting} onClick={handleAddComment}>Send</Button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Manager detail — v2
   ═══════════════════════════════════════════════════════════════════ */

export function ManagerMaintenanceDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = authStore();
  const [item, setItem] = useState<MaintenanceWorkOrder | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [attachments, setAttachments] = useState<MaintenanceAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);
  const [assigneeType, setAssigneeType] = useState<"self" | "external">("self");
  const [externalName, setExternalName] = useState("");
  const [assigning, setAssigning] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [detailRes, timelineRes, attachRes] = await Promise.all([
        fetchManagerDetail(id), fetchManagerTimeline(id), fetchManagerAttachments(id),
      ]);
      setItem(detailRes.data);
      setTimeline(timelineRes.data);
      setAttachments(attachRes.data);
      if (detailRes.data.assignee_name) {
        const isSelf = detailRes.data.assignee_id === user?.id;
        setAssigneeType(isSelf ? "self" : "external");
        if (!isSelf) setExternalName(detailRes.data.assignee_name || "");
      }
    } catch (e: any) { setError(e?.message || "Failed to load work order"); }
    finally { setIsLoading(false); }
  }, [id, user?.id]);

  useEffect(() => { loadData(); }, [loadData]);

  async function handleAddComment() {
    if (!newComment.trim()) return;
    setSubmitting(true);
    try {
      await postMaintenanceComment(id, newComment.trim());
      setNewComment("");
      const res = await fetchManagerTimeline(id);
      setTimeline(res.data);
    } catch { /* silent */ }
    finally { setSubmitting(false); }
  }

  async function handleStatusChange(status: string) {
    setStatusUpdating(status);
    try {
      const res = await updateMaintenanceStatus(id, status);
      setItem(res.data);
      const tlRes = await fetchManagerTimeline(id);
      setTimeline(tlRes.data);
    } catch { /* silent */ }
    finally { setStatusUpdating(null); }
  }

  async function handleAssign() {
    setAssigning(true);
    try {
      if (assigneeType === "self") {
        await assignMaintenanceWorkOrder(id, { assigneeId: user?.id, assigneeName: user?.name || "Owner", assigneeType: "self" });
      } else {
        const name = externalName.trim();
        if (!name) { setAssigning(false); return; }
        await assignMaintenanceWorkOrder(id, { assigneeName: name, assigneeType: "external" });
      }
      await loadData();
    } catch { /* silent */ }
    finally { setAssigning(false); }
  }

  if (isLoading) return <div className="space-y-3" aria-label="Loading work order"><Skeleton variant="text" className="h-8 w-64" /><Skeleton variant="text" className="h-40 w-full rounded-lg" /></div>;
  if (error) return <div className="rounded-md border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-700">{error}</div>;
  if (!item) return null;

  return (
    <>
      <PageHeader title={item.title || "Work Order"} description="Manage work order details." />
      <div className="mt-6 space-y-6">
        <div className="flex justify-end"><FollowMuteButton entityId={id} /></div>

        {/* Detail card */}
        <div className="rounded-lg border border-slate-200 bg-white p-4 space-y-4">
          <p className="text-sm text-slate-900" data-testid="wo-description">{item.description}</p>
          <StatusProgress status={item.status} />
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={PRIORITY_VARIANTS[item.priority] || "neutral"}>{item.priority}</Badge>
            <span className="text-xs text-slate-500">{item.category}</span>
            {item.request_number && <span className="text-xs text-slate-400">{item.request_number}</span>}
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs text-slate-500">
            <div><span className="font-medium text-slate-600">Submitted:</span> {new Date(item.submitted_at || item.created_at).toLocaleDateString()}</div>
            {item.scheduled_date && <div><span className="font-medium text-slate-600">Scheduled:</span> <span className="text-brand-600 font-medium">{new Date(item.scheduled_date).toLocaleDateString()}</span></div>}
            <div><span className="font-medium text-slate-600">Last update:</span> {relativeTime(item.updated_at)}</div>
          </div>
          {(item.property_name || item.unit_number) && (
            <p className="text-xs text-slate-500">{item.property_name}{item.unit_number ? ` · Unit ${item.unit_number}` : ""}</p>
          )}

          {/* Status controls */}
          {OWNER_TRANSITIONS[item.status] && (
            <div className="pt-2">
              <p className="text-xs font-medium text-slate-600 mb-2">Change status</p>
              <div className="flex gap-2 flex-wrap" role="group" aria-label="Status controls">
                {(OWNER_TRANSITIONS[item.status] || []).map((s) => (
                  <Button key={s} variant="secondary" size="sm" loading={statusUpdating === s} onClick={() => handleStatusChange(s)}>
                    {STATUS_LABELS[s] || s}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Assignment — v2 */}
          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-medium text-slate-600 mb-2">Assignment</p>
            {item.assignee_name && (
              <p className="text-sm text-slate-700 mb-2">
                <User size={14} className="inline mr-1 text-slate-400" />
                Currently assigned to: <span className="font-medium">{item.assignee_name}</span>
              </p>
            )}
            <div className="flex items-center gap-2 flex-wrap">
              <select value={assigneeType} onChange={(e) => setAssigneeType(e.target.value as "self" | "external")}
                className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500" aria-label="Assignee type">
                <option value="self">Self (me)</option>
                <option value="external">External contractor</option>
              </select>
              {assigneeType === "external" && (
                <input type="text" value={externalName} onChange={(e) => setExternalName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAssign()} placeholder="Contractor name…" aria-label="External contractor name"
                  className="w-48 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500" />
              )}
              <Button variant="secondary" size="sm" icon={<UserPlus size={14} />} loading={assigning} onClick={handleAssign}>Assign</Button>
            </div>
          </div>
        </div>

        {/* Attachments */}
        {attachments.length > 0 && <div className="rounded-lg border border-slate-200 bg-white p-4"><AttachmentsList attachments={attachments} /></div>}

        {/* Timeline */}
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h3 className="text-sm font-medium text-slate-600 mb-3">Activity</h3>
          <WorkOrderTimeline timeline={timeline} />
          <div className="flex gap-2 mt-4 pt-4 border-t border-slate-100">
            <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddComment()} placeholder="Add a comment…" aria-label="Add a comment"
              className="flex-1 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500" />
            <Button variant="primary" size="sm" icon={<Send size={14} />} loading={submitting} onClick={handleAddComment}>Send</Button>
          </div>
        </div>
      </div>
    </>
  );
}
