import { useState } from "react";
import {
  ChevronRight,
  Loader2,
  UserCog,
} from "lucide-react";
import Layout from "../layouts/Layout";
import { useAuth } from "../context/AuthContext";
import { updateUser } from "../services/userService";
import { getCurrentUser } from "../services/authService";
import { getErrorMessage } from "../services/api";
import Toast, { type ToastState } from "../components/Toast";

const inputClass =
  "w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-text-dark focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-300";

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  staff: "bg-blue-50 text-blue-600",
  user: "bg-gray-100 text-gray-600",
};

export default function SettingsPage() {
  const { user, login } = useAuth();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState<ToastState>(null);
  const [toastTimer, setToastTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const notify = (type: "success" | "error", message: string) => {
    if (toastTimer) clearTimeout(toastTimer);
    setToast({ type, message });
    const t = setTimeout(() => setToast(null), 3500);
    setToastTimer(t);
  };

  if (!user) return null;

  const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  const initials =
    (user.full_name || user.username)
      .split(" ")
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const canSave = fullName.trim() !== "" && username.trim() !== "" && email.trim() !== "";

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        full_name: fullName.trim(),
        username: username.trim(),
        email: email.trim(),
      };
      if (password.trim().length > 0) {
        payload.password = password.trim();
      }
      await updateUser(user.user_id, payload);
      const refreshed = await getCurrentUser();
      login(refreshed);
      notify("success", "Profile updated.");
      setEditing(false);
      setPassword("");
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update profile."));
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setFullName(user.full_name);
    setUsername(user.username);
    setEmail(user.email);
    setPassword("");
    setEditing(false);
  };

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">Settings</h1>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className="cursor-pointer hover:text-primary-500 transition-colors">
            Settings
          </span>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">Profile</span>
        </div>
      </div>

      <div className="max-w-2xl">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="px-6 py-5 border-b border-gray-100 bg-gray-50/40">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-primary-500 text-white flex items-center justify-center text-[16px] font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <p className="text-[16px] font-bold text-text-dark">
                  {user.full_name}
                </p>
                <p className="text-[13px] text-text-muted mt-0.5">
                  @{user.username}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      ROLE_BADGE[user.role] ?? "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {roleLabel}
                  </span>
                  {user.is_active ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Profile Body */}
          {!editing ? (
            <div className="px-6 py-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                <InfoItem label="Full Name">{user.full_name}</InfoItem>
                <InfoItem label="Username">@{user.username}</InfoItem>
                <InfoItem label="Email">{user.email}</InfoItem>
                <InfoItem label="Role">{roleLabel}</InfoItem>
                <InfoItem label="Status">
                  {user.is_active ? "Active" : "Inactive"}
                </InfoItem>
                <InfoItem label="User ID">#{user.user_id}</InfoItem>
              </div>
              <div className="mt-6">
                <button
                  onClick={() => setEditing(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium text-white bg-primary-500 hover:bg-primary-600 transition-colors"
                >
                  <UserCog size={15} />
                  Edit Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="px-6 py-5 space-y-4">
              <Field label="Full Name *">
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className={inputClass}
                  autoFocus
                />
              </Field>
              <Field label="Username *">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Email *">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
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
              <div className="flex items-center gap-2.5 pt-2">
                <button
                  onClick={handleCancel}
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
          )}
        </div>
      </div>

      <Toast toast={toast} />
    </Layout>
  );
}

function InfoItem({
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