import { useState } from "react";
import { X, Loader2, UserCog } from "lucide-react";
import type { User } from "../types/auth";
import { updateUser } from "../services/userService";
import { getErrorMessage } from "../services/api";

interface EditUserModalProps {
  user: User;
  onClose: () => void;
  notify: (type: "success" | "error", message: string) => void;
  onUpdated: (user: User) => void;
}

const inputClass =
  "w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300";

const selectClass =
  "appearance-none w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-[13px] text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300";

export default function EditUserModal({
  user,
  onClose,
  notify,
  onUpdated,
}: EditUserModalProps) {
  const [fullName, setFullName] = useState(user.full_name);
  const [username, setUsername] = useState(user.username);
  const [email, setEmail] = useState(user.email);
  const [role, setRole] = useState(user.role);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const canSave =
    fullName.trim() !== "" && username.trim() !== "" && email.trim() !== "";

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
        role,
      };
      if (password.trim().length > 0) {
        payload.password = password.trim();
      }
      const updated = await updateUser(user.user_id, payload);
      notify("success", `${updated.full_name} updated.`);
      onUpdated(updated);
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update user."));
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[65] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-900/50"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary-50 flex items-center justify-center">
              <UserCog size={18} className="text-primary-500" />
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-dark">Edit User</h3>
              <p className="text-[13px] text-text-muted mt-0.5">
                User #{user.user_id}
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
          <Field label="Full Name">
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Username">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </Field>
          <Field label="Role">
            <div className="relative">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as User["role"])}
                className={selectClass}
              >
                <option value="user">User</option>
                <option value="staff">Staff</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </Field>
          <Field label="New Password (leave blank to keep current)">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 8 characters"
              className={inputClass}
            />
          </Field>
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[12px] font-semibold uppercase tracking-wide text-text-muted mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}