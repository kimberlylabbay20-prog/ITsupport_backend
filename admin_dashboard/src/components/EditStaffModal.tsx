import { useState } from "react";
import { X, Loader2, UserCog } from "lucide-react";
import type { User } from "../types/auth";
import { updateUser } from "../services/userService";
import { getErrorMessage } from "../services/api";

interface EditStaffModalProps {
  staff: User;
  onClose: () => void;
  notify: (type: "success" | "error", message: string) => void;
  onUpdated: (user: User) => void;
}

const inputClass =
  "w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300";

export default function EditStaffModal({
  staff,
  onClose,
  notify,
  onUpdated,
}: EditStaffModalProps) {
  const [fullName, setFullName] = useState(staff.full_name);
  const [username, setUsername] = useState(staff.username);
  const [email, setEmail] = useState(staff.email);
  const [saving, setSaving] = useState(false);

  const canSave =
    fullName.trim() !== "" && username.trim() !== "" && email.trim() !== "";

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const updated = await updateUser(staff.user_id, {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
      });
      notify("success", `${updated.full_name} updated.`);
      onUpdated(updated);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update staff member."));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <UserCog size={18} className="text-primary-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-dark">
                Edit Staff
              </h3>
              <p className="text-[13px] text-text-muted mt-0.5">
                Staff ID #{staff.user_id}
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
        <div className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2.5 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}