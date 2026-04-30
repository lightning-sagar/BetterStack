export type Website = {
  id: string;
  url: string;
  created_at: string;
  user_id: string;
};

export type WebsiteTick = {
  id: string;
  response_time_ms: number;
  status_code: "Up" | "Down" | "Unknown";
  time_checked: string;
  region_id: string;
  website_id: string;
  region?: {
    id: string;
    name: string;
  };
};

export type Alert = {
  id: string;
  website_id: string;
  website_url: string;
  status: "Up" | "Down" | "Unknown" | string;
  response_time_ms: number;
  region: string;
  time_checked: string;
  title: string;
  message: string;
};

export type AlertsSummary = {
  active_alerts: number;
  status: string;
};
