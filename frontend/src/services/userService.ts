import api from "./api";
import type { Role, User } from "../types/auth";

export interface UserUpdatePayload {
  username?: string;
  email?: string;
  password?: string;
  full_name?: string;
  role?: Role;
  is_active?: boolean;
}

export async function getAllUsers(): Promise<User[]> {
  const { data } = await api.get<User[]>("/users");
  return data;
}

export async function updateUser(
  userId: number,
  payload: UserUpdatePayload
): Promise<User> {
  const { data } = await api.put<User>(`/users/${userId}`, payload);
  return data;
}

export async function deleteUser(userId: number): Promise<void> {
  await api.delete(`/users/${userId}`);
}