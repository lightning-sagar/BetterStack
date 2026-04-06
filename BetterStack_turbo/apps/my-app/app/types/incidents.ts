export type IncidentItem = {
  id: string;
  website_id: string;
  website_url: string;
  status: "Up" | "Down" | "Unknown";
  response_time_ms: number;
  region: string;
  time_checked: string;
  title: string;
};

export type DownWebsiteItem = {
  website_id: string;
  website_url: string;
  down_count: number;
  latest_down_at: string;
  regions: string[];
};
