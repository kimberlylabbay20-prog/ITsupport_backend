import { useState } from "react";
import { X, Loader2, MessageSquarePlus } from "lucide-react";
import {
  addTicketNote,
  getErrorMessage,
} from "../services/ticketService";

interface AddNoteModalProps {
  ticketId: number;
  onClose: () => void;
  notify: (type: "success" | "error", message: string) => void;
  onNoteAdded: () => void;
}

export default function AddNoteModal({
  ticketId,
  onClose,
  notify,
  onNoteAdded,
}: AddNoteModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const message = text.trim();
    if (!message || submitting) return;
    setSubmitting(true);
    try {
      await addTicketNote(ticketId, message);
      notify("success", "Note added to ticket.");
      onNoteAdded();
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to add note."));
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <MessageSquarePlus size={18} className="text-primary-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-dark">Add Note</h3>
              <p className="text-[13px] text-text-muted mt-0.5">
                Internal note for Ticket #{ticketId}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-text-muted hover:text-text-dark hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            autoFocus
            rows={5}
            maxLength={2000}
            placeholder="Write an internal note about this ticket..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark placeholder:text-text-light focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300 resize-none"
          />
          <p className="text-[11px] text-text-muted mt-1.5 text-right">
            {text.length}/2000
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !text.trim()}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {submitting && <Loader2 size={14} className="animate-spin" />}
            Save Note
          </button>
        </div>
      </div>
    </div>
  );
}