import { useEffect, useState } from "react";
import { ChevronRight, Loader2, AlertCircle, Inbox } from "lucide-react";
import Layout from "../layouts/Layout";
import { StatCardsRow } from "../components/StatCard";
import { PriorityChart, StaffChart } from "../components/Charts";
import ActivityFeed from "../components/ActivityFeed";
import { getAdminReport, type AdminReport } from "../services/dashboardService";
import {
  getAdminActivity,
  type Activity,
} from "../services/activityService";

function LoadingSkeleton() {
  return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-primary-500" size={28} />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 text-center">
      <AlertCircle className="text-red-400 mb-2" size={28} />
      <p className="text-[13px] text-text-muted">{message}</p>
    </div>
  );
}

function EmptyChart({ title }: { title: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-[14px] font-semibold text-text-dark mb-4">{title}</h3>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Inbox className="text-gray-300" size={28} />
        </div>
        <p className="text-[13px] text-text-muted">No data available</p>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activities, setActivities] = useState<Activity[] | null>(null);
  const [activityLoading, setActivityLoading] = useState(true);
  const [activityError, setActivityError] = useState<string | null>(null);

  useEffect(() => {
    getAdminReport()
      .then(setReport)
      .catch(() => setError("Failed to load report data."))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    getAdminActivity()
      .then(setActivities)
      .catch(() => setActivityError("Failed to load activity history."))
      .finally(() => setActivityLoading(false));
  }, []);

  const totalTickets = report
    ? Object.values(report.tickets_by_category).reduce((a, b) => a + b, 0)
    : 0;

  const highPriority = report
    ? (report.tickets_by_priority["HIGH"] ?? 0) +
      (report.tickets_by_priority["CRITICAL"] ?? 0)
    : 0;

  const priorityData = report
    ? Object.entries(report.tickets_by_priority)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value }))
    : [];

  const staffData = report
    ? Object.entries(report.tickets_by_assigned_staff)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({
          name: name.charAt(0).toUpperCase() + name.slice(1),
          handled: value,
        }))
    : [];

  const hasPriorityData = priorityData.length > 0;
  const hasStaffData = staffData.length > 0;

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">
          Dashboard Overview
        </h1>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className="cursor-pointer hover:text-primary-500 transition-colors">
            Dashboard
          </span>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">Overview</span>
        </div>
      </div>

      {/* System Overview Section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-[14px] font-semibold text-text-dark">
          System Overview
        </h2>
        <div className="flex items-center gap-3">
          <button className="text-[13px] text-primary-500 font-medium hover:text-primary-600 transition-colors">
            View All Tickets
          </button>
          <span className="flex items-center gap-1.5 text-[12px] text-text-muted">
            <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
            Pending Approvals (3)
          </span>
        </div>
      </div>

      {/* Stat Cards */}
      {loading ? (
        <LoadingSkeleton />
      ) : error ? (
        <ErrorState message={error} />
      ) : (
        <StatCardsRow
          stats={{
            total: totalTickets,
            open: report!.total_open_tickets,
            resolved: report!.total_resolved_tickets,
            highPriority,
          }}
        />
      )}

      {/* Chart Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {loading ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets Distribution by Priority
              </h3>
              <LoadingSkeleton />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets Handled by Staff
              </h3>
              <LoadingSkeleton />
            </div>
          </>
        ) : error ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets Distribution by Priority
              </h3>
              <ErrorState message={error} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets Handled by Staff
              </h3>
              <ErrorState message={error} />
            </div>
          </>
        ) : (
          <>
            {hasPriorityData ? (
              <PriorityChart data={priorityData} />
            ) : (
              <EmptyChart title="Tickets Distribution by Priority" />
            )}
            {hasStaffData ? (
              <StaffChart data={staffData} />
            ) : (
              <EmptyChart title="Tickets Handled by Staff" />
            )}
          </>
        )}
      </div>

      {/* Ticket History & Activity */}
      <div className="mt-4">
        <ActivityFeed
          activities={activities}
          loading={activityLoading}
          error={activityError}
        />
      </div>
    </Layout>
  );
}
