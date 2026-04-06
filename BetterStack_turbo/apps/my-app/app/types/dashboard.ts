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
