import { useEffect, useMemo, useState } from "react";
import {
  ChevronRight,
  Loader2,
  AlertCircle,
  Inbox,
  FolderOpen,
  Users,
} from "lucide-react";
import Layout from "../layouts/Layout";
import { StatCardsRow } from "../components/StatCard";
import { StatusChart, PriorityChart } from "../components/Charts";
import { getAdminReport, type AdminReport } from "../services/dashboardService";

const STATUS_BADGE: Record<string, string> = {
  OPEN: "bg-amber-50 text-amber-600",
  IN_PROGRESS: "bg-blue-50 text-blue-600",
  RESOLVED: "bg-emerald-50 text-emerald-600",
  CLOSED: "bg-gray-100 text-gray-600",
};

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

function EmptyCard({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <h3 className="text-[14px] font-semibold text-text-dark mb-4">{title}</h3>
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
          <Inbox className="text-gray-300" size={28} />
        </div>
        <p className="text-[13px] text-text-muted">{message}</p>
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const [report, setReport] = useState<AdminReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getAdminReport()
      .then(setReport)
      .catch(() => setError("Failed to load report data."))
      .finally(() => setLoading(false));
  }, []);

  const {
    totalTickets,
    highPriority,
    statusData,
    priorityData,
    categoryData,
    staffData,
    hasStatus,
    hasPriority,
    hasCategory,
    hasStaff,
  } = useMemo(() => {
    if (!report) {
      return {
        totalTickets: 0,
        highPriority: 0,
        statusData: [],
        priorityData: [],
        categoryData: [],
        staffData: [],
        hasStatus: false,
        hasPriority: false,
        hasCategory: false,
        hasStaff: false,
      };
    }

    const total = Object.values(report.tickets_by_category).reduce(
      (a, b) => a + b,
      0
    );
    const high =
      (report.tickets_by_priority["HIGH"] ?? 0) +
      (report.tickets_by_priority["CRITICAL"] ?? 0);

    const priorityEntries = Object.entries(report.tickets_by_priority)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name, value }));

    const staffEntries = Object.entries(report.tickets_by_assigned_staff)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        handled: value,
      }))
      .sort((a, b) => b.handled - a.handled);

    return {
      totalTickets: total,
      highPriority: high,
      statusData: Object.entries(report.tickets_by_status)
        .filter(([, v]) => v > 0)
        .map(([name, value]) => ({ name, value })),
      priorityData: priorityEntries,
      categoryData: Object.entries(report.tickets_by_category)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value),
      staffData: staffEntries,
      hasStatus: Object.values(report.tickets_by_status).some((v) => v > 0),
      hasPriority: priorityEntries.length > 0,
      hasCategory: Object.values(report.tickets_by_category).some((v) => v > 0),
      hasStaff: staffEntries.length > 0,
    };
  }, [report]);

  const maxCategory = categoryData.length > 0 ? categoryData[0].value : 0;
  const maxStaff = staffData.length > 0 ? staffData[0].handled : 0;

  return (
    <Layout>
      {/* Page Heading */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[22px] font-bold text-text-dark">Reports</h1>
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span className="cursor-pointer hover:text-primary-500 transition-colors">
            Reports
          </span>
          <ChevronRight size={12} />
          <span className="text-text-dark font-medium">Overview</span>
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

      {/* Chart Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {loading ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets by Status
              </h3>
              <LoadingSkeleton />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets by Priority
              </h3>
              <LoadingSkeleton />
            </div>
          </>
        ) : error ? (
          <>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets by Status
              </h3>
              <ErrorState message={error} />
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
              <h3 className="text-[14px] font-semibold text-text-dark mb-4">
                Tickets by Priority
              </h3>
              <ErrorState message={error} />
            </div>
          </>
        ) : (
          <>
            {hasStatus ? (
              <StatusChart data={statusData} />
            ) : (
              <EmptyCard
                title="Tickets by Status"
                message="No status data available"
              />
            )}
            {hasPriority ? (
              <PriorityChart data={priorityData} />
            ) : (
              <EmptyCard
                title="Tickets by Priority"
                message="No priority data available"
              />
            )}
          </>
        )}
      </div>

      {/* Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Tickets by Category */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <FolderOpen size={16} className="text-primary-500" />
            <h3 className="text-[14px] font-semibold text-text-dark">
              Tickets by Category
            </h3>
          </div>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : !hasCategory ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Inbox className="text-gray-300" size={28} />
              </div>
              <p className="text-[13px] text-text-muted">
                No category data available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryData.map((cat) => (
                <div key={cat.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-text-dark">
                      {cat.name}
                    </span>
                    <span className="text-[12px] text-text-muted">
                      {cat.value} ticket{cat.value === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{
                        width: `${maxCategory ? (cat.value / maxCategory) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tickets handled by Staff */}
        <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users size={16} className="text-primary-500" />
            <h3 className="text-[14px] font-semibold text-text-dark">
              Tickets Handled by Staff
            </h3>
          </div>
          {loading ? (
            <LoadingSkeleton />
          ) : error ? (
            <ErrorState message={error} />
          ) : !hasStaff ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-14 h-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Inbox className="text-gray-300" size={28} />
              </div>
              <p className="text-[13px] text-text-muted">
                No staff assignment data available
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {staffData.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium text-text-dark">
                      {s.name}
                    </span>
                    <span className="text-[12px] text-text-muted">
                      {s.handled} ticket{s.handled === 1 ? "" : "s"}
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary-500"
                      style={{
                        width: `${maxStaff ? (s.handled / maxStaff) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}