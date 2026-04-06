"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, LogOut, Search, ChartColumnBig, Download, Filter } from "lucide-react";
import { Footer } from "../landing/Footer";
import { AppSidebar } from "../layout/AppSidebar";
import { useAuthStore } from "../../store/auth-store";
import { createWebsite, fetchWebsiteTicks, fetchWebsites, searchWebsites } from "../../lib/dashboard-api";
import type { Website, WebsiteTick } from "../../types/dashboard";
import { AddWebsiteModal } from "./AddWebsiteModal";

type WebsiteWithTicks = Website & {
  ticks: WebsiteTick[];
};

function formatResponseTime(ticks: WebsiteTick[]): string {
  if (!ticks.length) {
    return "0 ms";
  }

  const average = Math.round(
    ticks.reduce((total, tick) => total + tick.response_time_ms, 0) / ticks.length,
  );

  return `${average} ms`;
}

function toCurvePath(points: number[], width: number, height: number): string {
  if (!points.length) {
    return "";
  }

  const min = Math.min(...points);
  const max = Math.max(...points);
  const spread = max - min || 1;
  const stepX = points.length > 1 ? width / (points.length - 1) : width;

  const coords = points.map((point, index) => {
    const x = index * stepX;
    const y = height - ((point - min) / spread) * (height - 8) - 4;
    return { x, y };
  });

  let path = `M ${coords[0].x} ${coords[0].y}`;

  for (let i = 1; i < coords.length; i += 1) {
    const prev = coords[i - 1];
    const current = coords[i];
    const controlX = (prev.x + current.x) / 2;
    path += ` Q ${controlX} ${prev.y}, ${current.x} ${current.y}`;
  }

  return path;
}

function TopBar({
  onLogout,
  searchQuery,
  onSearchChange,
  onShowComingSoon,
  onNavigate,
}: {
  onLogout: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onShowComingSoon: () => void;
  onNavigate: (href: string) => void;
}) {
  return (
    <div className="sticky top-0 z-30 bg-surface-dim px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <nav className="hidden items-center gap-9 md:flex">
          <button type="button" className="border-b-2 border-primary pb-1 text-[1.02rem] font-semibold text-primary">
            Dashboard
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/incidents")}
            className="text-[1.02rem] font-semibold text-on-surface-variant/80 transition-colors hover:text-on-surface"
          >
            Incidents
          </button>
          <button
            type="button"
            onClick={onShowComingSoon}
            className="text-[1.02rem] font-semibold text-on-surface-variant/80 transition-colors hover:text-on-surface"
          >
            Alerts
          </button>
          <button type="button" className="text-[1.02rem] font-semibold text-on-surface-variant/80 transition-colors hover:text-on-surface">
            Pricing
          </button>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center rounded-2xl border border-surface-highest/30 bg-surface-high px-4 py-2.5 lg:flex">
            <Search className="mr-2 h-4 w-4 text-on-surface-variant" />
            <input
              value={searchQuery}
              onChange={(event) => onSearchChange(event.target.value)}
              className="w-48 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
              placeholder="Quick search..."
            />
          </div>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-2 rounded-md border border-primary/10 bg-surface-high px-5 py-2.5 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

function DashboardTable({ websites, onOpenWebsite }: { websites: WebsiteWithTicks[]; onOpenWebsite: (websiteId: string) => void }) {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-low">
      <div className="grid grid-cols-[1.6fr_0.8fr_1fr_0.7fr] bg-surface-high px-8 py-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-surface-variant">
        <span>Endpoint</span>
        <span className="text-center">Status</span>
        <span>24h History</span>
        <span className="text-right">Uptime</span>
      </div>

      <div className="divide-y divide-surface-high/40">
        {websites.map((website) => {
          const ticks = website.ticks;
          const latestTick = ticks[0];
          const isUp = latestTick?.status_code === "Up";
          const uptimeValue = ticks.length
            ? `${Math.round((ticks.filter((tick) => tick.status_code === "Up").length / ticks.length) * 100)}%`
            : "--";

          const historyPoints = ticks.length
            ? [...ticks].slice(0, 8).reverse().map((tick) => Math.max(8, tick.response_time_ms))
            : isUp
              ? [42, 47, 43, 51, 45, 54, 48, 56]
              : [58, 54, 50, 49, 49, 49, 49, 49];

          const curveColor = isUp ? "#5CFD80" : "#FF716C";
          const curvePath = toCurvePath(historyPoints, 190, 42);

          return (
            <div
              key={website.id}
              role="button"
              tabIndex={0}
              onClick={() => onOpenWebsite(website.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onOpenWebsite(website.id);
                }
              }}
              className="grid cursor-pointer grid-cols-[1.6fr_0.8fr_1fr_0.7fr] items-center bg-surface-low px-8 py-6 transition-colors hover:bg-surface-highest/20"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-dim text-primary">
                  <Globe className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface">{website.url}</p>
                  <p className="text-xs text-on-surface-variant">US-East-1 • {Math.max(1, Math.round(latestTick?.response_time_ms ?? 42))}ms</p>
                </div>
              </div>

              <div className="flex justify-center">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${
                    isUp
                      ? "bg-secondary/15 text-secondary"
                      : latestTick?.status_code === "Down"
                        ? "bg-error/15 text-error"
                        : "bg-surface-high text-on-surface-variant"
                  }`}
                >
                  <span
                    className={`mr-1.5 inline-flex h-2 w-2 rounded-full ${
                      isUp ? "pulse-ring bg-secondary" : "pulse-ring-error animate-pulse-down bg-error"
                    }`}
                  />
                  {latestTick?.status_code ?? "Unknown"}
                </span>
              </div>

              <div className="h-11 w-full max-w-50">
                <svg width="100%" height="100%" viewBox="0 0 190 42" preserveAspectRatio="none">
                  <path
                    d={curvePath}
                    fill="none"
                    stroke={curveColor}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ filter: `drop-shadow(0 0 6px ${curveColor}66)` }}
                  />
                </svg>
              </div>

              <div className="text-right">
                <p className={`font-display text-2xl font-bold ${isUp ? "text-on-surface" : "text-error"}`}>{uptimeValue}</p>
                <p className="text-[10px] uppercase tracking-[0.12em] text-on-surface-variant">{isUp ? "No outages" : formatResponseTime(ticks)}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardTableSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-surface-low p-4">
      <div className="mb-3 h-10 w-full animate-pulse rounded bg-surface-high" />
      <div className="space-y-3">
        {[1, 2, 3, 4].map((item) => (
          <div key={item} className="h-16 w-full animate-pulse rounded bg-surface-high" />
        ))}
      </div>
    </div>
  );
}

export function DashboardPortal() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);
  const [websites, setWebsites] = useState<WebsiteWithTicks[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dashboardError, setDashboardError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [comingSoonMessage, setComingSoonMessage] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/sign");
    }
  }, [router, token]);

  useEffect(() => {
    async function loadDashboard(query: string) {
      if (!token) {
        return;
      }

      try {
        setIsLoading(true);
        setDashboardError("");
        const items = query.trim() ? await searchWebsites(token, query) : await fetchWebsites(token);
        const withTicks = await Promise.all(
          items.map(async (website) => ({
            ...website,
            ticks: await fetchWebsiteTicks(token, website.id),
          })),
        );

        setWebsites(withTicks);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to load dashboard";
        setDashboardError(message);
      } finally {
        setIsLoading(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadDashboard(searchQuery);
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const summary = useMemo(() => {
    const total = websites.length;
    const healthy = websites.filter((website) => website.ticks[0]?.status_code === "Up").length;
    const incidents = total - healthy;
    const avgResponse = total
      ? Math.round(
          websites.reduce((sum, website) => {
            const ticks = website.ticks;
            if (!ticks.length) {
              return sum;
            }
            return sum + ticks.reduce((tickSum, tick) => tickSum + tick.response_time_ms, 0) / ticks.length;
          }, 0) / total,
        )
      : 0;

    return { total, healthy, incidents, avgResponse };
  }, [websites]);

  async function handleLogout() {
    await logout();
    router.replace("/sign");
  }

  async function handleAddWebsite(url: string) {
    if (!token) {
      return;
    }

    try {
      setIsSubmitting(true);
      await createWebsite(token, url);
      const items = await fetchWebsites(token);
      const withTicks = await Promise.all(
        items.map(async (website) => ({
          ...website,
          ticks: await fetchWebsiteTicks(token, website.id),
        })),
      );
      setWebsites(withTicks);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  }

  const systemHealth = summary.total ? ((summary.healthy / summary.total) * 100).toFixed(2) : "99.98";
  const requestVolume = summary.total ? `${(summary.total * 100).toFixed(1)}K` : "1.2M";

  function handleShowComingSoon() {
    setComingSoonMessage("Alerts are coming soon.");
    window.setTimeout(() => {
      setComingSoonMessage("");
    }, 2200);
  }

  return (
    <main className="min-h-screen bg-surface-dim text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-425 lg:gap-0">
        <AppSidebar
          active="overview"
          onAddMonitor={() => setIsModalOpen(true)}
          onLogout={handleLogout}
          onNavigate={(href) => router.push(href)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <TopBar
            onLogout={handleLogout}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            onShowComingSoon={handleShowComingSoon}
            onNavigate={(href) => router.push(href)}
          />

          <div className="flex-1 px-4 pb-8 pt-8 sm:px-6 lg:px-8">
            <div className="space-y-8">
              <div className="grid gap-6 xl:grid-cols-[1.62fr_0.78fr]">
                <section className="relative overflow-hidden rounded-xl bg-surface-low p-8">
                  <div className="pointer-events-none absolute right-7 top-7 rounded-2xl bg-primary/10 p-5 text-primary/45">
                    <ChartColumnBig className="h-14 w-14" strokeWidth={1.8} />
                  </div>

                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-on-surface-variant">Global System Health</p>
                  <div className="mt-4 flex items-start justify-between gap-6">
                    <div>
                      <p className="font-display text-[5.25rem] font-black leading-[0.95] tracking-[-0.06em] text-on-surface">
                        {systemHealth}
                        <span className="ml-1 text-[2.8rem] text-primary">%</span>
                      </p>
                      <p className="mt-4 max-w-md text-base leading-relaxed text-on-surface-variant">
                        System-wide performance remains within high-availability parameters. {summary.total || 12} active
                        monitors verified in the last 60 seconds.
                      </p>
                    </div>
                  </div>

                  <div className="mt-9 flex items-center gap-6">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Response Avg</p>
                      <p className="mt-2 font-display text-[2.1rem] font-bold text-on-surface">{summary.avgResponse || 124}ms</p>
                    </div>

                    <div className="h-11 w-px bg-surface-high" />

                    <div>
                      <p className="text-[10px] uppercase tracking-[0.22em] text-on-surface-variant">Total Requests</p>
                      <p className="mt-2 font-display text-[2.1rem] font-bold text-on-surface">{requestVolume}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-xl bg-surface-high p-8">
                  <p className="text-xs font-semibold uppercase tracking-[0.28em] text-error">Current Incidents</p>
                  <div className="mt-5 flex items-baseline gap-3">
                    <p className="font-display text-7xl font-bold tracking-[-0.05em] text-on-surface">{summary.incidents.toString().padStart(2, "0")}</p>
                    <span className="text-sm font-semibold text-on-surface-variant">Active</span>
                  </div>
                  <div className="mt-8 space-y-3">
                    <div className="rounded-lg bg-surface-dim p-3">
                      <p className="text-sm font-semibold text-on-surface">
                        {summary.incidents ? "API Gateway Lag - Sydney" : "No active incidents"}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    className="mt-6 inline-flex w-full items-center justify-center rounded-lg border border-surface-highest/60 bg-surface-high px-4 py-3 text-sm font-semibold uppercase tracking-[0.16em] text-on-surface transition-colors hover:bg-surface-highest"
                  >
                    View Logs
                  </button>
                </section>
              </div>

              <section className="space-y-4">
                {comingSoonMessage ? (
                  <div className="rounded-lg bg-primary/12 px-4 py-2 text-sm font-medium text-primary">{comingSoonMessage}</div>
                ) : null}

                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-display text-2xl font-black tracking-tight text-on-surface">Active Monitors</h2>
                  </div>
                  <div className="flex items-center gap-5 text-sm font-semibold text-on-surface-variant">
                    <span className="inline-flex items-center gap-1.5">
                      <Filter className="h-3.5 w-3.5" />
                      Filter
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Download className="h-3.5 w-3.5" />
                      Export
                    </span>
                  </div>
                </div>

                {dashboardError ? (
                  <div className="rounded-xl bg-error/15 px-4 py-3 text-sm text-error">{dashboardError}</div>
                ) : null}

                {isLoading ? (
                  <DashboardTableSkeleton />
                ) : websites.length ? (
                  <DashboardTable websites={websites} onOpenWebsite={(websiteId) => router.push(`/dashboard/website/${websiteId}`)} />
                ) : (
                  <div className="rounded-xl bg-surface-low p-6 text-sm text-on-surface-variant">
                    No websites yet. Use Add Monitor to create your first website.
                  </div>
                )}
              </section>

            </div>
          </div>

          <div className="px-4 pb-6 sm:px-6 lg:px-8">
            <Footer className="mt-8 border-surface-high/30" />
          </div>
        </div>
      </div>

      <AddWebsiteModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddWebsite}
        isSubmitting={isSubmitting}
      />
    </main>
  );
}
