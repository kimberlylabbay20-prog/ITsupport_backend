import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  RefreshCw,
  Loader2,
  AlertCircle,
  Inbox,
  BellRing,
  Ticket,
  AlertCircle as AlertIcon,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
} from "lucide-react";
import Layout from "../layouts/Layout";
import StatCard from "../components/StatCard";
import {
  getNotificationSummary,
  buildNotifications,
  reportHighCritical,
  reportTotal,
  type NotificationItem,
  type NotificationKind,
} from "../services/notificationService";
import type { NotificationSummary } from "../services/notificationService";

type FilterKind = "all" | NotificationKind;

const FILTERS: { key: FilterKind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New Tickets" },
  { key: "assignment", label: "Assignments" },
  { key: "resolved", label: "Resolved" },
  { key: "high_critical", label: "High/Critical" },
  { key: "pending", label: "Pending" },
];

const KIND_STYLE: Record<
  NotificationKind,
  { icon: React.ReactNode; bg: string; color: string }
> = {
  new: { icon: <BellRing size={16} />, bg: "bg-primary-50", color: "text-primary-600" },
  pending: { icon: <AlertIcon size={16} />, bg: "bg-amber-50", color: "text-amber-500" },
  high_critical: { icon: <AlertTriangle size={16} />, bg: "bg-red-50", color: "text-red-500" },
  resolved: { icon: <CheckCircle2 size={16} />, bg: "bg-emerald-50", color: "text-emerald-600" },
  assignment: { icon: <UserPlus size={16} />, bg: "bg-blue-50", color: "text-blue-600" },
  update: { icon: <Ticket size={16} />, bg: "bg-gray-50", color: "text-gray-500" },
  other: { icon: <Ticket size={16} />, bg: "bg-gray-50", color: "text-gray-500" },
};

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

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [data, setData] = useState<NotificationSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKind>("all");

  const [toast, setToast] = useState<"shown" | null>(null);

  const load = (showLoader = true) => {
    if (showLoader) setLoading(true);
    setError(null);
    return getNotificationSummary()
      .then(setData)
      .catch(() => setError("Failed to load notifications."))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const items = useMemo(
    () => (data ? buildNotifications(data.activities) : []),
    [data]
  );

  const filtered = useMemo(
    () => (filter === "all" ? items : items.filter((i) => i.kind === filter)),
    [items, filter]
  );

  const report = data?.report ?? null;

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">Notifications</h1>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-[12px] text-text-muted">
            <span className="cursor-pointer hover:text-primary-500 transition-colors">
              Notifications
            </span>
            <ChevronRight size={12} />
            <span className="text-text-dark font-medium">All</span>
          </div>
          <button
            onClick={() => {
              load(false);
              setToast("shown");
              window.setTimeout(() => setToast(null), 2000);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-primary-500" size={28} />
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <AlertCircle className="text-red-400 mb-2" size={28} />
          <p className="text-[13px] text-text-muted">{error}</p>
          <button
            onClick={() => load()}
            className="mt-3 px-4 py-2 rounded-lg text-[13px] font-medium text-primary-600 bg-primary-50 hover:bg-primary-100 transition-colors"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <StatCard
              title="Total Tickets"
              value={reportTotal(report!)}
              icon={<Ticket size={20} />}
              color="text-primary-500"
              bgColor="bg-primary-50"
            />
            <StatCard
              title="Pending (Open) Tickets"
              value={report!.total_open_tickets}
              icon={<AlertIcon size={20} />}
              color="text-amber-500"
              bgColor="bg-amber-50"
            />
            <StatCard
              title="High/Critical Priority"
              value={reportHighCritical(report!)}
              icon={<AlertTriangle size={20} />}
              color="text-red-500"
              bgColor="bg-red-50"
            />
            <StatCard
              title="Resolved Tickets"
              value={report!.total_resolved_tickets}
              icon={<CheckCircle2 size={20} />}
              color="text-emerald-500"
              bgColor="bg-emerald-50"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {FILTERS.map((f) => {
              const active = filter === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key)}
                  className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors border ${
                    active
                      ? "bg-primary-500 text-white border-primary-500"
                      : "bg-white text-text-dark border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          {/* List */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                  <Inbox className="text-gray-300" size={28} />
                </div>
                <p className="text-[14px] font-semibold text-text-dark">
                  No notifications here
                </p>
                <p className="text-[13px] text-text-muted mt-1">
                  {items.length === 0
                    ? "There is no activity data to show yet."
                    : "Try a different filter."}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {filtered.map((item) => {
                  const style = KIND_STYLE[item.kind];
                  return (
                    <li
                      key={item.key}
                      onClick={() =>
                        item.ticket_id !== null &&
                        navigate("/tickets/all")
                      }
                      className={`flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors ${
                        item.ticket_id !== null ? "cursor-pointer" : ""
                      }`}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${style.bg}`}
                      >
                        <span className={style.color}>{style.icon}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-text-dark">
                          {item.title}
                        </p>
                        {item.detail && (
                          <p className="text-[12px] text-text-muted truncate mt-0.5">
                            {item.detail}
                          </p>
                        )}
                        <p className="text-[11px] text-text-muted mt-1">
                          {item.actor} · {formatTime(item.timestamp)}
                        </p>
                      </div>
                      {item.ticket_id !== null && (
                        <span className="text-[11px] font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded-full flex-shrink-0">
                          #{item.ticket_id}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {toast === "shown" && (
            <p className="mt-3 text-[12px] text-emerald-600">
              Notifications refreshed.
            </p>
          )}
          <p className="mt-3 text-[11px] text-text-muted">
            Built from live report and activity data. Not real-time.
          </p>
        </>
      )}
    </Layout>
  );
}