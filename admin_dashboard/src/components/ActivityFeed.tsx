import type { ReactNode } from "react";
import {
  Loader2,
  AlertCircle,
  Inbox,
  FilePlus2,
  ArrowLeftRight,
  Pencil,
  UserPlus,
  CheckCircle2,
  Trash2,
  StickyNote,
  Zap,
  Activity,
} from "lucide-react";
import type { Activity as ActivityRecord } from "../services/activityService";

export interface ActivityFeedProps {
  activities: ActivityRecord[] | null;
  loading: boolean;
  error: string | null;
}

function formatTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toneFor(type: string): { icon: ReactNode; chip: string } {
  switch (type) {
    case "ticket_created":
      return {
        icon: <FilePlus2 size={14} />,
        chip: "bg-blue-50 text-blue-600",
      };
    case "status_changed":
      return {
        icon: <ArrowLeftRight size={14} />,
        chip: "bg-amber-50 text-amber-600",
      };
    case "priority_changed":
      return { icon: <Zap size={14} />, chip: "bg-orange-50 text-orange-600" };
    case "ticket_assigned":
      return {
        icon: <UserPlus size={14} />,
        chip: "bg-blue-50 text-blue-600",
      };
    case "ticket_resolved":
      return {
        icon: <CheckCircle2 size={14} />,
        chip: "bg-emerald-50 text-emerald-600",
      };
    case "ticket_deleted":
      return { icon: <Trash2 size={14} />, chip: "bg-red-50 text-red-600" };
    case "ticket_updated":
      return {
        icon: <Pencil size={14} />,
        chip: "bg-blue-50 text-blue-600",
      };
    case "work_note":
    case "admin_note":
      return {
        icon: <StickyNote size={14} />,
        chip: "bg-teal-50 text-teal-600",
      };
    default:
      return {
        icon: <Activity size={14} />,
        chip: "bg-gray-100 text-gray-600",
      };
  }
}

function actionLabel(type: string): string {
  switch (type) {
    case "ticket_created":
      return "Ticket Submitted";
    case "status_changed":
      return "Status Changed";
    case "priority_changed":
      return "Priority Changed";
    case "ticket_assigned":
      return "Staff Assigned";
    case "ticket_resolved":
      return "Ticket Resolved";
    case "ticket_deleted":
      return "Ticket Deleted";
    case "ticket_updated":
      return "Ticket Updated";
    case "work_note":
      return "Work Note";
    case "admin_note":
      return "Admin Note";
    default:
      return type
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
  }
}

function buildDetail(a: ActivityRecord): string {
  if (a.activity_type === "work_note" || a.activity_type === "admin_note") {
    return a.message ?? "—";
  }
  const oldV = a.old_value;
  const newV = a.new_value;
  const pair = (key: string): string | null =>
    oldV?.[key] !== undefined &&
    newV?.[key] !== undefined &&
    oldV[key] !== newV[key]
      ? `${oldV[key]} → ${newV[key]}`
      : null;

  if (a.activity_type === "ticket_created") {
    return (newV?.title as string) ?? `Ticket #${a.ticket_id} created`;
  }
  if (a.activity_type === "status_changed") {
    return pair("status") ?? `→ ${newV?.status ?? ""}`;
  }
  if (a.activity_type === "priority_changed") {
    return pair("priority") ?? `→ ${newV?.priority ?? ""}`;
  }
  if (a.activity_type === "ticket_assigned") {
    const to = newV?.assigned_to;
    return to !== undefined ? `Assigned to user #${to}` : "—";
  }
  if (a.activity_type === "ticket_updated") {
    const keys = ["category_id", "title", "description", "priority", "status"];
    const changed = keys
      .filter((k) => oldV?.[k] !== newV?.[k])
      .map((k) => pair(k) ?? `${k}: ${newV?.[k]}`)
      .join(" · ");
    return changed || "—";
  }
  return "—";
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-gray-100 animate-pulse" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3.5 bg-gray-100 rounded animate-pulse w-1/3" />
            <div className="h-3 bg-gray-100 rounded animate-pulse w-2/3" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ActivityFeed({
  activities,
  loading,
  error,
}: ActivityFeedProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-[14px] font-semibold text-text-dark mb-4">
        Ticket History &amp; Activity
      </h3>

      {loading ? (
        <SkeletonRows />
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <AlertCircle className="text-red-400 mb-2" size={28} />
          <p className="text-[13px] text-text-muted">{error}</p>
        </div>
      ) : activities === null || activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
            <Inbox className="text-gray-300" size={28} />
          </div>
          <p className="text-[14px] font-semibold text-text-dark">
            No activity recorded yet
          </p>
          <p className="text-[13px] text-text-muted mt-1">
            Ticket submissions, status changes and notes will appear here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                {["Time", "Action", "Performed By", "Detail"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activities.map((activity) => {
                const tone = toneFor(activity.activity_type);
                const actor =
                  activity.performed_by?.username ?? activity.author ?? "System";
                const ticketLabel =
                  activity.ticket_id !== null ? `#${activity.ticket_id}` : "—";
                return (
                  <tr
                    key={activity.activity_id}
                    className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-[12px] text-text-muted whitespace-nowrap">
                      {formatTime(activity.timestamp)}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center ${tone.chip} flex-shrink-0`}
                        >
                          {tone.icon}
                        </span>
                        <span className="text-[13px] font-medium text-text-dark">
                          {actionLabel(activity.activity_type)}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark whitespace-nowrap">
                      {actor}
                      <span className="text-text-muted"> · {ticketLabel}</span>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted max-w-[320px]">
                      <p className="truncate">{buildDetail(activity)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}