import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, CheckCircle2, StickyNote, Trash2 } from "lucide-react";
import type { User } from "../types/auth";
import {
  getAdminTicket,
  getErrorMessage,
  resolveTicket,
  type Ticket,
} from "../services/ticketService";
import { PriorityBadge, StatusBadge } from "./TicketBadges";
import TicketActions from "./TicketActions";
import AddNoteModal from "./AddNoteModal";
import DeleteTicketModal from "./DeleteTicketModal";

interface TicketDetailModalProps {
  ticketId: number;
  users: Record<number, User>;
  categories: Record<number, string>;
  staff: User[];
  onTicketUpdated: (ticket: Ticket) => void;
  onDeleted: (ticketId: number) => void;
  notify: (type: "success" | "error", message: string) => void;
  onClose: () => void;
}

function resolveName(id: number | null, users: Record<number, User>): string {
  if (id === null) return "Unassigned";
  const user = users[id];
  if (!user) return `User #${id}`;
  return user.full_name || user.username;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function TicketDetailModal({
  ticketId,
  users,
  categories,
  staff,
  onTicketUpdated,
  onDeleted,
  notify,
  onClose,
}: TicketDetailModalProps) {
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [resolving, setResolving] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getAdminTicket(ticketId)
      .then((data) => {
        if (active) setTicket(data);
      })
      .catch(() => {
        if (active) setError("Failed to load ticket details.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [ticketId]);

  const handleApplyUpdated = (updated: Ticket) => {
    setTicket(updated);
    onTicketUpdated(updated);
  };

  const handleResolve = async () => {
    if (!ticket || resolving) return;
    setResolving(true);
    try {
      const updated = await resolveTicket(ticket.ticket_id);
      handleApplyUpdated(updated);
      notify("success", "Ticket resolved.");
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to resolve ticket."));
    } finally {
      setResolving(false);
    }
  };

  const handleNoteAdded = () => {
    setNoteOpen(false);
    getAdminTicket(ticketId)
      .then(setTicket)
      .catch(() => undefined);
  };

  const actionButtonClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          {ticket ? (
            <div>
              <h3 className="text-[16px] font-bold text-text-dark">
                Ticket #{ticket.ticket_id}
              </h3>
              <p className="text-[13px] text-text-muted mt-0.5">{ticket.title}</p>
            </div>
          ) : (
            <h3 className="text-[16px] font-bold text-text-dark">
              Ticket #{ticketId}
            </h3>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-dark hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="animate-spin text-primary-500" size={28} />
              <p className="text-[13px] text-text-muted mt-3">Loading ticket...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <AlertCircle className="text-red-400 mb-2" size={28} />
              <p className="text-[13px] text-text-muted">{error}</p>
            </div>
          ) : ticket ? (
            <div>
              <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <PriorityBadge priority={ticket.priority} />
                  <StatusBadge status={ticket.status} />
                </div>
                <TicketActions
                  ticket={ticket}
                  staff={staff}
                  onTicketUpdated={handleApplyUpdated}
                  notify={notify}
                />
              </div>

              <div className="flex items-center gap-2 mb-5">
                {ticket.status !== "RESOLVED" && (
                  <button
                    onClick={handleResolve}
                    disabled={resolving}
                    className={`${actionButtonClass} text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100`}
                  >
                    {resolving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => setNoteOpen(true)}
                  disabled={resolving}
                  className={`${actionButtonClass} text-amber-600 bg-amber-50 border border-amber-200 hover:bg-amber-100`}
                >
                  <StickyNote size={14} />
                  Add Note
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                <DetailItem label="User">
                  {resolveName(ticket.user_id, users)}
                </DetailItem>
                <DetailItem label="Category">
                  {categories[ticket.category_id] ?? `Category #${ticket.category_id}`}
                </DetailItem>
                <DetailItem label="Assigned Staff">
                  {resolveName(ticket.assigned_to, users)}
                </DetailItem>

                <DetailItem label="Created">
                  {formatDateTime(ticket.created_at)}
                </DetailItem>
                <DetailItem label="Updated">
                  {formatDateTime(ticket.updated_at)}
                </DetailItem>
                <DetailItem label="Resolved">
                  {formatDateTime(ticket.resolved_at)}
                </DetailItem>
              </div>

              <div className="mt-5">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Description
                </p>
                <div className="mt-1.5 bg-gray-50 border border-gray-100 rounded-lg p-3.5 text-[13px] text-text-dark whitespace-pre-wrap">
                  {ticket.description}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100">
          <button
            onClick={() => setDeleteOpen(true)}
            disabled={loading || !!error}
            className={`${actionButtonClass} text-red-600 bg-red-50 border border-red-200 hover:bg-red-100`}
          >
            <Trash2 size={14} />
            Delete
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {noteOpen && ticket && (
        <AddNoteModal
          ticketId={ticket.ticket_id}
          onClose={() => setNoteOpen(false)}
          notify={notify}
          onNoteAdded={handleNoteAdded}
        />
      )}

      {deleteOpen && (
        <DeleteTicketModal
          ticketId={ticketId}
          onClose={() => setDeleteOpen(false)}
          notify={notify}
          onDeleted={(id) => {
            setDeleteOpen(false);
            onDeleted(id);
            onClose();
          }}
        />
      )}
    </div>
  );
}

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
        {label}
      </p>
      <p className="mt-1 text-[13px] text-text-dark">{children}</p>
    </div>
  );
}