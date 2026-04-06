"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, ChevronRight, LogOut, Search, Sparkles } from "lucide-react";
import { AppSidebar } from "../layout/AppSidebar";
import { Footer } from "../landing/Footer";
import { DateRangeFilter } from "../shared/DateRangeFilter";
import { useAuthStore } from "../../store/auth-store";
import { fetchDownWebsites, fetchIncidents } from "../../lib/incidents-api";
import type { DownWebsiteItem, IncidentItem } from "../../types/incidents";

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.max(1, Math.floor(diff / (1000 * 60)));
  if (min < 60) return `${min} mins ago`;
  const hour = Math.floor(min / 60);
  if (hour < 24) return `${hour}h ago`;
  return `${Math.floor(hour / 24)}d ago`;
}

export function IncidentsPortal() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const logout = useAuthStore((state) => state.logout);

  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [search, setSearch] = useState("");
  const [rows, setRows] = useState<IncidentItem[]>([]);
  const [downWebsites, setDownWebsites] = useState<DownWebsiteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      router.replace("/sign");
    }
  }, [router, token]);

  useEffect(() => {
    async function loadData() {
      if (!token) return;

      try {
        setIsLoading(true);
        setError("");
        const [incidents, downs] = await Promise.all([
          fetchIncidents(token, { from: fromDate || undefined, to: toDate || undefined, limit: 30 }),
          fetchDownWebsites(token, { from: fromDate || undefined, to: toDate || undefined }),
        ]);
        setRows(incidents);
        setDownWebsites(downs);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to load incidents";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    }

    const timeoutId = window.setTimeout(() => {
      void loadData();
    }, 150);

    return () => window.clearTimeout(timeoutId);
  }, [fromDate, toDate, token]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) =>
      `${row.website_url} ${row.region} ${row.status}`.toLowerCase().includes(q),
    );
  }, [rows, search]);

  async function handleLogout() {
    await logout();
    router.replace("/sign");
  }

  const activeCount = filteredRows.filter((row) => row.status === "Down").length;

  return (
    <main className="min-h-screen bg-surface-dim text-on-surface">
      <div className="mx-auto flex min-h-screen w-full max-w-425">
        <AppSidebar
          active="incidents"
          onAddMonitor={() => router.push("/dashboard")}
          onLogout={handleLogout}
          onNavigate={(href) => router.push(href)}
        />

        <div className="flex min-w-0 flex-1 flex-col lg:ml-64">
          <div className="sticky top-0 z-30 bg-surface-dim px-8 py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant">System Pulse</p>
                <h1 className="font-display text-5xl font-extrabold tracking-tight text-on-surface">
                  {activeCount.toString().padStart(2, "0")} <span className="text-primary">Active Alert</span>
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 rounded-md bg-surface-high px-3 py-2">
                  <Search className="h-4 w-4 text-on-surface-variant" />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    className="w-44 bg-transparent text-sm text-on-surface"
                    placeholder="Search incidents..."
                  />
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="inline-flex items-center gap-2 rounded-md bg-surface-high px-4 py-2 text-sm font-bold text-primary transition-colors hover:bg-primary/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6 px-8 pb-8 pt-4">
            <DateRangeFilter
              fromDate={fromDate}
              toDate={toDate}
              onFromDateChange={setFromDate}
              onToDateChange={setToDate}
            />

            {error ? <div className="rounded-lg bg-error/15 px-4 py-2 text-sm text-error">{error}</div> : null}

            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-12 space-y-3 lg:col-span-9">
                <h2 className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Availability alerts</h2>

                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((item) => (
                      <div key={item} className="h-24 animate-pulse rounded-xl bg-surface-low" />
                    ))}
                  </div>
                ) : filteredRows.length ? (
                  filteredRows.slice(0, 8).map((row) => {
                    const down = row.status === "Down";

                    return (
                      <div
                        key={row.id}
                        className="group relative rounded-xl bg-surface-low p-6 transition-all duration-500 hover:bg-surface-base"
                      >
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${down ? "bg-error" : "bg-secondary/40"}`} />
                        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
                          <div className="flex items-start gap-5">
                            <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${down ? "bg-error/10 text-error" : "bg-secondary/10 text-secondary"}`}>
                              {down ? <AlertTriangle className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
                            </div>
                            <div>
                              <div className="mb-1 flex items-center gap-3">
                                <h3 className="font-display text-lg font-bold text-on-surface">{row.title}</h3>
                                <span className={`rounded px-2 py-0.5 text-[10px] font-black uppercase tracking-tight ${down ? "bg-error text-[#200]" : "bg-secondary/20 text-secondary"}`}>
                                  {down ? "Down" : "Resolved"}
                                </span>
                              </div>
                              <p className="text-sm text-on-surface-variant">
                                <span className="font-mono text-primary">{row.website_url}</span> issue in <span className="text-on-surface">{row.region}</span>
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-3 gap-6 text-right">
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Response</p>
                              <p className={down ? "font-bold text-error" : "font-bold text-secondary"}>{row.response_time_ms}ms</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">Checked</p>
                              <p className="text-sm text-on-surface">{timeAgo(row.time_checked)}</p>
                            </div>
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => router.push(`/dashboard/website/${row.website_id}`)}
                                className="rounded-lg bg-surface-high p-2 text-on-surface-variant transition-colors hover:bg-primary/20 hover:text-primary"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="rounded-xl bg-surface-low p-4 text-sm text-on-surface-variant">No incidents found for the selected filters.</div>
                )}
              </div>

              <div className="col-span-12 space-y-6 lg:col-span-3">
                <div className="rounded-xl border border-surface-high/40 bg-surface-base p-5">
                  <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Websites Down In Range</h3>
                  <div className="space-y-3">
                    {isLoading ? (
                      <div className="h-24 animate-pulse rounded bg-surface-high" />
                    ) : downWebsites.length ? (
                      downWebsites.slice(0, 5).map((item) => (
                        <div key={item.website_id} className="rounded-lg bg-surface-high px-3 py-2 text-xs">
                          <p className="truncate font-semibold text-on-surface">{item.website_url}</p>
                          <p className="mt-1 text-error">{item.down_count} down events</p>
                          <p className="mt-1 text-on-surface-variant">{item.regions.join(", ")}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-on-surface-variant">No website outages in selected range.</p>
                    )}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/20 bg-primary/5 p-5">
                  <Sparkles className="mb-3 h-4 w-4 text-primary" />
                  <h3 className="font-display text-sm font-bold text-on-surface">Weekly Summary</h3>
                  <p className="mt-2 text-xs leading-relaxed text-on-surface-variant">
                    Use the calendar filters to inspect outages between specific dates, such as Mar 2 to Mar 5.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-6">
            <Footer className="mt-4 border-surface-high/30" />
          </div>
        </div>
      </div>
    </main>
  );
}
