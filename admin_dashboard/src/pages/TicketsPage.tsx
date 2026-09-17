import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Search,
  ChevronDown,
  Eye,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import Layout from "../layouts/Layout";
import type { User } from "../types/auth";
import {
  getAdminTickets,
  getUsers,
  getCategories,
  type Ticket,
} from "../services/ticketService";
import { PriorityBadge, StatusBadge } from "../components/TicketBadges";
import TicketDetailModal from "../components/TicketDetailModal";
import TicketActions from "../components/TicketActions";
import Toast, { type ToastState } from "../components/Toast";

const STATUS_OPTIONS = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITY_OPTIONS = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

const selectClass =
  "appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-3 pr-8 py-2 text-[13px] text-text-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300";

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

function resolveName(id: number | null, users: Record<number, User>): string {
  if (id === null) return "Unassigned";
  const user = users[id];
  if (!user) return `User #${id}`;
  return user.full_name || user.username;
}

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 9 }).map((_, i) => (
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

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<Record<number, User>>({});
  const [categories, setCategories] = useState<Record<number, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);

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
        setTickets(ticketsData);

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
      })
      .catch(() => setError("Failed to load tickets."))
      .finally(() => setLoading(false));
  }, []);

  const categoryOptions = useMemo(() => {
    return Object.entries(categories).sort((a, b) =>
      a[1].localeCompare(b[1])
    );
  }, [categories]);

  const staff = useMemo(() => {
    return Object.values(users)
      .filter((u) => u.role === "staff")
      .sort((a, b) => a.full_name.localeCompare(b.full_name));
  }, [users]);

  const handleTicketUpdated = useMemo(
    () => (updated: Ticket) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.ticket_id === updated.ticket_id ? updated : t
        )
      );
    },
    []
  );

  const handleTicketDeleted = useMemo(
    () => (deletedId: number) => {
      setTickets((prev) =>
        prev.filter((t) => t.ticket_id !== deletedId)
      );
    },
    []
  );

  const filteredTickets = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter)
        return false;
      if (
        categoryFilter !== "ALL" &&
        t.category_id !== Number(categoryFilter)
      )
        return false;
      if (!q) return true;

      const creator = users[t.user_id];
      const assignee = t.assigned_to ? users[t.assigned_to] : null;
      const category = categories[t.category_id] ?? "";
      return (
        String(t.ticket_id).includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (creator?.full_name ?? "").toLowerCase().includes(q) ||
        (creator?.username ?? "").toLowerCase().includes(q) ||
        category.toLowerCase().includes(q) ||
        (assignee?.full_name ?? "").toLowerCase().includes(q) ||
        t.priority.toLowerCase().includes(q) ||
        t.status.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, statusFilter, priorityFilter, categoryFilter, users, categories]);

  const hasAnyFilters =
    search.trim() !== "" ||
    statusFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    categoryFilter !== "ALL";

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
          <span className="text-text-dark font-medium">All Tickets</span>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search ticket ID, user, title..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300"
            />
          </div>

          {/* Status */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>

          {/* Priority */}
          <div className="relative">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Priorities</option>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>

          {/* Category */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className={selectClass}
            >
              <option value="ALL">All Categories</option>
              {categoryOptions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
          </div>
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
              {Array.from({ length: 7 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="text-red-400 mb-2" size={28} />
            <p className="text-[13px] text-text-muted">{error}</p>
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Inbox className="text-gray-300" size={28} />
            </div>
            <p className="text-[14px] font-semibold text-text-dark">
              {hasAnyFilters ? "No tickets match your filters" : "No tickets yet"}
            </p>
            <p className="text-[13px] text-text-muted mt-1">
              {hasAnyFilters
                ? "Try adjusting the search or filter criteria."
                : "Tickets will appear here once they are created."}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <TableHeader />
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredTickets.map((ticket) => {
                const creator = users[ticket.user_id];
                const assigneeName = resolveName(ticket.assigned_to, users);
                return (
                  <tr
                    key={ticket.ticket_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-primary-600">
                      #{ticket.ticket_id}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark">
                      {creator?.full_name || creator?.username || `User #${ticket.user_id}`}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark max-w-[220px]">
                      <p className="truncate">{ticket.title}</p>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted">
                      {categories[ticket.category_id] ??
                        `Category #${ticket.category_id}`}
                    </td>
                    <td className="px-4 py-3.5">
                      <PriorityBadge priority={ticket.priority} />
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={ticket.status} />
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark">
                      {assigneeName}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted whitespace-nowrap">
                      {formatDate(ticket.created_at)}
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <TicketActions
                          ticket={ticket}
                          staff={staff}
                          onTicketUpdated={handleTicketUpdated}
                          notify={notify}
                        />
                        <button
                          onClick={() => setSelectedTicketId(ticket.ticket_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors"
                        >
                          <Eye size={14} />
                          View
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
      {["Ticket ID", "User", "Title", "Category", "Priority", "Status", "Assigned Staff", "Date", "Actions"].map(
        (h) => (
          <th
            key={h}
            className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wide text-text-muted"
          >
            {h}
          </th>
        )
      )}
    </tr>
  );
}