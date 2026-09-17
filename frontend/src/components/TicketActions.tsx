import { useState } from "react";
import { UserPlus, ChevronDown } from "lucide-react";
import type { User } from "../types/auth";
import {
  getErrorMessage,
  updateTicketPriority,
  updateTicketStatus,
  type Ticket,
  type TicketPriority,
  type TicketStatus,
} from "../services/ticketService";
import AssignStaffModal from "./AssignStaffModal";

const STATUS_OPTIONS: TicketStatus[] = [
  "OPEN",
  "IN_PROGRESS",
  "RESOLVED",
  "CLOSED",
];
const PRIORITY_OPTIONS: TicketPriority[] = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
];

interface TicketActionsProps {
  ticket: Ticket;
  staff: User[];
  onTicketUpdated: (ticket: Ticket) => void;
  notify: (type: "success" | "error", message: string) => void;
}

const selectBase =
  "appearance-none bg-gray-50 border border-gray-200 rounded-lg pl-2 pr-6 py-1.5 text-[12px] text-text-dark cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 disabled:opacity-50";

function MiniSelect({
  value,
  onChange,
  disabled,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={selectBase}
      >
        {children}
      </select>
      <ChevronDown
        size={12}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
      />
    </div>
  );
}

export default function TicketActions({
  ticket,
  staff,
  onTicketUpdated,
  notify,
}: TicketActionsProps) {
  const [busy, setBusy] = useState<"status" | "priority" | "assign" | null>(
    null
  );
  const [assignOpen, setAssignOpen] = useState(false);

  const handleStatus = async (status: string) => {
    if (status === ticket.status || busy) return;
    setBusy("status");
    try {
      const updated = await updateTicketStatus(
        ticket.ticket_id,
        status as TicketStatus
      );
      onTicketUpdated(updated);
      notify("success", `Status updated to ${status.replace("_", " ")}.`);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update status."));
    } finally {
      setBusy(null);
    }
  };

  const handlePriority = async (priority: string) => {
    if (priority === ticket.priority || busy) return;
    setBusy("priority");
    try {
      const updated = await updateTicketPriority(
        ticket.ticket_id,
        priority as TicketPriority
      );
      onTicketUpdated(updated);
      notify("success", `Priority updated to ${priority}.`);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update priority."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <MiniSelect
        value={ticket.status}
        onChange={handleStatus}
        disabled={busy !== null}
      >
        {STATUS_OPTIONS.map((s) => (
          <option key={s} value={s}>
            {s.replace("_", " ")}
          </option>
        ))}
      </MiniSelect>

      <MiniSelect
        value={ticket.priority}
        onChange={handlePriority}
        disabled={busy !== null}
      >
        {PRIORITY_OPTIONS.map((p) => (
          <option key={p} value={p}>
            {p}
          </option>
        ))}
      </MiniSelect>

      <button
        onClick={() => setAssignOpen(true)}
        disabled={busy !== null}
        title="Assign staff"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100 transition-colors disabled:opacity-50"
      >
        <UserPlus size={13} />
        Assign
      </button>

      {assignOpen && (
        <AssignStaffModal
          ticket={ticket}
          staff={staff}
          onAssigned={(updated) => {
            onTicketUpdated(updated);
            setAssignOpen(false);
            notify("success", "Ticket assigned to staff member.");
          }}
          onClose={() => setAssignOpen(false)}
          notify={notify}
        />
      )}
    </div>
  );
}