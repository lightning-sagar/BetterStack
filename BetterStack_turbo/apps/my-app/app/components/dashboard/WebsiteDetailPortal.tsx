"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  ChevronRight,
  Globe,
  RefreshCw,
  Search,
  Zap,
  AlertTriangle,
  Trash2,
} from "lucide-react";
import { Footer } from "../landing/Footer";
import { AppSidebar } from "../layout/AppSidebar";
import { DateRangeFilter } from "../shared/DateRangeFilter";
import { useAuthStore } from "../../store/auth-store";
import { deleteWebsite, fetchWebsiteDetail, searchWebsites } from "../../lib/dashboard-api";
import type { Website, WebsiteTick } from "../../types/dashboard";
import { fetchCurrentUser } from "../../lib/user-api";

const AUTO_REFRESH_MS = 90_000;

type IncidentRow = {
  id: string;
  title: string;
  detail: string;
  status: "RESOLVED" | "LOGGED";
  dateLabel: string;
  responseLabel: string;
  regionLabel: string;
};

function formatDateLabel(isoDate: string): string {
  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function formatLastUpdated(isoDate: string | null): string {
  if (!isoDate) {
    return "Not synced yet";
  }

  const date = new Date(isoDate);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function buildIncidents(ticks: WebsiteTick[]): IncidentRow[] {
  const source = ticks.slice(0, 5);

  if (!source.length) {
    return [];
  }

  return source.map((tick) => ({
    id: tick.id,
    title: tick.status_code === "Down" ? "Availability Alert" : "Routine Health Check",
    detail: `${tick.status_code} state recorded from monitor runner`,
    status: tick.status_code === "Down" ? "LOGGED" : "RESOLVED",
    dateLabel: formatDateLabel(tick.time_checked),
    responseLabel: `${tick.response_time_ms}ms`,
    regionLabel: tick.region?.name ?? "Unknown",
  }));
}

function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 h-76 animate-pulse rounded-xl bg-surface-low lg:col-span-8" />
        <div className="col-span-12 space-y-6 lg:col-span-4">
          <div className="h-35 animate-pulse rounded-xl bg-surface-low" />
          <div className="h-35 animate-pulse rounded-xl bg-surface-low" />
        </div>
      </div>
      <div className="h-34 animate-pulse rounded-xl bg-surface-low" />
      <div className="h-64 animate-pulse rounded-xl bg-surface-low" />
    </div>
  );
}

export function WebsiteDetailPortal() {
  const params = useParams<{ websiteId: string }>();
  const websiteId = params?.websiteId;

  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const [website, setWebsite] = useState<Website | null>(null);
  const [username, setUsername] = useState("");
  const [ticks, setTicks] = useState<WebsiteTick[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Website[]>([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  const previousTopTickId = useRef<string | null>(null);

  useEffect(() => {
    if (!token) {
      router.replace("/sign");
    }
  }, [router, token]);

  const loadWebsiteDetail = useCallback(
    async (mode: "initial" | "manual" | "poll" = "initial") => {
      if (!token || !websiteId) {
        return;
      }

      try {
        if (mode === "initial") {
          setIsLoading(true);
        } else {
          setIsRefreshing(true);
        }

        setError("");

        const shouldFetchUser = !username;
        const [detail, currentUser] = await Promise.all([
          fetchWebsiteDetail(token, websiteId),
          shouldFetchUser ? fetchCurrentUser(token) : Promise.resolve(null),
        ]);

        const incomingTopTickId = detail.ticks[0]?.id ?? null;
        const hasNewResults =
          mode !== "initial" &&
          previousTopTickId.current !== null &&
          incomingTopTickId !== null &&
          incomingTopTickId !== previousTopTickId.current;

        setWebsite(detail.website);
        setTicks(detail.ticks);

        if (currentUser) {
          setUsername(currentUser.username);
        }

        previousTopTickId.current = incomingTopTickId;
        setLastUpdatedAt(new Date().toISOString());

        if (mode === "manual") {
          setMessage(hasNewResults ? "Refreshed. New check results are now visible." : "Refreshed. No new check results yet.");
        } else if (mode === "poll" && hasNewResults) {
          setMessage("New monitoring results arrived just now.");
        }
      } catch (loadError) {
        const loadMessage = loadError instanceof Error ? loadError.message : "Failed to load website detail";
        setError(loadMessage);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [token, websiteId, username],
  );

  useEffect(() => {
    void loadWebsiteDetail("initial");
  }, [loadWebsiteDetail]);

  useEffect(() => {
    if (!token || !websiteId) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void loadWebsiteDetail("poll");
    }, AUTO_REFRESH_MS);

    return () => window.clearInterval(intervalId);
  }, [loadWebsiteDetail, token, websiteId]);

  useEffect(() => {
    if (!message) {
      return;
    }

    const timeoutId = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(timeoutId);
  }, [message]);

  useEffect(() => {
    async function runSearch() {
      if (!token || !searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await searchWebsites(token, searchQuery);
        setSearchResults(results.slice(0, 6));
      } catch {
        setSearchResults([]);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void runSearch();
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [searchQuery, token]);

  const filteredTicks = useMemo(() => {
    const fromTime = fromDate ? new Date(fromDate).getTime() : Number.NEGATIVE_INFINITY;
    const toTime = toDate ? new Date(`${toDate}T23:59:59.999`).getTime() : Number.POSITIVE_INFINITY;

    return ticks.filter((tick) => {
      const checkedAt = new Date(tick.time_checked).getTime();
      return checkedAt >= fromTime && checkedAt <= toTime;
    });
  }, [fromDate, toDate, ticks]);

  const filteredIncidents = useMemo(() => buildIncidents(filteredTicks), [filteredTicks]);

  const metrics = useMemo(() => {
    const total = ticks.length;
    const upCount = ticks.filter((tick) => tick.status_code === "Up").length;
    const uptime = total ? Math.round((upCount / total) * 100) : 100;

    const avgResponse = total
      ? Math.round(ticks.reduce((sum, tick) => sum + tick.response_time_ms, 0) / total)
      : 142;

    const uniqueRegions = new Set(ticks.map((tick) => tick.region_id).filter(Boolean)).size;

    const firstHalf = ticks.slice(Math.floor(total / 2));
    const secondHalf = ticks.slice(0, Math.floor(total / 2));
    const firstAvg = firstHalf.length
      ? firstHalf.reduce((sum, tick) => sum + tick.response_time_ms, 0) / firstHalf.length
      : avgResponse;
    const secondAvg = secondHalf.length
      ? secondHalf.reduce((sum, tick) => sum + tick.response_time_ms, 0) / secondHalf.length
      : avgResponse;

    const trend = firstAvg ? Math.round(((firstAvg - secondAvg) / firstAvg) * 100) : 0;

    const bars = ticks.length
      ? [...ticks].slice(0, 15).reverse().map((tick) => Math.max(46, Math.min(100, tick.response_time_ms / 3.1)))
      : [80, 85, 75, 90, 95, 100, 80, 85, 70, 90, 100, 100, 95, 100, 90];

    return {
      uptime,
      avgResponse,
      nodeCount: uniqueRegions || 18,
      trend,
      bars,
      isOperational: ticks[0]?.status_code !== "Down",
    };
  }, [ticks]);

  async function handleLogout() {
    await logout();
    router.replace("/sign");
  }

  async function handleDeleteWebsite() {
    if (!token || !websiteId) {
      return;
    }

    const confirmed = window.confirm("Delete this monitor and all its ticks?");
    if (!confirmed) {
      return;
    }

    try {
      setIsDeleting(true);
      await deleteWebsite(token, websiteId);
      router.replace("/dashboard");
    } catch (deleteError) {
      const deleteMessage = deleteError instanceof Error ? deleteError.message : "Failed to delete website";
      setError(deleteMessage);
    } finally {
      setIsDeleting(false);
    }
  }

  function handleShowComingSoon() {
    setMessage("Alerts are coming soon.");
  }

  return (
    <main className="min-h-screen bg-surface-dim text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-425">
        <AppSidebar
          active="monitors"
          onAddMonitor={() => router.push("/dashboard")}
          onLogout={handleLogout}
          onNavigate={(href) => router.push(href)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <header className="sticky top-0 z-30 flex w-full flex-col gap-4 bg-surface-dim px-4 py-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="text-on-surface-variant transition-colors hover:text-primary"
                aria-label="Go back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h2 className="font-display text-2xl font-bold tracking-tight text-primary">{website?.url ?? "Website"}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${metrics.isOperational ? "bg-secondary pulse-ring" : "bg-error pulse-ring-error"}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${metrics.isOperational ? "text-secondary" : "text-error"}`}>
                    {metrics.isOperational ? "Operational" : "Degraded"}
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">Owner: {username || "Unknown"}</span>
                  <span className="text-[10px] uppercase tracking-widest text-on-surface-variant/70">
                    Last Sync: {formatLastUpdated(lastUpdatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 lg:gap-4">
              <div className="relative hidden items-center gap-3 rounded-md bg-surface-high px-4 py-2 lg:flex">
                <Search className="h-4 w-4 text-on-surface-variant" />
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  className="w-48 bg-transparent text-sm text-on-surface outline-none placeholder:text-on-surface-variant/40"
                  placeholder="Quick Search..."
                />

                {searchResults.length ? (
                  <div className="absolute left-0 top-12 z-40 w-full rounded-md border border-surface-highest/30 bg-surface-high p-2 shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
                    {searchResults.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          setSearchQuery("");
                          setSearchResults([]);
                          router.push(`/dashboard/website/${item.id}`);
                        }}
                        className="block w-full rounded px-2 py-2 text-left text-xs text-on-surface-variant transition-colors hover:bg-surface-base hover:text-on-surface"
                      >
                        {item.url}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void loadWebsiteDetail("manual")}
                disabled={isLoading || isRefreshing}
                className="inline-flex items-center gap-2 rounded-md border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </button>

              <button
                type="button"
                onClick={handleDeleteWebsite}
                disabled={isDeleting}
                className="inline-flex items-center gap-2 rounded-md border border-error/30 bg-error/10 px-4 py-2 text-sm font-bold text-error transition-colors hover:bg-error/20 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <Trash2 className="h-4 w-4" />
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </header>

          <div className="space-y-8 p-4 sm:p-6 lg:p-8">
            {message ? <div className="rounded-lg bg-primary/12 px-4 py-2 text-sm font-medium text-primary">{message}</div> : null}
            {error ? <div className="rounded-xl bg-error/15 px-4 py-3 text-sm text-error">{error}</div> : null}

            {!isLoading ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-surface-high/40 bg-surface-low px-4 py-3 text-sm">
                <span className="text-on-surface-variant">
                  Auto refresh runs every <span className="font-semibold text-on-surface">1.5 minutes</span>.
                </span>
                <span className="text-on-surface-variant">
                  Latest tick count: <span className="font-semibold text-on-surface">{ticks.length}</span>
                </span>
              </div>
            ) : null}

            {isLoading ? (
              <DetailSkeleton />
            ) : (
              <>
                <div className="grid grid-cols-12 gap-6">
                  <div className="relative col-span-12 overflow-hidden rounded-xl bg-surface-low p-10 lg:col-span-8">
                    <div className="relative z-10">
                      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">Health Score (Last 30d)</p>
                      <h3 className="font-display text-[5rem] font-extrabold leading-tight text-on-surface">
                        {metrics.uptime}% <span className="text-3xl font-light text-primary">Uptime</span>
                      </h3>

                      <div className="mt-8 flex h-40 items-end gap-1">
                        {metrics.bars.map((height, index) => (
                          <div
                            key={`${height}-${index}`}
                            className="bar-loop flex-1 rounded-t-sm bg-secondary/20 transition-colors hover:bg-secondary"
                            style={{
                              height: `${height}%`,
                              ["--bar-delay" as string]: `${index * 80}ms`,
                              ["--bar-speed" as string]: "2.3s",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-secondary/5 blur-[100px]" />
                  </div>

                  <div className="col-span-12 flex flex-col gap-6 lg:col-span-4">
                    <div className="flex-1 rounded-xl bg-surface-high p-8">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Avg Response</span>
                        <Zap className="h-5 w-5 text-primary" />
                      </div>
                      <div className="mt-7">
                        <span className="font-display text-6xl font-extrabold text-on-surface">{metrics.avgResponse}</span>
                        <span className="ml-1 text-2xl font-bold text-primary">ms</span>
                        <p className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-secondary">
                          <ChevronRight className={`h-3 w-3 ${metrics.trend <= 0 ? "rotate-90" : "-rotate-90"}`} />
                          {Math.abs(metrics.trend)}% {metrics.trend <= 0 ? "faster" : "slower"} than last week
                        </p>
                      </div>
                    </div>

                    <div className="flex-1 rounded-xl bg-surface-high p-8">
                      <div className="flex items-start justify-between">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Global Availability</span>
                        <Globe className="h-5 w-5 text-primary" />
                      </div>
                      <div className="mt-7">
                        <span className="font-display text-6xl font-extrabold text-on-surface">{metrics.nodeCount}</span>
                        <span className="ml-1 text-2xl font-bold text-primary">Nodes</span>
                        <p className="mt-2 text-xs font-medium text-on-surface-variant">Active monitoring regions</p>
                      </div>
                    </div>
                  </div>
                </div>

                <section className="relative overflow-hidden rounded-xl bg-surface-low p-8">
                  <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                    <div>
                      <h3 className="font-display text-3xl font-bold text-on-surface">Alerts & Notifications</h3>
                      <p className="mt-2 max-w-xl text-sm text-on-surface-variant">
                        Configure multi-channel alerts via Slack, Webhooks, and SMS to stay informed the second your
                        services experience latency or downtime.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleShowComingSoon}
                      className="rounded-full border border-primary/20 bg-primary/10 px-6 py-2"
                    >
                      <span className="text-xs font-black uppercase tracking-[0.3em] text-primary">Coming Soon</span>
                    </button>
                  </div>
                  <div className="pointer-events-none absolute right-0 top-0 flex h-full w-1/3 items-center justify-center opacity-10 grayscale">
                    <Bell className="h-40 w-40" />
                  </div>
                </section>

                <section className="space-y-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-display text-lg font-bold uppercase tracking-widest text-on-surface">Recent Incident History</h3>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                      Showing newest results first
                    </span>
                  </div>

                  <DateRangeFilter
                    fromDate={fromDate}
                    toDate={toDate}
                    onFromDateChange={setFromDate}
                    onToDateChange={setToDate}
                  />

                  <div className="space-y-3">
                    <div className="hidden grid-cols-12 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 md:grid">
                      <div className="col-span-4">Event</div>
                      <div className="col-span-2">Status</div>
                      <div className="col-span-2">Date</div>
                      <div className="col-span-2">Response</div>
                      <div className="col-span-2">Region</div>
                    </div>

                    {filteredIncidents.map((incident) => {
                      const resolved = incident.status === "RESOLVED";

                      return (
                        <div
                          key={incident.id}
                          className="grid grid-cols-1 items-center rounded-xl bg-surface-low px-6 py-5 transition-colors hover:bg-surface-base md:grid-cols-12"
                        >
                          <div className="col-span-4 flex items-center gap-4">
                            <div
                              className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                                resolved ? "bg-secondary/10 text-secondary" : "bg-error/10 text-error"
                              }`}
                            >
                              {resolved ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
                            </div>
                            <div>
                              <h4 className="text-sm font-bold text-on-surface">{incident.title}</h4>
                              <p className="text-xs text-on-surface-variant">{incident.detail}</p>
                            </div>
                          </div>

                          <div className="col-span-2 mt-4 md:mt-0">
                            <span
                              className={`rounded px-3 py-1 text-[10px] font-bold ${
                                resolved
                                  ? "border border-secondary/20 bg-secondary/10 text-secondary"
                                  : "border border-error/20 bg-error/10 text-error"
                              }`}
                            >
                              {incident.status}
                            </span>
                          </div>

                          <div className="col-span-2 mt-2 text-sm text-on-surface-variant md:mt-0">{incident.dateLabel}</div>
                          <div className="col-span-2 mt-2 text-sm font-semibold text-on-surface md:mt-0">{incident.responseLabel}</div>
                          <div className="col-span-2 mt-2 text-sm text-on-surface-variant md:mt-0">{incident.regionLabel}</div>
                        </div>
                      );
                    })}

                    {!filteredIncidents.length ? (
                      <div className="rounded-xl bg-surface-low px-6 py-5 text-sm text-on-surface-variant">
                        No incidents in the selected date range.
                      </div>
                    ) : null}
                  </div>
                </section>
              </>
            )}
          </div>

          <div className="px-6 pb-6 sm:px-8">
            <Footer className="mt-4 border-surface-high/30" />
          </div>
        </div>
      </div>
    </main>
  );
}
