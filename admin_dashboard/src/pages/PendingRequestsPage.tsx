import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Eye,
  Check,
  X,
  Loader2,
  AlertCircle,
  Inbox,
  Hourglass,
} from "lucide-react";
import Layout from "../layouts/Layout";
import type { User } from "../types/auth";
import {
  getAdminTickets,
  getUsers,
  getCategories,
  updateTicketStatus,
  getErrorMessage,
  type Ticket,
} from "../services/ticketService";
import { PriorityBadge } from "../components/TicketBadges";
import TicketDetailModal from "../components/TicketDetailModal";
import Toast, { type ToastState } from "../components/Toast";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 bg-gray-100 rounded animate-pulse"
            style={{ width: i === 2 ? "70%" : i === 0 ? "48px" : "64px" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function PendingRequestsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [busyKey, setBusyKey] = useState<string | null>(null);

  const [toast, setToast] = useState<ToastState>(null);
  const toastTimer = useRef<number | null>(null);

  const notify = useMemo(
    () => (type: "success" | "error", message: string) => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
      setToast({ type, message });
      toastTimer.current = window.setTimeout(() => setToast(null), 3500);
    },
    []
  );

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    Promise.all([getAdminTickets(), getUsers(), getCategories()])
      .then(([ticketsData, usersData, categoriesData]) => {
        const userMap: Record<number, User> = {};
        usersData.forEach((u) => {
          userMap[u.user_id] = u;
        });
        setUsers(userMap);

        const categoryMap: Record<number, string> = {};
        categoriesData.forEach((c) => {
          categoryMap[c.category_id] = c.name;
        });
        setCategories(categoryMap);

        setTickets(ticketsData);
      })
      .catch(() => setError("Failed to load pending requests."))
      .finally(() => setLoading(false));
  }, []);

  const staff = useMemo(() => {
    return Object.values(users)
      .filter((u) => u.role === "staff")
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [users]);

  const pendingTickets = useMemo(() => {
    return tickets.filter((t) => t.status === "OPEN");
  }, [tickets]);

  const handleApprove = async (ticket: Ticket) => {
    const key = `${ticket.ticket_id}:approve`;
    if (busyKey) return;
    setBusyKey(key);
    try {
      await updateTicketStatus(ticket.ticket_id, "IN_PROGRESS");
      setTickets((prev) =>
        prev.filter((t) => t.ticket_id !== ticket.ticket_id)
      );
      notify("success", `Ticket #${ticket.ticket_id} approved.`);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to approve ticket."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleDecline = async (ticket: Ticket) => {
    const key = `${ticket.ticket_id}:decline`;
    if (busyKey) return;
    setBusyKey(key);
    try {
      await updateTicketStatus(ticket.ticket_id, "CLOSED");
      setTickets((prev) =>
        prev.filter((t) => t.ticket_id !== ticket.ticket_id)
      );
      notify("success", `Ticket #${ticket.ticket_id} declined.`);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to decline ticket."));
    } finally {
      setBusyKey(null);
    }
  };

  const handleTicketUpdated = (updated: Ticket) => {
    setTickets((prev) =>
      prev.map((t) => (t.ticket_id === updated.ticket_id ? updated : t))
    );
  };

  const handleTicketDeleted = (deletedId: number) => {
    setTickets((prev) =>
      prev.filter((t) => t.ticket_id !== deletedId)
    );
  };

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">
          Tickets Management
        </h1>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className="cursor-pointer hover:text-primary-500 transition-colors">
            Tickets
          </span>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">Pending Requests</span>
        </div>
      </div>

      {/* Summary Banner */}
      <div className="flex items-center gap-3 bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
        <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
          <Hourglass size={18} className="text-amber-500" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-text-dark">
            {loading
              ? "Loading pending requests..."
              : `${pendingTickets.length} pending request${
                  pendingTickets.length === 1 ? "" : "s"
                } awaiting review`}
          </p>
          <p className="text-[12px] text-text-muted">
            Review newly submitted tickets and approve or decline them.
          </p>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <table className="w-full">
            <thead>
              <TableHeader />
            </thead>
            <tbody>
              {Array.from({ length: 5 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="text-red-400 mb-2" size={28} />
            <p className="text-[13px] text-text-muted">{error}</p>
          </div>
        ) : pendingTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
              <Check className="text-emerald-500" size={28} />
            </div>
            <p className="text-[14px] font-semibold text-text-dark">
              All caught up
            </p>
            <p className="text-[13px] text-text-muted mt-1">
              There are no pending requests awaiting review.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <TableHeader />
            </thead>
            <tbody className="divide-y divide-gray-100">
              {pendingTickets.map((ticket) => {
                const creator = users[ticket.user_id];
                const isBusy =
                  busyKey === `${ticket.ticket_id}:approve` ||
                  busyKey === `${ticket.ticket_id}:decline`;
                return (
                  <tr
                    key={ticket.ticket_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-primary-600">
                      #{ticket.ticket_id}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark">
                      {creator?.full_name ||
                        creator?.username ||
                        `User #${ticket.user_id}`}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark max-w-[240px]">
                      <p className="truncate">{ticket.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted">
                      {categories[ticket.category_id] ??
                        `Category #${ticket.category_id}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedTicketId(ticket.ticket_id)}
                          disabled={busyKey !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors disabled:opacity-50"
                        >
                          <Eye size={14} />
                          View
                        </button>
                        <button
                          onClick={() => handleApprove(ticket)}
                          disabled={busyKey !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 transition-colors disabled:opacity-50"
                        >
                          {busyKey === `${ticket.ticket_id}:approve` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Check size={14} />
                          )}
                          Approve
                        </button>
                        <button
                          onClick={() => handleDecline(ticket)}
                          disabled={busyKey !== null}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 transition-colors disabled:opacity-50"
                        >
                          {busyKey === `${ticket.ticket_id}:decline` ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <X size={14} />
                          )}
                          Decline
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {selectedTicketId !== null && (
        <TicketDetailModal
          ticketId={selectedTicketId}
          users={users}
          categories={categories}
          staff={staff}
          onTicketUpdated={handleTicketUpdated}
          onDeleted={handleTicketDeleted}
          notify={notify}
          onClose={() => setSelectedTicketId(null)}
        />
      )}

      <Toast toast={toast} />
    </Layout>
  );
}

function TableHeader() {
  return (
    <tr className="border-b border-gray-100 bg-gray-50/60">
      {[
        "Ticket ID",
        "User",
        "Title",
        "Category",
        "Priority",
        "Date Submitted",
        "Actions",
      ].map((h) => (
        <th
          key={h}
          className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted"
        >
          {h}
        </th>
      ))}
    </tr>
  );
}