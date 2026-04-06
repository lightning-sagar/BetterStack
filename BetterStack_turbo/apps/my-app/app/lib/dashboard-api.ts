import type { Website, WebsiteTick } from "../types/dashboard";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

async function authorizedFetch(path: string, token: string, init?: RequestInit): Promise<Response> {
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

export async function fetchWebsites(token: string): Promise<Website[]> {
  const response = await authorizedFetch("/websites", token);
  const data = (await response.json()) as { websites?: Website[]; message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch websites");
  }

  return data.websites ?? [];
}

export async function fetchWebsiteTicks(token: string, websiteId: string): Promise<WebsiteTick[]> {
  const response = await authorizedFetch(`/websites/${websiteId}/ticks`, token);
  const data = (await response.json()) as { ticks?: WebsiteTick[]; message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch website ticks");
  }

  return data.ticks ?? [];
}

export async function searchWebsites(token: string, query: string): Promise<Website[]> {
  const encoded = encodeURIComponent(query.trim());
  const response = await authorizedFetch(`/websites/search?q=${encoded}`, token);
  const data = (await response.json()) as { websites?: Website[]; message?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to search websites");
  }

  return data.websites ?? [];
}

export async function fetchWebsiteDetail(token: string, websiteId: string): Promise<{ website: Website; ticks: WebsiteTick[] }> {
  const response = await authorizedFetch(`/website/${websiteId}`, token);
  const data = (await response.json()) as { website?: Website; ticks?: WebsiteTick[]; message?: string };

  if (!response.ok || !data.website) {
    throw new Error(data.message || "Failed to fetch website detail");
  }

  return {
    website: data.website,
    ticks: data.ticks ?? [],
  };
}

export async function deleteWebsite(token: string, websiteId: string): Promise<{ message: string; website_id: string }> {
  const response = await authorizedFetch(`/website/${websiteId}`, token, {
    method: "DELETE",
  });
  const data = (await response.json()) as { message?: string; website_id?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to delete website");
  }

  return {
    message: data.message || "Website deleted",
    website_id: data.website_id || websiteId,
  };
}

export async function createWebsite(token: string, url: string): Promise<{ message: string; website_id: string }> {
  const response = await authorizedFetch("/website", token, {
    method: "POST",
    body: JSON.stringify({ url }),
  });
  const data = (await response.json()) as { message?: string; website_id?: string };

  if (!response.ok) {
    throw new Error(data.message || "Failed to create website");
  }

  return {
    message: data.message || "Website created",
    website_id: data.website_id || "",
  };
}
