import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronRight,
  Eye,
  ToggleLeft,
  ToggleRight,
  Loader2,
  AlertCircle,
  Inbox,
} from "lucide-react";
import Layout from "../layouts/Layout";
import type { User } from "../types/auth";
import { getAllUsers, updateUser } from "../services/userService";
import { getErrorMessage } from "../services/api";
import { getAdminReport } from "../services/dashboardService";
import EditStaffModal from "../components/EditStaffModal";
import Toast, { type ToastState } from "../components/Toast";

function SkeletonRow() {
  return (
    <tr className="border-b border-gray-100">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3.5">
          <div
            className="h-4 bg-gray-100 rounded animate-pulse"
            style={{ width: i === 1 ? "55%" : "64px" }}
          />
        </td>
      ))}
    </tr>
  );
}

export default function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [assignedMap, setAssignedMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [togglingId, setTogglingId] = useState<number | null>(null);

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
    Promise.all([getAllUsers(), getAdminReport()])
      .then(([usersData, report]) => {
        setUsers(usersData);
        setAssignedMap(report?.tickets_by_assigned_staff ?? {});
      })
      .catch(() => setError("Failed to load staff."))
      .finally(() => setLoading(false));
  }, []);

  const staff = useMemo(() => {
    return users
      .filter((u) => u.role === "staff")
      .sort((a, b) => a.user_id - b.user_id);
  }, [users]);

  const handleUpdated = (updated: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.user_id === updated.user_id ? updated : u))
    );
  };

  const handleToggleActive = async (user: User) => {
    const nextActive = !user.is_active;
    if (togglingId !== null) return;
    setTogglingId(user.user_id);
    try {
      const updated = await updateUser(user.user_id, {
        is_active: nextActive,
      });
      handleUpdated(updated);
      notify(
        "success",
        `${updated.full_name} ${
          updated.is_active ? "activated" : "deactivated"
        }.`
      );
    } catch (e) {
      notify("error", getErrorMessage(e, "Failed to update status."));
    } finally {
      setTogglingId(null);
    }
  };

  const buttonClass =
    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors disabled:opacity-50";

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">
          Staff Management
        </h1>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className="cursor-pointer hover:text-primary-500 transition-colors">
            Staff
          </span>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">All Staff</span>
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
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonRow key={i} />
              ))}
            </tbody>
          </table>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <AlertCircle className="text-red-400 mb-2" size={28} />
            <p className="text-[13px] text-text-muted">{error}</p>
          </div>
        ) : staff.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
              <Inbox className="text-gray-300" size={28} />
            </div>
            <p className="text-[14px] font-semibold text-text-dark">
              No staff members yet
            </p>
            <p className="text-[13px] text-text-muted mt-1">
              Staff users with the staff role will appear here.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <TableHeader />
            </thead>
            <tbody className="divide-y divide-gray-100">
              {staff.map((member) => {
                const assigned =
                  assignedMap[member.username] ?? 0;
                return (
                  <tr
                    key={member.user_id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3.5 text-[13px] font-semibold text-primary-600">
                      #{member.user_id}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center text-[12px] font-semibold flex-shrink-0">
                          {initials(member.full_name || member.username)}
                        </div>
                        <span className="text-[13px] font-medium text-text-dark">
                          {member.full_name || member.username}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-dark">
                      @{member.username}
                    </td>
                    <td className="px-4 py-3.5 text-[13px] text-text-muted">
                      {member.email}
                    </td>
                    <td className="px-4 py-3.5">
                      {member.is_active ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-600">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg text-[12px] font-semibold bg-gray-50 text-text-dark">
                        {assigned}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setEditingUser(member)}
                          disabled={togglingId !== null}
                          className={`${buttonClass} text-primary-600 bg-primary-50 border border-primary-200 hover:bg-primary-100`}
                        >
                          <Eye size={14} />
                          View / Edit
                        </button>
                        <button
                          onClick={() => handleToggleActive(member)}
                          disabled={togglingId !== null}
                          className={`${buttonClass} ${
                            member.is_active
                              ? "text-red-600 bg-red-50 border border-red-200 hover:bg-red-100"
                              : "text-emerald-600 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100"
                          }`}
                        >
                          {togglingId === member.user_id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : member.is_active ? (
                            <ToggleLeft size={14} />
                          ) : (
                            <ToggleRight size={14} />
                          )}
                          {member.is_active ? "Deactivate" : "Activate"}
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

      {editingUser !== null && (
        <EditStaffModal
          staff={editingUser}
          onClose={() => setEditingUser(null)}
          notify={notify}
          onUpdated={(updated) => {
            handleUpdated(updated);
            setEditingUser(null);
          }}
        />
      )}

      <Toast toast={toast} />
    </Layout>
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

function TableHeader() {
  return (
    <tr className="border-b border-gray-100 bg-gray-50/60">
      {[
        "Staff ID",
        "Name",
        "Username",
        "Email",
        "Status",
        "Assigned Tickets",
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