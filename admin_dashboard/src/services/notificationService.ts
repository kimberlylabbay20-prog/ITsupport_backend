import { getAdminReport, type AdminReport } from "./dashboardService";
import { getAdminActivity, type Activity } from "./activityService";

export interface NotificationSummary {
  report: AdminReport;
  activities: Activity[];
}

export async function getNotificationSummary(): Promise<NotificationSummary> {
  const [report, activities] = await Promise.all([
    getAdminReport(),
    getAdminActivity(),
  ]);
  return { report, activities };
}

export type NotificationKind =
  | "new"
  | "pending"
  | "high_critical"
  | "resolved"
  | "assignment"
  | "update"
  | "other";

export interface NotificationItem {
  key: string;
  kind: NotificationKind;
  activity_type: string;
  ticket_id: number | null;
  title: string;
  detail: string | null;
  actor: string;
  timestamp: string | null;
}

const HIGH_PRIORITIES = new Set(["HIGH", "CRITICAL"]);

function actorOf(activity: Activity): string {
  if (activity.performed_by?.username) {
    return activity.performed_by.username;
  }
  if (activity.author) {
    return activity.author;
  }
  return "System";
}

function classify(activity: Activity): NotificationItem {
  const ticketLabel =
    activity.ticket_id !== null ? `#${activity.ticket_id}` : "";
  const actor = actorOf(activity);
  const newValue = activity.new_value ?? {};
  const detail = (newValue.title as string | undefined) ?? null;

  switch (activity.activity_type) {
    case "ticket_created":
      return {
        key: activity.activity_id,
        kind: "new",
        activity_type: activity.activity_type,
        ticket_id: activity.ticket_id,
        title: `New ticket ${ticketLabel}`,
        detail,
        actor,
        timestamp: activity.timestamp,
      };
    case "ticket_assigned": {
      const assignedTo =
        (activity.new_value as Record<string, unknown> | null)?.[
          "assigned_to"
        ] ?? null;
      return {
        key: activity.activity_id,
        kind: "assignment",
        activity_type: activity.activity_type,
        ticket_id: activity.ticket_id,
        title: `Ticket ${ticketLabel} assigned`,
        detail: assignedTo ? `Assigned to ${assignedTo}` : null,
        actor,
        timestamp: activity.timestamp,
      };
    }
    case "ticket_resolved":
      return {
        key: activity.activity_id,
        kind: "resolved",
        activity_type: activity.activity_type,
        ticket_id: activity.ticket_id,
        title: `Ticket ${ticketLabel} resolved`,
        detail: null,
        actor,
        timestamp: activity.timestamp,
      };
    case "priority_changed": {
      const prio = (newValue.priority as string | undefined) ?? "";
      return {
        key: activity.activity_id,
        kind: HIGH_PRIORITIES.has(prio) ? "high_critical" : "update",
        activity_type: activity.activity_type,
        ticket_id: activity.ticket_id,
        title: `Priority of ticket ${ticketLabel} changed to ${prio}`,
        detail: null,
        actor,
        timestamp: activity.timestamp,
      };
    }
    case "status_changed": {
      const status = (newValue.status as string | undefined) ?? "";
      return {
        key: activity.activity_id,
        kind: status === "OPEN" ? "pending" : "update",
        activity_type: activity.activity_type,
        ticket_id: activity.ticket_id,
        title: `Ticket ${ticketLabel} status changed to ${status}`,
        detail: null,
        actor,
        timestamp: activity.timestamp,
      };
    }
    default:
      return {
        key: activity.activity_id,
        kind: "other",
        activity_type: activity.activity_type,
        ticket_id: activity.ticket_id,
        title: `${humanizeType(activity.activity_type)} ${ticketLabel}`.trim(),
        detail: activity.message,
        actor,
        timestamp: activity.timestamp,
      };
  }
}

function humanizeType(type: string): string {
  return type
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function buildNotifications(activities: Activity[]): NotificationItem[] {
  return activities.map(classify);
}

export function reportHighCritical(report: AdminReport): number {
  return (report.tickets_by_priority["HIGH"] ?? 0) +
    (report.tickets_by_priority["CRITICAL"] ?? 0);
}

export function reportTotal(report: AdminReport): number {
  return Object.values(report.tickets_by_category).reduce((a, b) => a + b, 0);
}