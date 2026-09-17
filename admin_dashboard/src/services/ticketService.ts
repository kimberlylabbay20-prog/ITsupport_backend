import api from "./api";
import type { User } from "../types/auth";

export { getErrorMessage } from "./api";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export interface Ticket {
  ticket_id: number;
  user_id: number;
  category_id: number;
  assigned_to: number | null;
  title: string;
  description: string;
  priority: TicketPriority;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
}

export interface Category {
  category_id: number;
  name: string;
  description: string | null;
  created_at: string;
}

export interface WorkNote {
  note_id: string;
  ticket_id: number;
  activity_type: string;
  performed_by: Record<string, unknown>;
  message: string;
  note: string;
  author: string;
  created_at: string;
}

export async function getAdminTickets(): Promise<Ticket[]> {
  const { data } = await api.get<Ticket[]>("/admin/tickets");
  return data;
}

export async function getAdminTicket(ticketId: number): Promise<Ticket> {
  const { data } = await api.get<Ticket>(`/admin/tickets/${ticketId}`);
  return data;
}

export async function getUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function getCategories(): Promise<Category[]> {
  const { data } = await api.get<Category[]>("/categories");
  return data;
}

export async function updateTicketStatus(
  ticketId: number,
  status: TicketStatus
): Promise<Ticket> {
  const { data } = await api.put<Ticket>(`/admin/tickets/${ticketId}/status`, {
    status,
  });
  return data;
}

export async function updateTicketPriority(
  ticketId: number,
  priority: TicketPriority
): Promise<Ticket> {
  const { data } = await api.put<Ticket>(
    `/admin/tickets/${ticketId}/priority`,
    { priority }
  );
  return data;
}

export async function assignTicket(
  ticketId: number,
  assignedTo: number
): Promise<Ticket> {
  const { data } = await api.put<Ticket>(`/admin/tickets/${ticketId}/assign`, {
    assigned_to: assignedTo,
  });
  return data;
}

export async function resolveTicket(ticketId: number): Promise<Ticket> {
  const { data } = await api.put<Ticket>(
    `/admin/tickets/${ticketId}/resolve`
  );
  return data;
}

export async function addTicketNote(
  ticketId: number,
  message: string
): Promise<WorkNote> {
  const { data } = await api.post<WorkNote>(
    `/admin/tickets/${ticketId}/notes`,
    { message }
  );
  return data;
}

export async function deleteTicket(ticketId: number): Promise<void> {
  await api.delete(`/tickets/${ticketId}`);
}