import api from "./api";
import type { AuthResponse, LoginRequest, User } from "../types/auth";
import { clearToken, setToken } from "./tokenStore";

export async function login(payload: LoginRequest): Promise<AuthResponse> {
  const { data } = await api.post<AuthResponse>("/auth/login", payload);
  setToken(data.access_token);
  return data;
}

export async function getCurrentUser(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export function logout(): void {
  clearToken();
}