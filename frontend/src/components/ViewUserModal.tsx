import { X } from "lucide-react";
import type { User as UserType } from "../types/auth";

interface ViewUserModalProps {
  user: UserType;
  onClose: () => void;
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-red-50 text-red-600",
  staff: "bg-blue-50 text-blue-600",
  user: "bg-gray-100 text-gray-600",
};

export default function ViewUserModal({ user, onClose }: ViewUserModalProps) {
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
            <div className="w-10 h-10 rounded-full bg-primary-500 text-white flex items-center justify-center text-[14px] font-bold flex-shrink-0">
              {initials(user.full_name || user.username)}
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-text-dark">
                {user.full_name || user.username}
              </h3>
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
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
            <InfoItem label="Full Name">
              {user.full_name || "—"}
            </InfoItem>
            <InfoItem label="Username">
              @{user.username}
            </InfoItem>
            <InfoItem label="Email">
              {user.email}
            </InfoItem>
            <InfoItem label="Role">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                  ROLE_BADGE[user.role] ?? "bg-gray-100 text-gray-600"
                }`}
              >
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </span>
            </InfoItem>
            <InfoItem label="Status">
              {user.is_active ? (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                  Inactive
                </span>
              )}
            </InfoItem>
            <InfoItem label="Joined">
              {formatDateTime(user.created_at)}
            </InfoItem>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-[13px] font-medium text-text-dark bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
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
      <div className="mt-1 text-[13px] text-text-dark">{children}</div>
    </div>
  );
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part.charAt(0))
    .slice(0, 2)
    .join("")
    .toUpperCase();
}