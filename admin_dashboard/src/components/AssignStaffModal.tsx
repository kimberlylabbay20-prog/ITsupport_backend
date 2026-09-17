import { useState } from "react";
import { X, Loader2, Inbox, UserCheck } from "lucide-react";
import type { User } from "../types/auth";
import {
  assignTicket,
  getErrorMessage,
  type Ticket,
} from "../services/ticketService";

interface AssignStaffModalProps {
  ticket: Ticket;
  staff: User[];
  onAssigned: (ticket: Ticket) => void;
  onClose: () => void;
  notify: (type: "success" | "error", message: string) => void;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AssignStaffModal({
  ticket,
  staff,
  onAssigned,
  onClose,
  notify,
}: AssignStaffModalProps) {
  const [busyId, setBusyId] = useState<number | null>(null);

  const handleAssign = async (userId: number) => {
    if (busyId !== null) return;
    setBusyId(userId);
    try {
      const updated = await assignTicket(ticket.ticket_id, userId);
      onAssigned(updated);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to assign ticket."));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="text-[16px] font-bold text-text-dark">
              Assign Staff
            </h3>
            <p className="text-[13px] text-text-muted mt-0.5">
              Ticket #{ticket.ticket_id} — {ticket.title}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-dark hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Staff list */}
        <div className="px-6 py-5">
          {staff.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-2">
                <Inbox className="text-gray-300" size={24} />
              </div>
              <p className="text-[13px] text-text-muted">
                No staff members available to assign.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {staff.map((user) => {
                const isCurrent = user.user_id === ticket.assigned_to;
                const isBusy = busyId === user.user_id;
                return (
                  <li key={user.user_id}>
                    <button
                      onClick={() => handleAssign(user.user_id)}
                      disabled={busyId !== null}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-colors ${
                        isCurrent
                          ? "bg-primary-50 border-primary-200"
                          : "bg-gray-50 border-gray-100 hover:bg-primary-50 hover:border-primary-200"
                      } ${busyId !== null ? "opacity-60 cursor-not-allowed" : ""}`}
                    >
                      <div className="w-9 h-9 rounded-full bg-primary-500 text-white flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                        {initials(user.full_name || user.username)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-text-dark truncate">
                          {user.full_name || user.username}
                          {isCurrent && (
                            <span className="ml-2 text-[11px] font-semibold text-primary-600">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-[12px] text-text-muted truncate">
                          {user.username} · {user.email}
                        </p>
                      </div>
                      {isBusy ? (
                        <Loader2 size={16} className="text-primary-500 animate-spin flex-shrink-0" />
                      ) : (
                        <UserCheck size={16} className="text-text-muted flex-shrink-0" />
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}