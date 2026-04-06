import type { AuthResponse, SignInInput, SignUpInput } from "../types/auth";
import { clearAuthToken } from "./session";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function request<TPayload extends object>(path: string, payload: TPayload): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    cache: "no-store",
  });

  const data = (await response.json()) as AuthResponse;

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function signIn(payload: SignInInput): Promise<AuthResponse> {
  return request("/signin", payload);
}

export function signUp(payload: SignUpInput): Promise<AuthResponse> {
  return request("/signup", payload);
}

export async function logout(token: string): Promise<void> {
  await fetch(`${API_BASE_URL}/logout`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  }).catch(() => undefined);

  clearAuthToken();
}

