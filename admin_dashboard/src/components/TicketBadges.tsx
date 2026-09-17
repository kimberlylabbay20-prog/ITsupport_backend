const PRIORITY_STYLES: Record<string, string> = {
  CRITICAL: "bg-red-50 text-red-600",
  HIGH: "bg-orange-50 text-orange-600",
  MEDIUM: "bg-yellow-50 text-yellow-700",
  LOW: "bg-green-50 text-green-600",
};

const STATUS_STYLES: Record<string, string> = {
  OPEN: "bg-blue-50 text-blue-600",
  IN_PROGRESS: "bg-amber-50 text-amber-600",
  RESOLVED: "bg-green-50 text-green-700",
  CLOSED: "bg-gray-100 text-gray-600",
};

const baseClass =
  "inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold";

export function PriorityBadge({ priority }: { priority: string }) {
  return (
    <span
      className={`${baseClass} ${
        PRIORITY_STYLES[priority] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {priority}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`${baseClass} ${
        STATUS_STYLES[status] ?? "bg-gray-100 text-gray-600"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}