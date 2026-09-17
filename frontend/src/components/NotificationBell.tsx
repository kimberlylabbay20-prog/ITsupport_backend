import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Bell } from "lucide-react";
import { getNotificationSummary, reportHighCritical } from "../services/notificationService";

function formatCount(count: number): string {
  return count > 99 ? "99+" : String(count);
}

export default function NotificationBell() {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const load = () =>
      getNotificationSummary()
        .then(({ report }) => {
          if (!active) return;
          setCount(
            report.total_open_tickets + reportHighCritical(report)
          );
        })
        .catch(() => {
          if (active) setCount(0);
        });

    load();
    const timer = window.setInterval(load, 60000);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <button
      onClick={() => navigate("/notifications")}
      title="View notifications"
      className="relative p-2 text-text-muted hover:text-text-dark hover:bg-gray-100 rounded-lg transition-colors"
    >
      <Bell size={18} />
      {count !== null && count > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {formatCount(count)}
        </span>
      )}
    </button>
  );
}