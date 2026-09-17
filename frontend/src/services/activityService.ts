import api from "./api";

export interface ActivityActor {
  user_id: number;
  username: string;
  role: string;
}

export interface Activity {
  activity_id: string;
  activity_type: string;
  ticket_id: number | null;
  performed_by: ActivityActor | null;
  author: string | null;
  message: string | null;
  old_value: Record<string, unknown> | null;
  new_value: Record<string, unknown> | null;
  timestamp: string | null;
}

export async function getAdminActivity(): Promise<Activity[]> {
  const { data } = await api.get<Activity[]>("/admin/activity");
  return data;
}