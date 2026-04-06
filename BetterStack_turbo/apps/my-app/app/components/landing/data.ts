import { BellRing, MonitorCheck, Network, Timer } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Feature = {
  title: string;
  body: string;
  icon: LucideIcon;
  className: string;
};

export const navItems = ["Dashboard", "Incidents", "Alerts", "Pricing"];

export const features: Feature[] = [
  {
    title: "Precision Uptime Monitoring",
    body: "Check from 12 global locations every 180 seconds. We perform full TLS handshakes and content validation so your site is truly functional.",
    icon: MonitorCheck,
    className: "md:col-span-2",
  },
  {
    title: "Performance Tracking",
    body: "Track TTFB, FCP, and full load times. Spot latency spikes before they impact your SEO ranking.",
    icon: Timer,
    className: "md:col-span-1",
  },
  {
    title: "Upcoming Alerts",
    body: "Multichannel notifications via Slack, Telegram, and email keep your team ahead of outages.",
    icon: BellRing,
    className: "md:col-span-1",
  },
  {
    title: "Global Network",
    body: "Leverage our edge network for testing latency across North America, Europe, and Asia-Pacific.",
    icon: Network,
    className: "md:col-span-2",
  },
];
