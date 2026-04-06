import type { DownWebsiteItem, IncidentItem } from "../types/incidents";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function authorizedFetch(path: string, token: string): Promise<Response> {
  return fetch(`${API_BASE_URL}${path}`, {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function fetchIncidents(
  token: string,
  params?: { from?: string; to?: string; limit?: number },
): Promise<IncidentItem[]> {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);
  if (params?.limit) query.set("limit", String(params.limit));

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await authorizedFetch(`/incidents${suffix}`, token);
  const data = (await response.json()) as { incidents?: IncidentItem[]; message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch incidents");
  }

  return data.incidents ?? [];
}

export async function fetchDownWebsites(
  token: string,
  params?: { from?: string; to?: string },
): Promise<DownWebsiteItem[]> {
  const query = new URLSearchParams();
  if (params?.from) query.set("from", params.from);
  if (params?.to) query.set("to", params.to);

  const suffix = query.toString() ? `?${query.toString()}` : "";
  const response = await authorizedFetch(`/incidents/down-websites${suffix}`, token);
  const data = (await response.json()) as { websites?: DownWebsiteItem[]; message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch down websites");
  }

  return data.websites ?? [];
}
