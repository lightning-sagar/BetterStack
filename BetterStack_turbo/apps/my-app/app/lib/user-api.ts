import type { AuthResponse, AuthUser } from "../types/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function authorizedJson(path: string, token: string, init?: RequestInit): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
}

export async function fetchCurrentUser(token: string): Promise<AuthUser> {
  const response = await authorizedJson("/me", token);
  const data = (await response.json()) as { success?: boolean; user?: AuthUser; message?: string };

  if (!response.ok || !data.success || !data.user) {
    throw new Error(data.message || "Failed to fetch current user");
  }

  return data.user;
}

export async function updateUsername(token: string, username: string): Promise<AuthResponse> {
  const response = await authorizedJson("/user/username", token, {
    method: "PATCH",
    body: JSON.stringify({ username }),
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update username");
  }

  return data;
}

export async function updateUserProfile(
  token: string,
  payload: { username?: string; email?: string; password?: string },
): Promise<AuthResponse> {
  const response = await authorizedJson("/user/profile", token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to update profile");
  }

  return data;
}
