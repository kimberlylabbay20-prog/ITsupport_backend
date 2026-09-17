import api from "./api";

export interface DashboardStats {
  total_tickets: number;
  open_tickets: number;
  in_progress: number;
  resolved_tickets: number;
  closed_tickets: number;
  high_priority: number;
  by_status: Record<string, number>;
  by_priority: Record<string, number>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { data } = await api.get<DashboardStats>("/admin/dashboard");
  return data;
}

export interface AdminReport {
  tickets_by_category: Record<string, number>;
  tickets_by_status: Record<string, number>;
  tickets_by_priority: Record<string, number>;
  tickets_by_assigned_staff: Record<string, number>;
  total_open_tickets: number;
  total_resolved_tickets: number;
}

export async function getAdminReport(): Promise<AdminReport> {
  const { data } = await api.get<AdminReport>("/admin/reports");
  return data;
}
