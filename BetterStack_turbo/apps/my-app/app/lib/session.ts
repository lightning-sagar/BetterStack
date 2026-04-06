export const AUTH_TOKEN_KEY = "obsidian-pulse-token";

export function readAuthToken(): string {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem(AUTH_TOKEN_KEY) ?? "";
}

export function writeAuthToken(token: string): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearAuthToken(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(AUTH_TOKEN_KEY);
}
